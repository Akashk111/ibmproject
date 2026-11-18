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

import re

@places_bp.route('/search', methods=['GET'])
def search_places_and_stops():
    """
    Unified search endpoint returning both Bus Stops and Curated Landmarks.
    Includes case-insensitive matching, safe alias handling, and qualifier stripping
    (e.g., 'State Bank, Mangaluru' -> 'State Bank').
    """
    try:
        raw_query = request.args.get('q', '').strip()
        city_only = request.args.get('city_only', 'false').lower() in ['true', '1', 'yes']
        if not raw_query or len(raw_query) < 2:
            return jsonify([]), 200

        # 1. Clean query by stripping geographic suffix qualifiers like ', Mangaluru', ', Karnataka', etc.
        clean_query = re.sub(
            r'(?i)[,\s]+(mangaluru|mangalore|dakshina kannada|karnataka|india|city|terminal|bus\s*stand).*$',
            '',
            raw_query
        ).strip()
        if not clean_query:
            clean_query = raw_query.strip()

        q_lower = clean_query.lower()

        # Popular Mangaluru local search aliases and synonyms
        ALIAS_MAP = {
            'ksrtc bejai': 'bejai',
            'ksrtc': 'bejai',
            'ksrtc bus stand': 'bejai',
            'urwa store': 'urwa',
            'urwa stores': 'urwa',
            'kottara': 'kottara chowki',
            'nitk': 'surathkal',
            'nitk surathkal': 'surathkal',
            'service bus stand': 'state bank',
            'central bus stand': 'state bank',
            'car street': 'state bank',
            'central market': 'hampankatta',
            'clock tower': 'hampankatta',
            'st aloysius': 'hampankatta',
            'father muller': 'kankanady',
            'mahaveera circle': 'pumpwell',
            'ambedkar circle': 'jyothi',
            'jyothi circle': 'jyothi',
        }
        alias_keyword = ALIAS_MAP.get(q_lower, '')

        # 2. Handle Mangaluru City Hubs broad search
        if q_lower in ['mangaluru', 'mangalore', 'mangaluru city', 'mangalore city']:
            hub_stops = BusStop.query.filter(
                BusStop.is_active == True,
                BusStop.name.in_(['State Bank', 'Mangaluru Central', 'Bejai', 'Hampankatta', 'Pumpwell'])
            ).all()
            results = []
            for s in hub_stops:
                results.append({
                    'id': s.id,
                    'name': f"{s.name} (Mangaluru)",
                    'code': s.code,
                    'type': 'STOP',
                    'latitude': s.latitude,
                    'longitude': s.longitude,
                    'description': s.location_description or f"Major Transit Hub in Mangaluru",
                    'matched_stop_id': s.id,
                    'matched_stop_name': s.name,
                    'nearest_stop_id': s.id,
                    'nearest_stop_name': s.name
                })
            return jsonify(results), 200

        # 3. Query Bus Stops matching clean_query, raw_query, alias, or word tokens
        search_term_clean = f"%{clean_query}%"
        search_term_raw = f"%{raw_query}%"

        conditions = [
            BusStop.name.ilike(search_term_clean),
            BusStop.code.ilike(search_term_clean),
            BusStop.name.ilike(search_term_raw),
            BusStop.location_description.ilike(search_term_clean)
        ]

        if alias_keyword:
            conditions.append(BusStop.name.ilike(f"%{alias_keyword}%"))

        # Token-based matching for multi-word queries (e.g., "KSRTC Bejai" -> matches "Bejai")
        query_words = [w for w in clean_query.split() if len(w) >= 3]
        for w in query_words:
            conditions.append(BusStop.name.ilike(f"%{w}%"))

        stops_query = BusStop.query.filter(
            BusStop.is_active == True,
            db.or_(*conditions)
        )
        if city_only:
            stops_query = stops_query.filter(
                BusStop.latitude.between(12.70, 13.10),
                BusStop.longitude.between(74.75, 75.05)
            )
        stops = stops_query.limit(10).all()

        # Search Curated Places / Landmarks
        places = Place.query.filter(
            Place.is_verified == True,
            (
                Place.name.ilike(search_term_clean) |
                Place.category.ilike(search_term_clean) |
                Place.name.ilike(search_term_raw)
            )
        ).limit(10).all()

        results = []

        # Add Stops
        for s in stops:
            results.append({
                'id': s.id,
                'name': s.name,
                'code': s.code,
                'type': 'STOP',
                'latitude': s.latitude,
                'longitude': s.longitude,
                'description': s.location_description or f"Bus Stop in {s.name}",
                'matched_stop_id': s.id,
                'matched_stop_name': s.name,
                'nearest_stop_id': s.id,
                'nearest_stop_name': s.name
            })

        # Add Places
        for p in places:
            stop_id = p.nearest_stop_id or 1
            stop_name = p.nearest_stop.name if p.nearest_stop else 'State Bank'
            results.append({
                'id': p.id,
                'name': p.name,
                'category': p.category,
                'type': 'LANDMARK',
                'latitude': p.latitude,
                'longitude': p.longitude,
                'description': p.description or f"Famous Mangaluru {p.category}",
                'matched_stop_id': stop_id,
                'matched_stop_name': stop_name,
                'nearest_stop_id': stop_id,
                'nearest_stop_name': stop_name,
                'image_url': p.image_url
            })

        # Sort: exact starts-with first
        results.sort(key=lambda r: (
            not r['name'].lower().startswith(q_lower),
            r['name'].lower()
        ))

        return jsonify(results[:15]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@places_bp.route('/destinations', methods=['GET'])
@places_bp.route('/popular', methods=['GET'])
def get_popular_destinations():
    """
    Returns curated popular city destinations with live database fare and schedule availability.
    Matches Phase 5 destinations:
    Mangaluru, Bengaluru, Udupi, Manipal, Mysuru, Hubballi, Shivamogga, Hassan,
    Madikeri, Kasaragod, Kozhikode, Kannur, Puttur, Kundapura, Surathkal
    """
    from app.models.booking import Schedule

    destinations = [
        {"name": "Mangaluru", "state": "Karnataka", "tag": "Coastal Gateway", "image": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80", "desc": "Port city of golden beaches, historic temples, and coastal cuisine."},
        {"name": "Bengaluru", "state": "Karnataka", "tag": "Capital & Tech Hub", "image": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80", "desc": "Silicon Valley of India with premier express connectivity from coastal Karnataka."},
        {"name": "Udupi", "state": "Karnataka", "tag": "Temple & Heritage City", "image": "https://images.unsplash.com/photo-1600100397608-f010e4708761?auto=format&fit=crop&w=800&q=80", "desc": "Famous Sri Krishna Temple, Malpe Beach, and coastal culinary traditions."},
        {"name": "Manipal", "state": "Karnataka", "tag": "University Town", "image": "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80", "desc": "International education center home to MAHE, MIT campus, and vibrant student life."},
        {"name": "Surathkal", "state": "Karnataka", "tag": "NITK & Lighthouse", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", "desc": "Prestigious engineering campus, rocky seashore, and historical lighthouse."},
        {"name": "Kundapura", "state": "Karnataka", "tag": "Coastal Town", "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80", "desc": "Scenic coastal hub surrounded by backwaters and the Arabian Sea."},
        {"name": "Madikeri", "state": "Karnataka", "tag": "Coorg Hill Station", "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80", "desc": "Misty coffee plantations, Raja's Seat, Abbey Falls, and lush Western Ghats."},
        {"name": "Mysuru", "state": "Karnataka", "tag": "Cultural Heritage", "image": "https://images.unsplash.com/photo-1600100397608-f010e4708761?auto=format&fit=crop&w=800&q=80", "desc": "City of Palaces, Chamundi Hill, grand heritage architecture, and silk."},
        {"name": "Puttur", "state": "Karnataka", "tag": "Areca Capital", "image": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80", "desc": "Historic Mahalingeshwara Temple and gateway to the agrarian Western foothills."},
        {"name": "Kasaragod", "state": "Kerala", "tag": "Forts & Rivers", "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80", "desc": "Border district famous for Bekal Fort, Chandragiri River, and coastal trade."},
        {"name": "Kannur", "state": "Kerala", "tag": "Theyyam & Beaches", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", "desc": "Land of looms, lore, Muzhappilangad drive-in beach, and colonial forts."},
        {"name": "Kozhikode", "state": "Kerala", "tag": "Historic Port & Spices", "image": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80", "desc": "Ancient city of spices, Sweet Street (SM Street), and historic Beypore port."},
        {"name": "Hubballi", "state": "Karnataka", "tag": "Commercial Hub", "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80", "desc": "Key transportation crossroads of North Karnataka and industrial center."},
        {"name": "Shivamogga", "state": "Karnataka", "tag": "Gateway to Malnad", "image": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80", "desc": "Verdant forests, Tunga river, and gateway to world-renowned Jog Falls."},
        {"name": "Hassan", "state": "Karnataka", "tag": "Hoysala Architecture", "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80", "desc": "Base to explore UNESCO World Heritage temples of Belur and Halebidu."}
    ]

    results = []
    default_origin = BusStop.query.filter_by(name="State Bank").first() or BusStop.query.first()

    for item in destinations:
        dest_stop = BusStop.query.filter(BusStop.name.ilike(f"%{item['name']}%")).first()
        dest_stop_id = dest_stop.id if dest_stop else None

        # Query live schedules to this destination
        starting_fare = None
        services_count = 0
        if dest_stop_id:
            schedules = Schedule.query.filter_by(destination_stop_id=dest_stop_id).all()
            if not schedules and item['name'] == 'Mangaluru':
                schedules = Schedule.query.filter_by(departure_stop_id=dest_stop_id).all()

            if schedules:
                services_count = len(schedules)
                fares = [s.fare for s in schedules if s.fare and s.fare > 0]
                if fares:
                    starting_fare = min(fares)

        results.append({
            'name': item['name'],
            'state': item['state'],
            'tag': item['tag'],
            'description': item['desc'],
            'image': item['image'],
            'stop_id': dest_stop_id,
            'source_stop_id': default_origin.id if default_origin else 1,
            'source_stop_name': default_origin.name if default_origin else 'State Bank',
            'available_services': services_count,
            'starting_fare': starting_fare,
            'is_bookable': services_count > 0 and starting_fare is not None
        })

    return jsonify(results), 200
