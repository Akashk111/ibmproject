from flask import Blueprint, request, jsonify
from app.models import db
from app.models.user import User
from app.models.stop import BusStop
from app.models.route import BusRoute, RouteStop, BusService
from app.models.user_data import SearchHistory, SavedJourney
from app.utils.auth_helpers import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard_summary(current_user):
    total_stops = BusStop.query.count()
    active_stops = BusStop.query.filter_by(is_active=True).count()
    total_routes = BusRoute.query.count()
    active_routes = BusRoute.query.filter_by(is_active=True).count()
    total_services = BusService.query.count()
    total_users = User.query.count()
    total_searches = SearchHistory.query.count()

    demo_routes = BusRoute.query.filter_by(verification_status='DEMO DATA').count()
    verified_routes = BusRoute.query.filter_by(verification_status='VERIFIED').count()

    # Recent activity
    recent_searches = SearchHistory.query.order_by(SearchHistory.searched_at.desc()).limit(8).all()

    return jsonify({
        'stats': {
            'total_stops': total_stops,
            'active_stops': active_stops,
            'total_routes': total_routes,
            'active_routes': active_routes,
            'total_services': total_services,
            'total_users': total_users,
            'total_searches': total_searches,
            'demo_routes_count': demo_routes,
            'verified_routes_count': verified_routes
        },
        'recent_searches': [s.to_dict() for s in recent_searches]
    }), 200

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users(current_user):
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@admin_bp.route('/services/<int:service_id>', methods=['DELETE'])
@admin_required
def delete_service(current_user, service_id):
    service = BusService.query.get_or_404(service_id)
    db.session.delete(service)
    db.session.commit()
    return jsonify({'message': 'Timetable service deleted successfully'}), 200

@admin_bp.route('/services/<int:service_id>/verify', methods=['PUT'])
@admin_required
def toggle_service_verification(current_user, service_id):
    service = BusService.query.get_or_404(service_id)
    data = request.get_json() or {}
    new_status = data.get('verification_status')
    if not new_status:
        new_status = 'VERIFIED' if service.verification_status == 'DEMO DATA' else 'DEMO DATA'

    service.verification_status = new_status
    db.session.commit()
    return jsonify({'message': 'Service verification status updated', 'service': service.to_dict()}), 200
