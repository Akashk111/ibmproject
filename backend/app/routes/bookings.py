from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models import db
from app.models.booking import Booking, BookingSeat, Passenger, Schedule, Seat
from app.models.user import User

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

        # Create Booking
        booking = Booking(
            booking_reference=Booking.generate_reference(),
            user_id=user_id,
            schedule_id=schedule_id,
            travel_date=travel_date,
            departure_time=schedule.departure_time,
            total_passengers=len(seat_numbers),
            total_amount=total_amount,
            booking_status='CONFIRMED',
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

        return jsonify({
            'message': 'Seat reservation confirmed successfully!',
            'booking': booking.to_dict()
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
        db.session.commit()

        return jsonify({
            'message': f'Booking {booking.booking_reference} cancelled successfully. Seats have been released.',
            'booking': booking.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
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
