from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models import db
from app.models.booking import Schedule, Vehicle, Seat, Booking, BookingSeat
from app.models.stop import BusStop

schedules_bp = Blueprint('schedules', __name__, url_prefix='/api/schedules')

@schedules_bp.route('', methods=['GET'])
def get_all_schedules():
    try:
        route_id = request.args.get('route_id')
        query = Schedule.query
        if route_id:
            query = query.filter_by(route_id=int(route_id))
        schedules = query.all()
        return jsonify([s.to_dict() for s in schedules]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@schedules_bp.route('/<int:schedule_id>', methods=['GET'])
def get_schedule(schedule_id):
    try:
        schedule = db.session.get(Schedule, schedule_id)
        if not schedule:
            return jsonify({'error': 'Schedule not found'}), 404
        return jsonify(schedule.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@schedules_bp.route('/search', methods=['GET'])
def search_schedules():
    """
    Search bus schedules by origin stop, destination stop, date and optional time slot.
    """
    try:
        origin_id = request.args.get('origin_id', type=int)
        destination_id = request.args.get('destination_id', type=int)
        travel_date = request.args.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
        time_slot = request.args.get('time_slot') # 'morning', 'afternoon', 'evening', 'night'

        query = Schedule.query

        if origin_id:
            query = query.filter_by(departure_stop_id=origin_id)
        if destination_id:
            query = query.filter_by(destination_stop_id=destination_id)

        schedules = query.all()

        # If date provided, check day of week filter
        try:
            target_date = datetime.strptime(travel_date, '%Y-%m-%d')
            day_abbr = target_date.strftime('%a') # Mon, Tue, etc.
            schedules = [s for s in schedules if not s.operating_days or day_abbr in s.operating_days]
        except Exception:
            pass

        results = []
        for s in schedules:
            data = s.to_dict()
            # Calculate total booked seats for this date
            booked_seat_count = db.session.query(BookingSeat).join(Booking).filter(
                Booking.schedule_id == s.id,
                Booking.travel_date == travel_date,
                Booking.booking_status == 'CONFIRMED'
            ).count()

            total_seats = s.vehicle.total_seats if s.vehicle else 32
            available_seats = max(0, total_seats - booked_seat_count)

            data['travel_date'] = travel_date
            data['total_seats'] = total_seats
            data['available_seats'] = available_seats
            results.append(data)

        # Sort by departure time
        results.sort(key=lambda x: x.get('departure_time', ''))

        return jsonify({
            'count': len(results),
            'travel_date': travel_date,
            'schedules': results
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@schedules_bp.route('/<int:schedule_id>/seats', methods=['GET'])
def get_schedule_seat_availability(schedule_id):
    """
    Get 32-seat layout and status (AVAILABLE or OCCUPIED) for a specific schedule and travel date.
    """
    try:
        schedule = db.session.get(Schedule, schedule_id)
        if not schedule:
            return jsonify({'error': 'Schedule not found'}), 404

        travel_date = request.args.get('date', datetime.utcnow().strftime('%Y-%m-%d'))

        # Fetch vehicle seats
        seats = Seat.query.filter_by(vehicle_id=schedule.vehicle_id, is_active=True).all()
        sorted_seats = sorted(seats, key=lambda s: (s.row_number, s.column_position))

        # Query booked seats for this schedule and date
        booked_seat_numbers = set(
            seat_num for (seat_num,) in db.session.query(BookingSeat.seat_number).join(Booking).filter(
                Booking.schedule_id == schedule_id,
                Booking.travel_date == travel_date,
                Booking.booking_status == 'CONFIRMED'
            ).all()
        )

        seats_data = []
        for s in sorted_seats:
            status = 'OCCUPIED' if s.seat_number in booked_seat_numbers else 'AVAILABLE'
            seats_data.append({
                'id': s.id,
                'seat_number': s.seat_number,
                'seat_type': s.seat_type,
                'row_number': s.row_number,
                'column_position': s.column_position,
                'status': status
            })

        return jsonify({
            'schedule_id': schedule.id,
            'vehicle_number': schedule.vehicle.vehicle_number if schedule.vehicle else None,
            'vehicle_name': schedule.vehicle.vehicle_name if schedule.vehicle else None,
            'travel_date': travel_date,
            'fare_per_seat': schedule.fare,
            'total_seats': len(seats_data),
            'available_seats': sum(1 for s in seats_data if s['status'] == 'AVAILABLE'),
            'occupied_seats': sum(1 for s in seats_data if s['status'] == 'OCCUPIED'),
            'seats': seats_data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
