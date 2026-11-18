import re
from flask import Blueprint, request, jsonify
from app.models import db
from app.models.stop import BusStop
from app.models.route import BusRoute, BusService
from app.models.place import Place
from app.models.user_data import SearchHistory
from app.utils.auth_helpers import get_current_user_from_header
from app.algorithms.journey_planner import JourneyPlanner

journeys_bp = Blueprint('journeys', __name__, url_prefix='/api/journey')

def resolve_stop_identifier(val):
    """Safely resolve an integer stop ID or a location string/alias to a valid BusStop ID."""
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        pass
    
    s_val = str(val).strip()
    # Strip qualifiers like ', Mangaluru'
    clean_val = re.sub(r'(?i)[,\s]+(mangaluru|mangalore|dakshina kannada|karnataka|india|city).*$', '', s_val).strip()
    if not clean_val:
        clean_val = s_val

    # Exact or substring match on stop name
    stop = BusStop.query.filter(BusStop.name.ilike(clean_val)).first()
    if not stop:
        stop = BusStop.query.filter(BusStop.name.ilike(f"%{clean_val}%")).first()
    if stop:
        return stop.id

    # Check Place / Landmark
    place = Place.query.filter(Place.name.ilike(f"%{clean_val}%")).first()
    if place and place.nearest_stop_id:
        return place.nearest_stop_id

    # Fallback to State Bank for generic Mangaluru
    if clean_val.lower() in ['mangaluru', 'mangalore']:
        sb = BusStop.query.filter(BusStop.name.ilike('State Bank')).first()
        if sb:
            return sb.id

    return None

@journeys_bp.route('/search', methods=['POST'])
def search_journey():
    data = request.get_json() or {}
    raw_source = data.get('source_stop_id') or data.get('source_id') or data.get('sourceId') or data.get('source')
    raw_dest = data.get('destination_stop_id') or data.get('dest_stop_id') or data.get('destId') or data.get('destination_id') or data.get('destination')
    departure_time = data.get('departure_time')  # optional "HH:MM"
    day_of_week = data.get('day_of_week')        # optional "Mon", "Tue", etc.

    if not raw_source or not raw_dest:
        return jsonify({'error': 'Source and destination stops must be specified'}), 400

    source_id = resolve_stop_identifier(raw_source)
    destination_id = resolve_stop_identifier(raw_dest)

    if not source_id or not destination_id:
        return jsonify({'error': 'Invalid stop identifiers or location could not be resolved'}), 400

    if source_id == destination_id:
        return jsonify({'error': 'Source and destination stops cannot be the same'}), 400

    # Save to search history if authenticated or guest
    current_user = get_current_user_from_header()
    try:
        history_entry = SearchHistory(
            user_id=current_user.id if current_user else None,
            source_stop_id=source_id,
            destination_stop_id=destination_id
        )
        db.session.add(history_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    planner = JourneyPlanner()
    result = planner.plan_journey(
        source_stop_id=source_id,
        destination_stop_id=destination_id,
        departure_time_str=departure_time,
        day_of_week=day_of_week
    )

    return jsonify(result), 200

@journeys_bp.route('/stats', methods=['GET'])
def get_stats():
    """Return database-driven platform statistics."""
    total_stops = BusStop.query.filter_by(is_active=True).count()
    total_routes = BusRoute.query.filter_by(is_active=True).count()
    total_services = BusService.query.count()

    return jsonify({
        'total_stops': total_stops,
        'total_routes': total_routes,
        'total_services': total_services,
        'coverage_area': 'Mangaluru Urban & Suburban Agglomeration',
        'transit_hub': 'State Bank & Hampankatta'
    }), 200
