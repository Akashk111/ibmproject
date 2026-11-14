import math
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from app.models import db
from app.models.tracking import BusLocation
from app.models.route import BusRoute, RouteStop
from app.models.stop import BusStop
from app.utils.auth_helpers import get_current_user_from_header

tracking_bp = Blueprint('tracking', __name__, url_prefix='/api/tracking')

DEVICE_API_KEY = "mangaluru-gps-device-secret-key-2025"

def calculate_heading(lat1, lon1, lat2, lon2):
    """Calculate compass heading in degrees from point 1 to point 2."""
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - (math.sin(lat1) * math.cos(lat2) * math.cos(dlon))
    initial_bearing = math.atan2(x, y)
    initial_bearing = math.degrees(initial_bearing)
    compass_bearing = (initial_bearing + 360) % 360
    return round(compass_bearing, 1)

@tracking_bp.route('/buses', methods=['GET'])
def get_tracked_buses():
    """List all tracked buses with their current locations and statuses."""
    route_id = request.args.get('route_id')
    status_filter = request.args.get('status') # 'LIVE', 'DEMO', etc.

    stmt = BusLocation.query.filter_by(is_active=True)
    if route_id:
        stmt = stmt.filter_by(route_id=int(route_id))
    if status_filter:
        stmt = stmt.filter_by(source_type=status_filter.upper())

    buses = stmt.all()
    return jsonify({
        'buses': [b.to_dict() for b in buses],
        'total_count': len(buses),
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@tracking_bp.route('/buses/<int:bus_id>', methods=['GET'])
def get_bus_detail(bus_id):
    bus = BusLocation.query.get_or_404(bus_id)
    return jsonify({'bus': bus.to_dict()}), 200

@tracking_bp.route('/routes/<int:route_id>', methods=['GET'])
def get_buses_for_route(route_id):
    buses = BusLocation.query.filter_by(route_id=route_id, is_active=True).all()
    route = db.session.get(BusRoute, route_id)
    stops = [rs.to_dict() for rs in sorted(route.route_stops, key=lambda x: x.stop_sequence)] if route else []
    return jsonify({
        'route_id': route_id,
        'route_code': route.route_code if route else None,
        'buses': [b.to_dict() for b in buses],
        'route_stops': stops
    }), 200

@tracking_bp.route('/location', methods=['POST'])
def ingest_gps_location():
    """
    Protected GPS ingestion endpoint for live vehicle tracking devices.
    Validates API key, coordinates range, vehicle ID, and updates/creates location record.
    """
    # Verify Authorization: either X-Device-Key or Admin Bearer Token
    device_key = request.headers.get('X-Device-Key')
    current_user = get_current_user_from_header()

    if device_key != DEVICE_API_KEY and (not current_user or current_user.role != 'admin'):
        return jsonify({'error': 'Unauthorized GPS ingestion request. Valid device key or admin token required.'}), 401

    data = request.get_json() or {}
    vehicle_id = data.get('vehicle_id', '').strip()
    route_id = data.get('route_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    speed = data.get('speed', 25.0)
    heading = data.get('heading', 0.0)
    source_type = data.get('source_type', 'LIVE').upper()

    if not vehicle_id or latitude is None or longitude is None or not route_id:
        return jsonify({'error': 'vehicle_id, route_id, latitude, and longitude are required'}), 400

    try:
        lat = float(latitude)
        lon = float(longitude)
        # Validate coordinates within reasonable Karnataka / India ranges
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            return jsonify({'error': 'Latitude or longitude out of geographic bounds'}), 400
    except ValueError:
        return jsonify({'error': 'Coordinates must be valid numbers'}), 400

    # Find existing or create new tracked vehicle
    bus = BusLocation.query.filter_by(vehicle_id=vehicle_id).first()
    if not bus:
        bus = BusLocation(
            vehicle_id=vehicle_id,
            vehicle_name=data.get('vehicle_name', f"Bus {vehicle_id}"),
            route_id=int(route_id)
        )
        db.session.add(bus)

    bus.route_id = int(route_id)
    bus.latitude = lat
    bus.longitude = lon
    bus.speed = float(speed)
    bus.heading = float(heading)
    bus.source_type = source_type
    bus.recorded_at = datetime.utcnow()
    bus.is_active = True

    if 'next_stop_id' in data:
        bus.next_stop_id = data['next_stop_id']
    if 'eta_minutes' in data:
        bus.eta_minutes = int(data['eta_minutes'])

    db.session.commit()

    return jsonify({
        'message': 'GPS location recorded successfully',
        'bus': bus.to_dict()
    }), 200

@tracking_bp.route('/simulate-step', methods=['POST'])
def simulate_demo_step():
    """
    Advances simulated demo buses along their route stops coordinates smoothly.
    Called periodically by frontend or timer to provide realistic bus motion without fake GPS claims.
    """
    demo_buses = BusLocation.query.filter_by(source_type='DEMO', is_active=True).all()
    updated = []

    for bus in demo_buses:
        route = bus.route
        if not route or not route.route_stops:
            continue

        stops = sorted(route.route_stops, key=lambda x: x.stop_sequence)
        if len(stops) < 2:
            continue

        # Find closest next stop or cycle
        curr_next_id = bus.next_stop_id
        curr_idx = 0
        for i, s in enumerate(stops):
            if s.stop_id == curr_next_id:
                curr_idx = i
                break

        # Target next stop
        target_idx = (curr_idx + 1) % len(stops)
        target_stop = stops[target_idx].stop

        # Interpolate coordinates smoothly towards target stop (approx 15% distance per tick)
        d_lat = (target_stop.latitude - bus.latitude)
        d_lon = (target_stop.longitude - bus.longitude)
        dist_remain = math.sqrt(d_lat**2 + d_lon**2)

        if dist_remain < 0.002: # Arrived at stop, transition to next
            bus.latitude = target_stop.latitude
            bus.longitude = target_stop.longitude
            bus.next_stop_id = stops[(target_idx + 1) % len(stops)].stop_id
            bus.eta_minutes = max(2, stops[target_idx].arrival_offset_minutes % 15)
        else:
            step = 0.20 # move 20% closer per tick
            bus.latitude += d_lat * step
            bus.longitude += d_lon * step
            bus.heading = calculate_heading(bus.latitude, bus.longitude, target_stop.latitude, target_stop.longitude)
            bus.speed = round(28.0 + (target_idx * 2) % 10, 1) # realistic city speed 28-38 km/h
            bus.next_stop_id = target_stop.id
            bus.eta_minutes = max(1, int(dist_remain * 150))

        bus.recorded_at = datetime.utcnow()
        updated.append(bus.to_dict())

    db.session.commit()
    return jsonify({
        'status': 'Simulation step executed',
        'updated_buses': updated
    }), 200
