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

        # Query active temporary seat holds
        from app.models.booking import SeatReservation
        now_utc = datetime.utcnow()
        held_seat_numbers = set(
            r.seat_number for r in SeatReservation.query.filter(
                SeatReservation.schedule_id == schedule_id,
                SeatReservation.travel_date == travel_date,
                SeatReservation.status == 'HELD',
                SeatReservation.expires_at > now_utc
            ).all()
        )

        seats_data = []
        for s in sorted_seats:
            if s.seat_number in booked_seat_numbers:
                status = 'OCCUPIED'
            elif s.seat_number in held_seat_numbers:
                status = 'HELD'
            else:
                status = 'AVAILABLE'

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
            'held_seats': sum(1 for s in seats_data if s['status'] == 'HELD'),
            'seats': seats_data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@schedules_bp.route('/popular', methods=['GET'])
def get_popular_schedules():
    """
    Returns verified popular bus services for the homepage showcase.
    Includes AC Sleeper, Semi-Sleeper, AC Seater, Non-AC Seater, and Non-AC Sleeper.
    """
    from app.algorithms.road_routing import get_accurate_road_distance

    try:
        schedules = Schedule.query.filter_by(booking_enabled=True).limit(8).all()
        results = []

        bus_image_map = {
            'AC Sleeper': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
            'Semi-Sleeper': 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
            'A/C Coastal Express': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
            'Non-AC Sleeper': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
            'Non-AC Seater': 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
            'Standard City Bus': 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'
        }

        for s in schedules:
            dep_stop = s.departure_stop
            dest_stop = s.destination_stop
            dist_km = 18.5
            if dep_stop and dest_stop:
                try:
                    road_res = get_accurate_road_distance(
                        dep_stop.latitude, dep_stop.longitude,
                        dest_stop.latitude, dest_stop.longitude,
                        dep_stop.id, dest_stop.id
                    )
                    dist_km = road_res.get('distance_km', 18.5)
                except Exception:
                    pass

            v_type = s.vehicle.vehicle_type if s.vehicle else 'AC Seater'
            img = bus_image_map.get(v_type, 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80')

            results.append({
                'id': s.id,
                'vehicle_number': s.vehicle.vehicle_number if s.vehicle else 'KA-19-F-1204',
                'vehicle_name': s.vehicle.vehicle_name if s.vehicle else 'Coastal Express',
                'operator': s.vehicle.operator if s.vehicle else 'DKBOA Mangaluru',
                'vehicle_type': v_type,
                'origin': dep_stop.name if dep_stop else 'State Bank',
                'destination': dest_stop.name if dest_stop else 'Surathkal',
                'departure_time': s.departure_time,
                'arrival_time': s.arrival_time,
                'duration': f"{s.estimated_duration_minutes // 60}h {s.estimated_duration_minutes % 60}m" if s.estimated_duration_minutes >= 60 else f"{s.estimated_duration_minutes} mins",
                'distance_km': dist_km,
                'fare': s.fare,
                'available_seats': max(4, (s.vehicle.total_seats if s.vehicle else 32) - len(s.bookings)),
                'total_seats': s.vehicle.total_seats if s.vehicle else 32,
                'booking_enabled': s.booking_enabled,
                'verification_status': s.verification_status,
                'image': img
            })

        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
