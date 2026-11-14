import math
from flask import Blueprint, request, jsonify
from app.models import db
from app.models.stop import BusStop
from app.utils.auth_helpers import admin_required

stops_bp = Blueprint('stops', __name__, url_prefix='/api/stops')

def calculate_distance_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Curated prominent Mangaluru landmarks mapped to their nearest verified bus stop
MANGALURU_LANDMARKS = [
  {"name": "Forum Fiza Mall", "category": "Shopping & Entertainment", "lat": 12.8596, "lon": 74.8451, "nearest_stop_name": "Mangaluru Central"},
  {"name": "City Centre Mall", "category": "Commercial Hub", "lat": 12.8711, "lon": 74.8425, "nearest_stop_name": "Hampankatta"},
  {"name": "Mangaladevi Temple", "category": "Historic Temple", "lat": 12.8502, "lon": 74.8468, "nearest_stop_name": "State Bank"},
  {"name": "Kudroli Gokarnanatheshwara Temple", "category": "Historic Temple", "lat": 12.8767, "lon": 74.8329, "nearest_stop_name": "Ladyhill"},
  {"name": "St. Aloysius Chapel & College", "category": "Heritage & Education", "lat": 12.8724, "lon": 74.8458, "nearest_stop_name": "Hampankatta"},
  {"name": "Panambur Beach & New Mangalore Port", "category": "Coastal & Beach", "lat": 12.9525, "lon": 74.8021, "nearest_stop_name": "Surathkal"},
  {"name": "Tannirbhavi Beach", "category": "Coastal & Beach", "lat": 12.8988, "lon": 74.8105, "nearest_stop_name": "Kottara Chowki"},
  {"name": "KMC Hospital Ambedkar Circle", "category": "Healthcare", "lat": 12.8726, "lon": 74.8467, "nearest_stop_name": "Hampankatta"},
  {"name": "Father Muller Medical College & Hospital", "category": "Healthcare", "lat": 12.8653, "lon": 74.8631, "nearest_stop_name": "Kankanady"},
  {"name": "AJ Hospital & Research Centre", "category": "Healthcare", "lat": 12.9095, "lon": 74.8465, "nearest_stop_name": "Kottara Chowki"},
  {"name": "NITK Beach & Lighthouse", "category": "Education & Beach", "lat": 13.0118, "lon": 74.7925, "nearest_stop_name": "Surathkal"},
  {"name": "Pilikula Biological Park & Science Centre", "category": "Theme Park & Zoo", "lat": 12.9287, "lon": 74.9015, "nearest_stop_name": "Pilikula"},
  {"name": "Someshwara Beach & Temple", "category": "Coastal & Beach", "lat": 12.7932, "lon": 74.8561, "nearest_stop_name": "Ullal"},
  {"name": "Sayyid Madani Dargah Ullal", "category": "Pilgrimage", "lat": 12.8055, "lon": 74.8580, "nearest_stop_name": "Ullal"},
  {"name": "Deputy Commissioner (DC) Office", "category": "Administrative", "lat": 12.8635, "lon": 74.8398, "nearest_stop_name": "State Bank"},
  {"name": "Mangaluru City Corporation (MCC) Lalbagh", "category": "Civic Centre", "lat": 12.8795, "lon": 74.8427, "nearest_stop_name": "Lalbagh"}
]

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

@stops_bp.route('/search', methods=['GET'])
def search_stops_and_places():
    """
    Intelligent place search:
    1. Matches verified bus stops
    2. Matches known Mangaluru landmarks with their nearest verified bus stop
    """
    q = request.args.get('q', '').strip()
    if not q:
        stops = BusStop.query.filter_by(is_active=True).order_by(BusStop.name).limit(10).all()
        return jsonify({
            'query': '',
            'results': [{**s.to_dict(), 'type': 'BUS_STOP', 'matched_stop_id': s.id} for s in stops]
        }), 200

    results = []

    # 1. Search verified bus stops in database
    matched_stops = BusStop.query.filter(
        BusStop.is_active == True,
        (BusStop.name.ilike(f'%{q}%')) | (BusStop.location_description.ilike(f'%{q}%'))
    ).all()

    for s in matched_stops:
        results.append({
            'id': s.id,
            'name': s.name,
            'location_description': s.location_description,
            'latitude': s.latitude,
            'longitude': s.longitude,
            'type': 'BUS_STOP',
            'matched_stop_id': s.id,
            'matched_stop_name': s.name,
            'is_verified': True
        })

    # 2. Search Mangaluru landmarks
    q_lower = q.lower()
    all_stops_map = {s.name.lower(): s for s in BusStop.query.filter_by(is_active=True).all()}

    for lm in MANGALURU_LANDMARKS:
        if q_lower in lm['name'].lower() or q_lower in lm['category'].lower():
            nearest_stop = all_stops_map.get(lm['nearest_stop_name'].lower())
            results.append({
                'id': f"landmark_{hash(lm['name']) % 100000}",
                'name': lm['name'],
                'location_description': f"{lm['category']} (Nearest Stop: {lm['nearest_stop_name']})",
                'latitude': lm['lat'],
                'longitude': lm['lon'],
                'type': 'LANDMARK',
                'category': lm['category'],
                'matched_stop_id': nearest_stop.id if nearest_stop else None,
                'matched_stop_name': nearest_stop.name if nearest_stop else lm['nearest_stop_name'],
                'is_verified': True
            })

    return jsonify({
        'query': q,
        'count': len(results),
        'results': results[:15]
    }), 200

@stops_bp.route('/nearby', methods=['GET'])
def get_nearby_stops():
    """
    Finds nearest verified bus stops to given GPS coordinates (lat, lng).
    Calculates straight-line Haversine distance and walking estimate.
    """
    lat_str = request.args.get('lat')
    lng_str = request.args.get('lng')
    limit = int(request.args.get('limit', 5))

    if not lat_str or not lng_str:
        return jsonify({'error': 'lat and lng parameters are required'}), 400

    try:
        user_lat = float(lat_str)
        user_lng = float(lng_str)
    except ValueError:
        return jsonify({'error': 'Invalid lat or lng values'}), 400

    all_stops = BusStop.query.filter_by(is_active=True).all()
    calculated = []

    for s in all_stops:
        dist_km = calculate_distance_km(user_lat, user_lng, s.latitude, s.longitude)
        # Format distance
        formatted_dist = f"{int(round(dist_km * 1000))} m" if dist_km < 1.0 else f"{round(dist_km, 2)} km"
        walking_mins = max(1, int(round((dist_km * 1000) / 80)))  # ~80m/min standard walk speed

        calculated.append({
            **s.to_dict(),
            'distance_km': round(dist_km, 3),
            'formatted_distance': formatted_dist,
            'walking_time_minutes': walking_mins,
            'walking_time_label': f"~{walking_mins} min walk"
        })

    calculated.sort(key=lambda x: x['distance_km'])
    return jsonify({
        'user_coordinates': {'latitude': user_lat, 'longitude': user_lng},
        'count': min(limit, len(calculated)),
        'nearest_stops': calculated[:limit]
    }), 200

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
