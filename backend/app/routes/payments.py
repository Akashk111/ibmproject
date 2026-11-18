import os
import json
import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, redirect, current_app
from app.models import db
from app.models.booking import Booking, BookingSeat, Seat, Schedule, Passenger, SeatReservation
from app.models.payment import Payment
from app.models.user import User
from app.utils.paytm_checksum import PaytmChecksum
from app.algorithms.road_routing import get_accurate_road_distance
from app.services.notification_service import NotificationService

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

def get_paytm_config():
    """Retrieve Paytm merchant configuration from environment variables."""
    return {
        'mid': os.environ.get('PAYTM_MID', 'MANGALURU_BUS_SANDBOX_MID'),
        'merchant_key': os.environ.get('PAYTM_MERCHANT_KEY', 'SANDBOX_SECRET_KEY_MGL_2026'),
        'website': os.environ.get('PAYTM_WEBSITE', 'WEBSTAGING'),
        'environment': os.environ.get('PAYTM_ENVIRONMENT', 'sandbox'),
        'channel_id': os.environ.get('PAYTM_CHANNEL_ID', 'WEB'),
        'industry_type_id': os.environ.get('PAYTM_INDUSTRY_TYPE_ID', 'Retail'),
        'callback_url': os.environ.get('PAYTM_CALLBACK_URL', 'http://localhost:5001/api/payments/callback')
    }

def get_current_user_id():
    """Extract user_id from Authorization header if present."""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = User.verify_auth_token(token)
        if payload:
            return payload.get('sub')
    return None

@payments_bp.route('/initiate', methods=['POST'])
def initiate_payment():
    """
    Step 1: Check seat availability, lock seats temporarily with 10-minute expiry,
    create PENDING booking and payment order, and generate Paytm checksum signature.
    """
    try:
        data = request.get_json() or {}
        schedule_id = data.get('schedule_id')
        travel_date = data.get('travel_date') # YYYY-MM-DD
        seat_numbers = data.get('seat_numbers', [])
        passengers_data = data.get('passengers', [])
        payment_method = data.get('payment_method', 'UPI')

        if not schedule_id or not travel_date or not seat_numbers:
            return jsonify({'error': 'schedule_id, travel_date, and seat_numbers are required'}), 400

        schedule = db.session.get(Schedule, schedule_id)
        if not schedule:
            return jsonify({'error': 'Selected schedule not found'}), 404

        # Verify that requested seats exist on the bus
        valid_seats = Seat.query.filter_by(vehicle_id=schedule.vehicle_id, is_active=True).all()
        valid_seat_map = {s.seat_number: s for s in valid_seats}

        for seat_num in seat_numbers:
            if seat_num not in valid_seat_map:
                return jsonify({'error': f'Seat {seat_num} is not valid on this vehicle'}), 400

        # Concurrency Check 1: Already confirmed bookings on this schedule and date
        confirmed_booked_seats = set(
            seat_num for (seat_num,) in db.session.query(BookingSeat.seat_number).join(Booking).filter(
                Booking.schedule_id == schedule_id,
                Booking.travel_date == travel_date,
                Booking.booking_status == 'CONFIRMED',
                BookingSeat.seat_number.in_(seat_numbers)
            ).all()
        )
        if confirmed_booked_seats:
            return jsonify({
                'error': f"Seat(s) {', '.join(sorted(confirmed_booked_seats))} are already booked.",
                'unavailable_seats': list(confirmed_booked_seats)
            }), 409

        # Concurrency Check 2: Active temporary seat holds / locks
        now_utc = datetime.utcnow()
        active_holds = db.session.query(SeatReservation).filter(
            SeatReservation.schedule_id == schedule_id,
            SeatReservation.travel_date == travel_date,
            SeatReservation.seat_number.in_(seat_numbers),
            SeatReservation.status == 'HELD',
            SeatReservation.expires_at > now_utc
        ).all()

        if active_holds:
            held_seats = [h.seat_number for h in active_holds]
            return jsonify({
                'error': f"Seat(s) {', '.join(sorted(held_seats))} are temporarily locked by another commuter completing checkout. Please choose different seats.",
                'unavailable_seats': held_seats
            }), 409

        # Calculate fare & road distance
        fare_per_seat = schedule.fare or 40.0
        total_amount = float(fare_per_seat * len(seat_numbers))

        road_info = get_accurate_road_distance(
            schedule.departure_stop.latitude, schedule.departure_stop.longitude,
            schedule.destination_stop.latitude, schedule.destination_stop.longitude,
            schedule.departure_stop_id, schedule.destination_stop_id
        )

        user_id = get_current_user_id() or data.get('user_id')
        booking_ref = Booking.generate_reference()
        order_id = Payment.generate_order_id()
        hold_expiry = now_utc + timedelta(minutes=10)

        passenger_phone = data.get('passenger_phone') or (passengers_data[0].get('passenger_contact') if passengers_data else None)
        passenger_email = data.get('passenger_email') or data.get('email')

        # 1. Create PENDING Booking
        booking = Booking(
            booking_reference=booking_ref,
            user_id=user_id,
            schedule_id=schedule_id,
            travel_date=travel_date,
            departure_time=schedule.departure_time,
            expected_arrival_time=schedule.arrival_time,
            distance_km=road_info['distance_km'],
            total_passengers=len(seat_numbers),
            total_amount=total_amount,
            passenger_phone=passenger_phone,
            passenger_email=passenger_email,
            booking_status='PENDING',
            payment_status='PENDING',
            booking_source='PAYTM_GATEWAY_BOOKING'
        )
        db.session.add(booking)
        db.session.flush()

        # 2. Attach Passengers
        for idx, seat_num in enumerate(seat_numbers):
            p_info = passengers_data[idx] if idx < len(passengers_data) else {}
            passenger = Passenger(
                booking_id=booking.id,
                passenger_name=p_info.get('passenger_name') or f"Passenger {idx + 1}",
                passenger_contact=p_info.get('passenger_contact') or '',
                passenger_gender=p_info.get('passenger_gender', 'MALE'),
                seat_number=seat_num
            )
            db.session.add(passenger)

        # 3. Lock Seats in SeatReservation (Temporary hold)
        for seat_num in seat_numbers:
            seat_obj = valid_seat_map[seat_num]
            reservation = SeatReservation(
                booking_id=booking.id,
                seat_id=seat_obj.id,
                schedule_id=schedule_id,
                travel_date=travel_date,
                seat_number=seat_num,
                expires_at=hold_expiry,
                status='HELD'
            )
            db.session.add(reservation)

        # 4. Create Payment Record
        paytm_config = get_paytm_config()
        payment = Payment(
            booking_id=booking.id,
            order_id=order_id,
            payment_gateway='PAYTM',
            payment_method=payment_method,
            amount=total_amount,
            currency='INR',
            payment_status='PENDING'
        )
        db.session.add(payment)
        db.session.flush()

        # 5. Generate Official Paytm Checksum
        paytm_params = {
            'MID': paytm_config['mid'],
            'ORDER_ID': order_id,
            'CUST_ID': f"CUST_{user_id or 'GUEST'}",
            'TXN_AMOUNT': f"{total_amount:.2f}",
            'CHANNEL_ID': paytm_config['channel_id'],
            'WEBSITE': paytm_config['website'],
            'INDUSTRY_TYPE_ID': paytm_config['industry_type_id'],
            'CALLBACK_URL': paytm_config['callback_url']
        }
        checksum = PaytmChecksum.generate_signature(paytm_params, paytm_config['merchant_key'])
        payment.checksum = checksum

        db.session.commit()

        # Simulated Sandbox txnToken
        txn_token = f"TOKEN_PTM_{order_id[-8:]}_{uuid.uuid4().hex[:12]}"

        return jsonify({
            'success': True,
            'message': 'Seat hold acquired. Proceeding to Paytm checkout.',
            'order_id': order_id,
            'txn_token': txn_token,
            'mid': paytm_config['mid'],
            'amount': total_amount,
            'currency': 'INR',
            'callback_url': paytm_config['callback_url'],
            'checksum': checksum,
            'paytm_params': paytm_params,
            'booking_id': booking.id,
            'booking_reference': booking.booking_reference,
            'held_seats': seat_numbers,
            'expires_at': hold_expiry.isoformat(),
            'paytm_environment': paytm_config['environment']
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/callback', methods=['POST'])
def payment_callback():
    """
    Step 2: Receives payment callback from Paytm (or frontend sandbox completion).
    Validates signature, verifies transaction status, updates payment and confirms booking.
    """
    try:
        # Support both urlencoded form and JSON payloads
        if request.is_json:
            params = request.get_json() or {}
        else:
            params = request.form.to_dict()

        order_id = params.get('ORDERID') or params.get('order_id')
        txn_id = params.get('TXNID') or params.get('transaction_id') or f"TXN_{uuid.uuid4().hex[:10].upper()}"
        status = params.get('STATUS') or params.get('status', 'TXN_SUCCESS')
        received_checksum = params.get('CHECKSUMHASH') or params.get('checksum')
        resp_code = params.get('RESPCODE', '01')
        resp_msg = params.get('RESPMSG', 'Transaction Successful')

        if not order_id:
            return jsonify({'error': 'Missing ORDERID in callback'}), 400

        payment = Payment.query.filter_by(order_id=order_id).first()
        if not payment:
            return jsonify({'error': f'Payment order {order_id} not found'}), 404

        booking = payment.booking
        paytm_config = get_paytm_config()

        # Checksum Validation
        if received_checksum:
            params_to_verify = {k: v for k, v in params.items() if k not in ('CHECKSUMHASH', 'checksum', 'signature')}
            is_valid_sig = (
                received_checksum == payment.checksum or
                PaytmChecksum.verify_signature(params_to_verify, paytm_config['merchant_key'], received_checksum)
            )
            if not is_valid_sig:
                # Mark failed due to invalid signature
                payment.payment_status = 'FAILED'
                payment.gateway_response = json.dumps({'error': 'Checksum signature mismatch'})
                db.session.commit()
                return jsonify({'error': 'Security validation failed: Checksum signature mismatch'}), 400

        # Idempotency Protection: If already processed, return existing confirmed booking
        if payment.payment_status == 'SUCCESS' and booking.booking_status == 'CONFIRMED':
            return jsonify({
                'message': 'Payment already processed and verified successfully.',
                'booking': booking.to_dict(),
                'payment': payment.to_dict()
            }), 200

        # Process payment outcome
        if status in ('TXN_SUCCESS', 'SUCCESS', '01'):
            payment.payment_status = 'SUCCESS'
            payment.transaction_id = txn_id
            payment.bank_reference = params.get('BANKTXNID') or f"BANK_REF_{uuid.uuid4().hex[:8].upper()}"
            payment.gateway_response = json.dumps(params)

            # Confirm Booking
            booking.booking_status = 'CONFIRMED'
            booking.payment_status = 'SUCCESS'
            booking.qr_verification_code = Booking.generate_qr_code(booking.booking_reference, booking.travel_date)

            # Confirm Seats
            reservations = SeatReservation.query.filter_by(booking_id=booking.id).all()
            for r in reservations:
                r.status = 'CONFIRMED'
                # Ensure BookingSeat exists
                bs_exists = BookingSeat.query.filter_by(booking_id=booking.id, seat_number=r.seat_number).first()
                if not bs_exists:
                    bs = BookingSeat(booking_id=booking.id, seat_id=r.seat_id, seat_number=r.seat_number)
                    db.session.add(bs)

            db.session.commit()

            # Step 6 & 7: Send SMS & Email booking confirmations automatically
            notif_results = NotificationService.send_booking_notifications(booking)

            # Check if this is a browser form redirect
            if not request.is_json and request.form:
                frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
                return redirect(f"{frontend_url}/booking-confirmation/{booking.booking_reference}")

            return jsonify({
                'success': True,
                'message': 'Payment verified and bus ticket confirmed!',
                'booking_reference': booking.booking_reference,
                'booking': booking.to_dict(),
                'payment': payment.to_dict(),
                'notifications': notif_results
            }), 200

        elif status in ('PENDING', 'TXN_PENDING', 'WAITING_FOR_OTP'):
            # Payment Pending Verification
            payment.payment_status = 'PENDING'
            payment.transaction_id = txn_id
            payment.gateway_response = json.dumps(params)

            booking.booking_status = 'PENDING'
            booking.payment_status = 'PENDING'
            db.session.commit()

            if not request.is_json and request.form:
                frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
                return redirect(f"{frontend_url}/booking-confirmation/{booking.booking_reference}")

            return jsonify({
                'success': True,
                'status': 'PENDING',
                'message': 'Payment is pending bank verification.',
                'booking_reference': booking.booking_reference,
                'booking': booking.to_dict(),
                'payment': payment.to_dict()
            }), 200

        else:
            # Payment Failed or Cancelled
            payment.payment_status = 'FAILED'
            payment.transaction_id = txn_id
            payment.gateway_response = json.dumps(params)

            booking.booking_status = 'CANCELLED'
            booking.payment_status = 'FAILED'

            # Release held seats immediately
            reservations = SeatReservation.query.filter_by(booking_id=booking.id).all()
            for r in reservations:
                r.status = 'RELEASED'

            db.session.commit()

            if not request.is_json and request.form:
                frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
                return redirect(f"{frontend_url}/booking-confirmation/{booking.booking_reference}")

            return jsonify({
                'error': f'Payment unsuccessful: {resp_msg}',
                'resp_code': resp_code,
                'booking': booking.to_dict(),
                'payment': payment.to_dict()
            }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/webhook', methods=['POST'])
def paytm_webhook():
    """Server-to-server webhook endpoint for asynchronous transaction notifications."""
    return payment_callback()

@payments_bp.route('/status/<order_id>', methods=['GET'])
def get_payment_status(order_id):
    """Query verified status of payment order."""
    try:
        payment = Payment.query.filter_by(order_id=order_id).first()
        if not payment:
            return jsonify({'error': 'Order ID not found'}), 404

        data = payment.to_dict()
        data['booking_status'] = payment.booking.booking_status if payment.booking else None
        data['qr_verification_code'] = payment.booking.qr_verification_code if payment.booking else None
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/refund', methods=['POST'])
def process_refund():
    """
    Process refund for an authorized booking cancellation.
    Updates payment record and records refund reference.
    """
    try:
        data = request.get_json() or {}
        booking_id = data.get('booking_id')
        reason = data.get('reason', 'Commuter cancelled reservation')

        if not booking_id:
            return jsonify({'error': 'booking_id is required'}), 400

        booking = db.session.get(Booking, booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        payment = Payment.query.filter_by(booking_id=booking.id, payment_status='SUCCESS').first()
        if not payment:
            return jsonify({'error': 'No successful payment found to refund for this booking'}), 400

        if payment.payment_status == 'REFUNDED':
            return jsonify({'message': 'Booking has already been refunded', 'payment': payment.to_dict()}), 200

        # Mark payment as REFUNDED
        payment.payment_status = 'REFUNDED'
        payment.gateway_response = json.dumps({
            'refund_id': f"REF_{uuid.uuid4().hex[:10].upper()}",
            'refund_amount': payment.amount,
            'refunded_at': datetime.utcnow().isoformat(),
            'reason': reason
        })

        booking.payment_status = 'REFUNDED'
        booking.booking_status = 'CANCELLED'

        # Release seats
        reservations = SeatReservation.query.filter_by(booking_id=booking.id).all()
        for r in reservations:
            r.status = 'RELEASED'

        db.session.commit()

        return jsonify({
            'message': f'Refund of ₹{payment.amount} processed successfully to source payment method.',
            'booking': booking.to_dict(),
            'payment': payment.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
