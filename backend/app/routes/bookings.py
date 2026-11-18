from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models import db
from app.models.booking import Booking, BookingSeat, Passenger, Schedule, Seat, BookingNotification
from app.models.user import User
from app.services.notification_service import NotificationService

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')

def get_current_user_id():
    """Helper to get user_id from Authorization JWT header if present"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = User.verify_auth_token(token)
        if payload:
            return payload.get('sub')
    return None

@bookings_bp.route('', methods=['POST'])
def create_booking():
    """
    Create a bus ticket reservation with concurrency / double-booking conflict prevention.
    """
    try:
        data = request.get_json() or {}
        schedule_id = data.get('schedule_id')
        travel_date = data.get('travel_date') # YYYY-MM-DD
        seat_numbers = data.get('seat_numbers', []) # e.g. ['2A', '2B']
        passengers_data = data.get('passengers', [])

        if not schedule_id or not travel_date or not seat_numbers:
            return jsonify({'error': 'schedule_id, travel_date, and seat_numbers are required'}), 400

        schedule = db.session.get(Schedule, schedule_id)
        if not schedule:
            return jsonify({'error': 'Schedule not found'}), 404

        # Validate that seat_numbers actually exist on the schedule's vehicle
        vehicle_seats = Seat.query.filter_by(vehicle_id=schedule.vehicle_id, is_active=True).all()
        valid_seat_map = {s.seat_number: s for s in vehicle_seats}

        for seat_num in seat_numbers:
            if seat_num not in valid_seat_map:
                return jsonify({'error': f'Seat {seat_num} does not exist on this bus'}), 400

        # Concurrency / Double Booking check
        existing_booked_seats = set(
            seat_num for (seat_num,) in db.session.query(BookingSeat.seat_number).join(Booking).filter(
                Booking.schedule_id == schedule_id,
                Booking.travel_date == travel_date,
                Booking.booking_status == 'CONFIRMED',
                BookingSeat.seat_number.in_(seat_numbers)
            ).all()
        )

        if existing_booked_seats:
            return jsonify({
                'error': f"Seat(s) {', '.join(sorted(existing_booked_seats))} have already been reserved by another commuter. Please choose different seats.",
                'unavailable_seats': list(existing_booked_seats)
            }), 409

        # Calculate total amount
        fare_per_seat = schedule.fare or 40.0
        total_amount = fare_per_seat * len(seat_numbers)

        user_id = get_current_user_id() or data.get('user_id')
        passenger_phone = data.get('passenger_phone') or (passengers_data[0].get('passenger_contact') if passengers_data else None)
        passenger_email = data.get('passenger_email') or data.get('email')
        payment_status = data.get('payment_status', 'SUCCESS')

        # Create Booking
        booking = Booking(
            booking_reference=Booking.generate_reference(),
            user_id=user_id,
            schedule_id=schedule_id,
            travel_date=travel_date,
            departure_time=schedule.departure_time,
            total_passengers=len(seat_numbers),
            total_amount=total_amount,
            passenger_phone=passenger_phone,
            passenger_email=passenger_email,
            booking_status='CONFIRMED',
            payment_status=payment_status,
            booking_source='DEMO BOOKING'
        )
        db.session.add(booking)
        db.session.flush() # Get booking.id

        # Attach BookingSeats
        for seat_num in seat_numbers:
            seat_obj = valid_seat_map[seat_num]
            bs = BookingSeat(
                booking_id=booking.id,
                seat_id=seat_obj.id,
                seat_number=seat_num
            )
            db.session.add(bs)

        # Attach Passengers
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

        db.session.commit()

        # Send automatic SMS and Email booking confirmation if payment succeeded
        notif_results = None
        if payment_status in ('SUCCESS', 'PAID (CONFIRMED)', 'PAID (Paytm)'):
            notif_results = NotificationService.send_booking_notifications(booking)

        return jsonify({
            'message': 'Seat reservation confirmed successfully!',
            'booking': booking.to_dict(),
            'notifications': notif_results
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/<identifier>', methods=['GET'])
def get_booking(identifier):
    """Fetch booking by ID or booking_reference"""
    try:
        booking = None
        if identifier.isdigit():
            booking = db.session.get(Booking, int(identifier))
        if not booking:
            booking = Booking.query.filter_by(booking_reference=identifier.strip()).first()

        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        return jsonify(booking.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>/cancel', methods=['POST'])
def cancel_booking(booking_id):
    """Cancel booking and release reserved seats"""
    try:
        booking = db.session.get(Booking, booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        if booking.booking_status == 'CANCELLED':
            return jsonify({'message': 'Booking is already cancelled', 'booking': booking.to_dict()}), 200

        booking.booking_status = 'CANCELLED'
        booking.payment_status = 'REFUNDED' if booking.payment_status == 'SUCCESS' else 'FAILED'

        # Release any seat reservations
        from app.models.booking import SeatReservation
        reservations = SeatReservation.query.filter_by(booking_id=booking.id).all()
        for r in reservations:
            r.status = 'RELEASED'

        db.session.commit()

        return jsonify({
            'message': f'Booking {booking.booking_reference} cancelled successfully. Seats have been released.',
            'booking': booking.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/verify/<reference>', methods=['GET'])
def verify_digital_ticket(reference):
    """
    Public ticket inspection verification endpoint.
    Used by bus conductors and QR code scanners to authenticate valid boarding passes.
    """
    try:
        clean_ref = reference.strip()
        # If reference has MBC-PASS prefix, extract raw booking reference
        if 'MBC-PASS:' in clean_ref:
            parts = clean_ref.split(':')
            if len(parts) >= 2:
                clean_ref = parts[1]

        booking = Booking.query.filter(
            (Booking.booking_reference == clean_ref) | 
            (Booking.qr_verification_code.ilike(f"%{clean_ref}%"))
        ).first()

        if not booking:
            return jsonify({
                'is_valid': False,
                'status': 'INVALID_TICKET',
                'message': 'No genuine ticket record found matching this QR code.'
            }), 404

        b_dict = booking.to_dict()
        is_active = booking.booking_status == 'CONFIRMED'

        return jsonify({
            'valid': is_active,
            'is_valid': is_active,
            'status': booking.booking_status,
            'booking_reference': booking.booking_reference,
            'travel_date': booking.travel_date,
            'departure_time': booking.departure_time,
            'expected_arrival_time': b_dict.get('expected_arrival_time'),
            'distance_km': b_dict.get('distance_km'),
            'journey_details': {
                'from_stop': b_dict.get('departure_stop_name') or 'Mangaluru Boarding Stop',
                'to_stop': b_dict.get('destination_stop_name') or 'Mangaluru Destination',
                'route_code': b_dict.get('route_code') or '1A',
                'route_name': b_dict.get('route_name') or 'City Transit Line',
                'vehicle_number': b_dict.get('vehicle_number') or 'KA-19-F-1204',
                'travel_date': booking.travel_date,
                'departure_time': booking.departure_time,
                'expected_arrival_time': b_dict.get('expected_arrival_time'),
                'distance_km': b_dict.get('distance_km')
            },
            'seats': [bs.seat_number for bs in booking.seats],
            'passengers': [p.to_dict() for p in booking.passengers],
            'payment': {
                'status': 'PAID' if (booking.payment_status in ('PAID', 'SUCCESS')) else (booking.payment_status or 'PAID'),
                'amount': booking.total_amount
            },
            'verified_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'),
            'authority': 'DKBOA Mangaluru City Transit Authority'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/my-bookings', methods=['GET'])
def get_my_bookings():
    """Retrieve bookings for current user or guest filter by email/reference"""
    try:
        user_id = get_current_user_id()
        ref = request.args.get('reference')

        query = Booking.query.order_by(Booking.created_at.desc())

        if user_id:
            query = query.filter_by(user_id=user_id)
        elif ref:
            query = query.filter(Booking.booking_reference.ilike(f"%{ref.strip()}%"))
        else:
            # Return latest 20 bookings for demo visibility
            query = query.limit(20)

        bookings = query.all()
        return jsonify([b.to_dict() for b in bookings]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/<identifier>/resend-notifications', methods=['POST'])
def resend_notifications(identifier):
    """
    Retry or resend SMS and Email booking confirmations.
    Allows commuters to re-trigger notifications if delivery failed or if updated contact info was provided.
    """
    try:
        booking = None
        if identifier.isdigit():
            booking = db.session.get(Booking, int(identifier))
        if not booking:
            booking = Booking.query.filter_by(booking_reference=identifier.strip()).first()

        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        data = request.get_json() or {}
        # Allow updating contact details on retry if provided
        if data.get('passenger_phone'):
            booking.passenger_phone = data['passenger_phone']
        if data.get('passenger_email'):
            booking.passenger_email = data['passenger_email']
        db.session.commit()

        results = NotificationService.send_booking_notifications(booking, force_resend=True)

        return jsonify({
            'success': True,
            'message': 'Notification dispatch re-triggered.',
            'booking_reference': booking.booking_reference,
            'sms_status': booking.sms_status,
            'email_status': booking.email_status,
            'results': results
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/<identifier>/notifications', methods=['GET'])
def get_booking_notifications(identifier):
    """Retrieve all notification audit logs for a given booking"""
    try:
        booking = None
        if identifier.isdigit():
            booking = db.session.get(Booking, int(identifier))
        if not booking:
            booking = Booking.query.filter_by(booking_reference=identifier.strip()).first()

        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        notifs = BookingNotification.query.filter_by(booking_id=booking.id).order_by(BookingNotification.created_at.desc()).all()
        return jsonify({
            'booking_reference': booking.booking_reference,
            'passenger_phone': booking.passenger_phone,
            'passenger_email': booking.passenger_email,
            'sms_status': booking.sms_status,
            'sms_sent_at': booking.sms_sent_at.isoformat() if booking.sms_sent_at else None,
            'sms_error': booking.sms_error,
            'email_status': booking.email_status,
            'email_sent_at': booking.email_sent_at.isoformat() if booking.email_sent_at else None,
            'email_error': booking.email_error,
            'notifications': [n.to_dict() for n in notifs]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
