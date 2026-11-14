from flask import Blueprint, request, jsonify
from app.models import db
from app.models.user_data import SavedJourney, SearchHistory
from app.models.stop import BusStop
from app.utils.auth_helpers import token_required

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route('/favorites', methods=['GET'])
@token_required
def get_favorites(current_user):
    favs = SavedJourney.query.filter_by(user_id=current_user.id).order_by(SavedJourney.created_at.desc()).all()
    return jsonify({'favorites': [f.to_dict() for f in favs]}), 200

@user_bp.route('/favorites', methods=['POST'])
@token_required
def add_favorite(current_user):
    data = request.get_json() or {}
    source_id = data.get('source_stop_id')
    destination_id = data.get('destination_stop_id')

    if not source_id or not destination_id:
        return jsonify({'error': 'source_stop_id and destination_stop_id are required'}), 400

    if source_id == destination_id:
        return jsonify({'error': 'Source and destination cannot be identical'}), 400

    # Avoid duplicate favorites
    existing = SavedJourney.query.filter_by(
        user_id=current_user.id,
        source_stop_id=source_id,
        destination_stop_id=destination_id
    ).first()

    if existing:
        return jsonify({'message': 'Journey already saved in favorites', 'favorite': existing.to_dict()}), 200

    fav = SavedJourney(
        user_id=current_user.id,
        source_stop_id=source_id,
        destination_stop_id=destination_id
    )
    db.session.add(fav)
    db.session.commit()

    return jsonify({'message': 'Journey saved to favorites', 'favorite': fav.to_dict()}), 201

@user_bp.route('/favorites/<int:fav_id>', methods=['DELETE'])
@token_required
def delete_favorite(current_user, fav_id):
    fav = SavedJourney.query.filter_by(id=fav_id, user_id=current_user.id).first_or_404()
    db.session.delete(fav)
    db.session.commit()
    return jsonify({'message': 'Favorite removed'}), 200

@user_bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    items = SearchHistory.query.filter_by(user_id=current_user.id).order_by(SearchHistory.searched_at.desc()).limit(15).all()
    return jsonify({'history': [item.to_dict() for item in items]}), 200

@user_bp.route('/history/clear', methods=['DELETE'])
@token_required
def clear_history(current_user):
    SearchHistory.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'message': 'Search history cleared'}), 200
