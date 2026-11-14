from flask import Blueprint, request, jsonify
from app.models import db
from app.models.stop import BusStop
from app.utils.auth_helpers import admin_required

stops_bp = Blueprint('stops', __name__, url_prefix='/api/stops')

@stops_bp.route('', methods=['GET'])
def get_stops():
    query_str = request.args.get('query', '').strip()
    active_only = request.args.get('active_only', 'true').lower() == 'true'

    stmt = BusStop.query
    if active_only:
        stmt = stmt.filter(BusStop.is_active == True)
    if query_str:
        stmt = stmt.filter(BusStop.name.ilike(f'%{query_str}%'))

    stops = stmt.order_by(BusStop.name).all()
    return jsonify({'stops': [s.to_dict() for s in stops]}), 200

@stops_bp.route('/<int:stop_id>', methods=['GET'])
def get_stop(stop_id):
    stop = BusStop.query.get_or_404(stop_id)
    return jsonify({'stop': stop.to_dict()}), 200

@stops_bp.route('', methods=['POST'])
@admin_required
def create_stop(current_user):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    desc = data.get('location_description', '').strip()

    if not name or latitude is None or longitude is None:
        return jsonify({'error': 'Name, latitude and longitude are required'}), 400

    try:
        lat = float(latitude)
        lon = float(longitude)
    except ValueError:
        return jsonify({'error': 'Latitude and longitude must be valid floating numbers'}), 400

    stop = BusStop(
        name=name,
        location_description=desc,
        latitude=lat,
        longitude=lon,
        is_active=data.get('is_active', True)
    )
    db.session.add(stop)
    db.session.commit()

    return jsonify({'message': 'Bus stop created successfully', 'stop': stop.to_dict()}), 201

@stops_bp.route('/<int:stop_id>', methods=['PUT'])
@admin_required
def update_stop(current_user, stop_id):
    stop = BusStop.query.get_or_404(stop_id)
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        stop.name = data['name'].strip()
    if 'location_description' in data:
        stop.location_description = data['location_description'].strip()
    if 'latitude' in data:
        try:
            stop.latitude = float(data['latitude'])
        except ValueError:
            return jsonify({'error': 'Invalid latitude'}), 400
    if 'longitude' in data:
        try:
            stop.longitude = float(data['longitude'])
        except ValueError:
            return jsonify({'error': 'Invalid longitude'}), 400
    if 'is_active' in data:
        stop.is_active = bool(data['is_active'])

    db.session.commit()
    return jsonify({'message': 'Bus stop updated successfully', 'stop': stop.to_dict()}), 200

@stops_bp.route('/<int:stop_id>', methods=['DELETE'])
@admin_required
def delete_stop(current_user, stop_id):
    stop = BusStop.query.get_or_404(stop_id)
    db.session.delete(stop)
    db.session.commit()
    return jsonify({'message': 'Bus stop deleted successfully'}), 200
