from flask import Blueprint, request, jsonify
from app.models import db
from app.models.booking import Vehicle, Seat

vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')

@vehicles_bp.route('', methods=['GET'])
def get_vehicles():
    try:
        route_id = request.args.get('route_id')
        query = Vehicle.query
        if route_id:
            query = query.filter_by(route_id=int(route_id))
        vehicles = query.all()
        return jsonify([v.to_dict() for v in vehicles]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicles_bp.route('/<int:vehicle_id>', methods=['GET'])
def get_vehicle_details(vehicle_id):
    try:
        vehicle = db.session.get(Vehicle, vehicle_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        data = vehicle.to_dict()
        data['seats'] = [s.to_dict() for s in sorted(vehicle.seats, key=lambda x: (x.row_number, x.column_position))]
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicles_bp.route('/<int:vehicle_id>/seats', methods=['GET'])
def get_vehicle_seats(vehicle_id):
    try:
        seats = Seat.query.filter_by(vehicle_id=vehicle_id, is_active=True).all()
        # Sort by row number and column position (L1, L2, R1, R2)
        sorted_seats = sorted(seats, key=lambda s: (s.row_number, s.column_position))
        return jsonify([s.to_dict() for s in sorted_seats]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicles_bp.route('/featured', methods=['GET'])
def get_featured_fleet():
    try:
        vehicles = Vehicle.query.filter_by(booking_enabled=True).limit(6).all()
        return jsonify([v.to_dict() for v in vehicles]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
