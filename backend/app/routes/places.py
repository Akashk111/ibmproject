from flask import Blueprint, request, jsonify
from app.models import db
from app.models.place import Place
from app.models.stop import BusStop

places_bp = Blueprint('places', __name__, url_prefix='/api/places')

@places_bp.route('', methods=['GET'])
def get_all_places():
    try:
        category = request.args.get('category')
        query = Place.query.filter_by(is_verified=True)
        if category:
            query = query.filter_by(category=category)
        places = query.all()
        return jsonify([p.to_dict() for p in places]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@places_bp.route('/<int:place_id>', methods=['GET'])
def get_place(place_id):
    try:
        place = db.session.get(Place, place_id)
        if not place:
            return jsonify({'error': 'Place not found'}), 404
        return jsonify(place.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@places_bp.route('/search', methods=['GET'])
def search_places_and_stops():
    """
    Unified search endpoint returning both Bus Stops and Curated Landmarks.
    Includes nearest verified bus stops for landmarks so the user can easily plan journeys.
    """
    try:
        query_str = request.args.get('q', '').strip()
        if not query_str or len(query_str) < 2:
            return jsonify([]), 200

        search_term = f"%{query_str}%"

        # Search Bus Stops
        stops = BusStop.query.filter(
            BusStop.is_active == True,
            (BusStop.name.ilike(search_term) | BusStop.code.ilike(search_term))
        ).limit(10).all()

        # Search Curated Places / Landmarks
        places = Place.query.filter(
            Place.is_verified == True,
            (Place.name.ilike(search_term) | Place.category.ilike(search_term))
        ).limit(10).all()

        results = []

        # Add Stops first or based on exactness
        for s in stops:
            results.append({
                'id': s.id,
                'name': s.name,
                'code': s.code,
                'type': 'STOP',
                'latitude': s.latitude,
                'longitude': s.longitude,
                'description': f"Bus Stop in {s.name}",
                'nearest_stop_id': s.id,
                'nearest_stop_name': s.name
            })

        for p in places:
            results.append({
                'id': p.id,
                'name': p.name,
                'category': p.category,
                'type': 'LANDMARK',
                'latitude': p.latitude,
                'longitude': p.longitude,
                'description': p.description or f"Famous Mangaluru {p.category}",
                'nearest_stop_id': p.nearest_stop_id,
                'nearest_stop_name': p.nearest_stop.name if p.nearest_stop else None,
                'image_url': p.image_url
            })

        # Sort: items starting with query come first
        q_lower = query_str.lower()
        results.sort(key=lambda r: (
            not r['name'].lower().startswith(q_lower),
            r['name'].lower()
        ))

        return jsonify(results[:15]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
