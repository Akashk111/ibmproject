from flask import Blueprint, request, jsonify
from app.models import db
from app.models.route import BusRoute, RouteStop, BusService
from app.models.stop import BusStop
from app.utils.auth_helpers import admin_required

routes_bp = Blueprint('routes', __name__, url_prefix='/api/routes')

@routes_bp.route('', methods=['GET'])
def get_routes():
    query_str = request.args.get('query', '').strip()
    origin_id = request.args.get('origin')
    dest_id = request.args.get('destination')
    active_only = request.args.get('active_only', 'true').lower() == 'true'

    stmt = BusRoute.query
    if active_only:
        stmt = stmt.filter(BusRoute.is_active == True)
    if origin_id:
        stmt = stmt.filter(BusRoute.origin_stop_id == int(origin_id))
    if dest_id:
        stmt = stmt.filter(BusRoute.destination_stop_id == int(dest_id))
    if query_str:
        stmt = stmt.filter(
            (BusRoute.route_code.ilike(f'%{query_str}%')) |
            (BusRoute.route_name.ilike(f'%{query_str}%')) |
            (BusRoute.operator.ilike(f'%{query_str}%'))
        )

    routes = stmt.all()
    # Include stops for the route list so users can inspect path quickly
    return jsonify({'routes': [r.to_dict(include_stops=True, include_services=True) for r in routes]}), 200

@routes_bp.route('/<int:route_id>', methods=['GET'])
def get_route(route_id):
    route = BusRoute.query.get_or_404(route_id)
    return jsonify({'route': route.to_dict(include_stops=True, include_services=True)}), 200

@routes_bp.route('', methods=['POST'])
@admin_required
def create_route(current_user):
    data = request.get_json() or {}
    code = data.get('route_code', '').strip()
    name = data.get('route_name', '').strip()
    origin_id = data.get('origin_stop_id')
    dest_id = data.get('destination_stop_id')
    operator = data.get('operator', 'DKBOA Mangaluru').strip()
    status = data.get('verification_status', 'DEMO DATA')

    if not code or not name or not origin_id or not dest_id:
        return jsonify({'error': 'route_code, route_name, origin_stop_id and destination_stop_id are required'}), 400

    if origin_id == dest_id:
        return jsonify({'error': 'Origin and destination stops cannot be the same'}), 400

    # Ensure stops exist
    if not BusStop.query.get(origin_id) or not BusStop.query.get(dest_id):
        return jsonify({'error': 'Specified origin or destination stop does not exist'}), 404

    # Check for duplicate route code
    if BusRoute.query.filter_by(route_code=code).first():
        return jsonify({'error': f'Route with code "{code}" already exists'}), 409

    route = BusRoute(
        route_code=code,
        route_name=name,
        operator=operator,
        origin_stop_id=origin_id,
        destination_stop_id=dest_id,
        is_active=data.get('is_active', True),
        verification_status=status
    )
    db.session.add(route)
    db.session.flush()

    # Add origin and destination to RouteStop automatically if requested
    stops_list = data.get('stops', [])
    if stops_list:
        for item in stops_list:
            rs = RouteStop(
                route_id=route.id,
                stop_id=item['stop_id'],
                stop_sequence=item.get('stop_sequence', 1),
                arrival_offset_minutes=item.get('arrival_offset_minutes', 0),
                departure_offset_minutes=item.get('departure_offset_minutes', 0)
            )
            db.session.add(rs)
    else:
        # Default origin & destination stops
        rs_orig = RouteStop(route_id=route.id, stop_id=origin_id, stop_sequence=1, arrival_offset_minutes=0, departure_offset_minutes=0)
        rs_dest = RouteStop(route_id=route.id, stop_id=dest_id, stop_sequence=2, arrival_offset_minutes=30, departure_offset_minutes=30)
        db.session.add_all([rs_orig, rs_dest])

    db.session.commit()
    return jsonify({'message': 'Route created successfully', 'route': route.to_dict(include_stops=True)}), 201

@routes_bp.route('/<int:route_id>', methods=['PUT'])
@admin_required
def update_route(current_user, route_id):
    route = BusRoute.query.get_or_404(route_id)
    data = request.get_json() or {}

    if 'route_code' in data and data['route_code'].strip():
        route.route_code = data['route_code'].strip()
    if 'route_name' in data and data['route_name'].strip():
        route.route_name = data['route_name'].strip()
    if 'operator' in data:
        route.operator = data['operator'].strip()
    if 'verification_status' in data:
        route.verification_status = data['verification_status']
    if 'is_active' in data:
        route.is_active = bool(data['is_active'])

    db.session.commit()
    return jsonify({'message': 'Route updated successfully', 'route': route.to_dict(include_stops=True)}), 200

@routes_bp.route('/<int:route_id>', methods=['DELETE'])
@admin_required
def delete_route(current_user, route_id):
    route = BusRoute.query.get_or_404(route_id)
    db.session.delete(route)
    db.session.commit()
    return jsonify({'message': 'Route deleted successfully'}), 200

@routes_bp.route('/<int:route_id>/stops', methods=['POST'])
@admin_required
def add_route_stop(current_user, route_id):
    route = BusRoute.query.get_or_404(route_id)
    data = request.get_json() or {}

    stop_id = data.get('stop_id')
    stop_seq = data.get('stop_sequence')
    arr_offset = data.get('arrival_offset_minutes', 0)
    dep_offset = data.get('departure_offset_minutes', arr_offset)

    if not stop_id or not stop_seq:
        return jsonify({'error': 'stop_id and stop_sequence are required'}), 400

    if not BusStop.query.get(stop_id):
        return jsonify({'error': 'Bus stop does not exist'}), 404

    rs = RouteStop(
        route_id=route.id,
        stop_id=stop_id,
        stop_sequence=int(stop_seq),
        arrival_offset_minutes=int(arr_offset),
        departure_offset_minutes=int(dep_offset)
    )
    db.session.add(rs)
    db.session.commit()
    return jsonify({'message': 'Stop added to route successfully', 'route': route.to_dict(include_stops=True)}), 201

@routes_bp.route('/<int:route_id>/services', methods=['POST'])
@admin_required
def add_route_service(current_user, route_id):
    route = BusRoute.query.get_or_404(route_id)
    data = request.get_json() or {}

    departure_time = data.get('departure_time', '').strip()
    duration = data.get('estimated_duration_minutes', 30)
    fare = data.get('fare')
    status = data.get('verification_status', route.verification_status)

    if not departure_time:
        return jsonify({'error': 'departure_time is required'}), 400

    service = BusService(
        route_id=route.id,
        service_name=data.get('service_name', f"Trip on Route {route.route_code}"),
        operating_days=data.get('operating_days', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
        departure_time=departure_time,
        estimated_duration_minutes=int(duration),
        fare=float(fare) if fare is not None else None,
        verification_status=status
    )
    db.session.add(service)
    db.session.commit()
    return jsonify({'message': 'Timetable service added', 'service': service.to_dict()}), 201
