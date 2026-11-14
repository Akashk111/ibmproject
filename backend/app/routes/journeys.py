from flask import Blueprint, request, jsonify
from app.models import db
from app.models.stop import BusStop
from app.models.route import BusRoute, BusService
from app.models.user_data import SearchHistory
from app.utils.auth_helpers import get_current_user_from_header
from app.algorithms.journey_planner import JourneyPlanner

journeys_bp = Blueprint('journeys', __name__, url_prefix='/api/journey')

@journeys_bp.route('/search', methods=['POST'])
def search_journey():
    data = request.get_json() or {}
    source_id = data.get('source_stop_id')
    destination_id = data.get('destination_stop_id')
    departure_time = data.get('departure_time')  # optional "HH:MM"
    day_of_week = data.get('day_of_week')        # optional "Mon", "Tue", etc.

    if not source_id or not destination_id:
        return jsonify({'error': 'Source and destination stops must be specified'}), 400

    try:
        source_id = int(source_id)
        destination_id = int(destination_id)
    except ValueError:
        return jsonify({'error': 'Invalid stop identifiers'}), 400

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
