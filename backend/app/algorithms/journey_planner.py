import math
from datetime import datetime
from app.models import db
from app.models.stop import BusStop
from app.models.route import BusRoute, RouteStop, BusService

def parse_time_to_minutes(time_str):
    """Convert 'HH:MM' string to minutes since midnight."""
    try:
        parts = time_str.strip().split(':')
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0

def format_minutes_to_time(minutes):
    """Convert minutes since midnight to 'HH:MM' 12-hour or 24-hour string."""
    norm_mins = minutes % 1440
    hours = norm_mins // 60
    mins = norm_mins % 60
    period = "AM" if hours < 12 else "PM"
    h12 = hours % 12
    if h12 == 0:
        h12 = 12
    return f"{h12:02d}:{mins:02d} {period}"

def format_minutes_to_24h(minutes):
    norm_mins = minutes % 1440
    hours = norm_mins // 60
    mins = norm_mins % 60
    return f"{hours:02d}:{mins:02d}"

def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine distance in kilometers between two coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class JourneyPlanner:
    def __init__(self, min_transfer_wait=5, max_transfer_wait=120):
        self.min_transfer_wait = min_transfer_wait
        self.max_transfer_wait = max_transfer_wait

    def plan_journey(self, source_stop_id, destination_stop_id, departure_time_str=None, day_of_week=None):
        """
        Main journey planning method.
        Searches:
        Stage 1: Direct routes
        Stage 2: 1-Transfer routes
        Stage 3: Ranked alternatives
        Stage 4: Fallback suggestions if none found
        """
        source_stop = db.session.get(BusStop, source_stop_id)
        destination_stop = db.session.get(BusStop, destination_stop_id)

        if not source_stop or not destination_stop:
            return {
                'success': False,
                'message': 'Invalid source or destination stop specified.',
                'journeys': []
            }

        if source_stop_id == destination_stop_id:
            return {
                'success': False,
                'message': 'Source and destination stops cannot be the same.',
                'journeys': []
            }

        # Current time or requested time
        now = datetime.now()
        if not departure_time_str:
            departure_time_str = f"{now.hour:02d}:{now.minute:02d}"

        if not day_of_week:
            days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            day_of_week = days[now.weekday()]

        req_mins = parse_time_to_minutes(departure_time_str)

        direct_journeys = self._find_direct_journeys(source_stop, destination_stop, req_mins, day_of_week)
        transfer_journeys = []

        # Find 1-transfer journeys
        transfer_journeys = self._find_transfer_journeys(source_stop, destination_stop, req_mins, day_of_week)

        all_journeys = direct_journeys + transfer_journeys

        if not all_journeys:
            # Fallback suggestions (Stage 4)
            suggestions = self._get_fallback_suggestions(source_stop, destination_stop)
            return {
                'success': False,
                'message': "We couldn't find a suitable bus journey between these locations.",
                'departure_time_requested': departure_time_str,
                'day_requested': day_of_week,
                'source_stop': source_stop.to_dict(),
                'destination_stop': destination_stop.to_dict(),
                'journeys': [],
                'suggestions': suggestions
            }

        # Rank journeys:
        # 1. Earliest arrival time
        # 2. Shortest total journey duration
        # 3. Fewest transfers
        # 4. Lower fare
        all_journeys.sort(key=lambda j: (
            j['arrival_minutes'],
            j['total_duration_minutes'],
            j['transfer_count'],
            j['fare'] if j['fare'] is not None else 9999
        ))

        # Add ranking index
        for idx, journey in enumerate(all_journeys, 1):
            journey['rank'] = idx

        return {
            'success': True,
            'source_stop': source_stop.to_dict(),
            'destination_stop': destination_stop.to_dict(),
            'departure_time_requested': departure_time_str,
            'day_requested': day_of_week,
            'total_options_found': len(all_journeys),
            'journeys': all_journeys[:10]  # top 10 best options
        }

    def _determine_reliability(self, verification_status, departure_minutes):
        """Determine uncertainty and reliability indicator."""
        # Check peak traffic hours in Mangaluru (8:30-10:30 AM = 510-630, 17:00-19:30 = 1020-1170)
        is_peak = (510 <= departure_minutes <= 630) or (1020 <= departure_minutes <= 1170)
        
        if verification_status == 'VERIFIED':
            if is_peak:
                return 'Possible Delay', 'Schedule-based timetable. Peak hour city traffic may cause 5-10 mins delay.'
            return 'On Time', 'Published timetable service. Expected to operate on schedule.'
        else:
            if is_peak:
                return 'Possible Delay', 'Demonstration timetable estimate. Peak hour traffic may affect journey times.'
            return 'Schedule-Based Estimate', 'Timetable-based estimate from demonstration transit data. Not a live GPS tracking feed.'

    def _find_direct_journeys(self, source_stop, destination_stop, req_mins, day_of_week):
        direct_journeys = []

        # Find routes containing both source and destination
        source_route_stops = RouteStop.query.filter_by(stop_id=source_stop.id).all()
        for s_rs in source_route_stops:
            route = s_rs.route
            if not route or not route.is_active:
                continue

            # Look for destination in the same route with sequence > source
            d_rs = RouteStop.query.filter_by(route_id=route.id, stop_id=destination_stop.id).first()
            if not d_rs or d_rs.stop_sequence <= s_rs.stop_sequence:
                continue

            # Route connects source to destination directly!
            # Get services on this route
            services = BusService.query.filter_by(route_id=route.id).all()
            for service in services:
                if day_of_week not in service.operating_days:
                    continue

                service_dept_mins = parse_time_to_minutes(service.departure_time)
                board_mins = service_dept_mins + s_rs.departure_offset_minutes

                # Must depart at or after requested time (or within same operating cycle)
                if board_mins < req_mins:
                    continue

                # Waiting time
                waiting_time = board_mins - req_mins
                if waiting_time > 180:  # Don't show options more than 3 hours away
                    continue

                alight_mins = service_dept_mins + d_rs.arrival_offset_minutes
                travel_time = alight_mins - board_mins
                total_duration = waiting_time + travel_time

                reliability_status, note = self._determine_reliability(service.verification_status, board_mins)

                # Get intermediate stops for polyline / display
                all_stops = sorted(route.route_stops, key=lambda x: x.stop_sequence)
                segment_stops = [rs.to_dict() for rs in all_stops if s_rs.stop_sequence <= rs.stop_sequence <= d_rs.stop_sequence]

                direct_journeys.append({
                    'journey_type': 'DIRECT',
                    'transfer_count': 0,
                    'summary': f"Direct Bus {route.route_code} ({source_stop.name} to {destination_stop.name})",
                    'departure_time': format_minutes_to_time(board_mins),
                    'departure_time_24h': format_minutes_to_24h(board_mins),
                    'arrival_time': format_minutes_to_time(alight_mins),
                    'arrival_time_24h': format_minutes_to_24h(alight_mins),
                    'board_minutes': board_mins,
                    'arrival_minutes': alight_mins,
                    'waiting_time_minutes': waiting_time,
                    'travel_time_minutes': travel_time,
                    'transfer_wait_minutes': 0,
                    'total_duration_minutes': total_duration,
                    'fare': service.fare,
                    'operator': route.operator,
                    'verification_status': service.verification_status,
                    'reliability_status': reliability_status,
                    'uncertainty_note': note,
                    'is_demo_data': (route.verification_status == 'DEMO DATA' or service.verification_status == 'DEMO DATA'),
                    'segments': [
                        {
                            'segment_index': 1,
                            'route_id': route.id,
                            'route_code': route.route_code,
                            'route_name': route.route_name,
                            'operator': route.operator,
                            'service_name': service.service_name,
                            'from_stop': source_stop.to_dict(),
                            'to_stop': destination_stop.to_dict(),
                            'departure_time': format_minutes_to_time(board_mins),
                            'arrival_time': format_minutes_to_time(alight_mins),
                            'duration_minutes': travel_time,
                            'stops': segment_stops,
                            'stops_count': len(segment_stops)
                        }
                    ]
                })

        return direct_journeys

    def _find_transfer_journeys(self, source_stop, destination_stop, req_mins, day_of_week):
        transfer_journeys = []

        # Find all routes passing through source stop
        source_route_stops = RouteStop.query.filter_by(stop_id=source_stop.id).all()
        # Find all routes passing through destination stop
        dest_route_stops = RouteStop.query.filter_by(stop_id=destination_stop.id).all()

        source_route_ids = {s.route_id for s in source_route_stops}
        dest_route_ids = {d.route_id for d in dest_route_stops}

        for s_rs in source_route_stops:
            route1 = s_rs.route
            if not route1 or not route1.is_active:
                continue

            # Candidate transfer stops on route1 that occur AFTER source stop
            route1_subsequent_stops = [
                rs for rs in route1.route_stops 
                if rs.stop_sequence > s_rs.stop_sequence and rs.stop_id != destination_stop.id
            ]

            for t_rs1 in route1_subsequent_stops:
                transfer_stop_id = t_rs1.stop_id

                # Check if any route serving destination also passes through this transfer stop BEFORE destination
                candidate_route2_stops = RouteStop.query.filter_by(stop_id=transfer_stop_id).all()
                for t_rs2 in candidate_route2_stops:
                    route2 = t_rs2.route
                    if not route2 or not route2.is_active or route2.id == route1.id:
                        continue

                    # Look for destination on route2 with sequence > transfer stop
                    d_rs2 = RouteStop.query.filter_by(route_id=route2.id, stop_id=destination_stop.id).first()
                    if not d_rs2 or d_rs2.stop_sequence <= t_rs2.stop_sequence:
                        continue

                    # We found a valid pair: route1 (source -> transfer_stop), route2 (transfer_stop -> destination)
                    # Check timetables and find compatible departure pairs
                    services1 = BusService.query.filter_by(route_id=route1.id).all()
                    services2 = BusService.query.filter_by(route_id=route2.id).all()

                    transfer_stop = db.session.get(BusStop, transfer_stop_id)

                    for s1 in services1:
                        if day_of_week not in s1.operating_days:
                            continue

                        s1_dept_mins = parse_time_to_minutes(s1.departure_time)
                        board1_mins = s1_dept_mins + s_rs.departure_offset_minutes

                        if board1_mins < req_mins:
                            continue

                        wait1_mins = board1_mins - req_mins
                        if wait1_mins > 180:
                            continue

                        arrive_t_mins = s1_dept_mins + t_rs1.arrival_offset_minutes
                        travel1_mins = arrive_t_mins - board1_mins

                        # Find best connecting service on route2
                        best_s2 = None
                        best_board2_mins = None
                        best_transfer_wait = None

                        for s2 in services2:
                            if day_of_week not in s2.operating_days:
                                continue

                            s2_dept_mins = parse_time_to_minutes(s2.departure_time)
                            board2_mins = s2_dept_mins + t_rs2.departure_offset_minutes

                            transfer_wait = board2_mins - arrive_t_mins
                            if self.min_transfer_wait <= transfer_wait <= self.max_transfer_wait:
                                if best_board2_mins is None or board2_mins < best_board2_mins:
                                    best_board2_mins = board2_mins
                                    best_s2 = s2
                                    best_transfer_wait = transfer_wait

                        if best_s2 and best_board2_mins:
                            alight2_mins = parse_time_to_minutes(best_s2.departure_time) + d_rs2.arrival_offset_minutes
                            travel2_mins = alight2_mins - best_board2_mins
                            total_duration = wait1_mins + travel1_mins + best_transfer_wait + travel2_mins

                            combined_status = 'VERIFIED' if (s1.verification_status == 'VERIFIED' and best_s2.verification_status == 'VERIFIED') else 'DEMO DATA'
                            reliability_status, note = self._determine_reliability(combined_status, board1_mins)

                            # Extract intermediate stops for both segments
                            all_stops_r1 = sorted(route1.route_stops, key=lambda x: x.stop_sequence)
                            segment1_stops = [rs.to_dict() for rs in all_stops_r1 if s_rs.stop_sequence <= rs.stop_sequence <= t_rs1.stop_sequence]

                            all_stops_r2 = sorted(route2.route_stops, key=lambda x: x.stop_sequence)
                            segment2_stops = [rs.to_dict() for rs in all_stops_r2 if t_rs2.stop_sequence <= rs.stop_sequence <= d_rs2.stop_sequence]

                            total_fare = None
                            if s1.fare is not None and best_s2.fare is not None:
                                total_fare = round(s1.fare + best_s2.fare, 2)

                            transfer_journeys.append({
                                'journey_type': 'TRANSFER_1',
                                'transfer_count': 1,
                                'transfer_stop': transfer_stop.to_dict() if transfer_stop else None,
                                'summary': f"Transfer via {transfer_stop.name}: Bus {route1.route_code} ➔ Bus {route2.route_code}",
                                'departure_time': format_minutes_to_time(board1_mins),
                                'departure_time_24h': format_minutes_to_24h(board1_mins),
                                'arrival_time': format_minutes_to_time(alight2_mins),
                                'arrival_time_24h': format_minutes_to_24h(alight2_mins),
                                'board_minutes': board1_mins,
                                'arrival_minutes': alight2_mins,
                                'waiting_time_minutes': wait1_mins,
                                'travel_time_minutes': travel1_mins + travel2_mins,
                                'transfer_wait_minutes': best_transfer_wait,
                                'total_duration_minutes': total_duration,
                                'fare': total_fare,
                                'operator': f"{route1.operator} / {route2.operator}",
                                'verification_status': combined_status,
                                'reliability_status': reliability_status,
                                'uncertainty_note': note,
                                'is_demo_data': (combined_status == 'DEMO DATA'),
                                'segments': [
                                    {
                                        'segment_index': 1,
                                        'route_id': route1.id,
                                        'route_code': route1.route_code,
                                        'route_name': route1.route_name,
                                        'operator': route1.operator,
                                        'service_name': s1.service_name,
                                        'from_stop': source_stop.to_dict(),
                                        'to_stop': transfer_stop.to_dict(),
                                        'departure_time': format_minutes_to_time(board1_mins),
                                        'arrival_time': format_minutes_to_time(arrive_t_mins),
                                        'duration_minutes': travel1_mins,
                                        'stops': segment1_stops,
                                        'stops_count': len(segment1_stops)
                                    },
                                    {
                                        'segment_index': 2,
                                        'route_id': route2.id,
                                        'route_code': route2.route_code,
                                        'route_name': route2.route_name,
                                        'operator': route2.operator,
                                        'service_name': best_s2.service_name,
                                        'from_stop': transfer_stop.to_dict(),
                                        'to_stop': destination_stop.to_dict(),
                                        'departure_time': format_minutes_to_time(best_board2_mins),
                                        'arrival_time': format_minutes_to_time(alight2_mins),
                                        'duration_minutes': travel2_mins,
                                        'stops': segment2_stops,
                                        'stops_count': len(segment2_stops)
                                    }
                                ]
                            })

        # Deduplicate identical journey routes and times
        seen = set()
        deduped = []
        for j in transfer_journeys:
            key = (j['segments'][0]['route_code'], j['segments'][1]['route_code'], j['departure_time'], j['arrival_time'])
            if key not in seen:
                seen.add(key)
                deduped.append(j)

        return deduped

    def _get_fallback_suggestions(self, source_stop, destination_stop):
        """Provide nearby stops and other active routes when no journey exists."""
        all_stops = BusStop.query.filter(BusStop.is_active == True).all()

        nearby_source = []
        nearby_dest = []

        for st in all_stops:
            if st.id != source_stop.id:
                dist = calculate_distance(source_stop.latitude, source_stop.longitude, st.latitude, st.longitude)
                nearby_source.append({'stop': st.to_dict(), 'distance_km': round(dist, 2)})

            if st.id != destination_stop.id:
                dist = calculate_distance(destination_stop.latitude, destination_stop.longitude, st.latitude, st.longitude)
                nearby_dest.append({'stop': st.to_dict(), 'distance_km': round(dist, 2)})

        nearby_source.sort(key=lambda x: x['distance_km'])
        nearby_dest.sort(key=lambda x: x['distance_km'])

        # Find routes passing through source or destination
        src_routes = [
            rs.route.to_dict() for rs in RouteStop.query.filter_by(stop_id=source_stop.id).all()
            if rs.route and rs.route.is_active
        ]
        dest_routes = [
            rs.route.to_dict() for rs in RouteStop.query.filter_by(stop_id=destination_stop.id).all()
            if rs.route and rs.route.is_active
        ]

        return {
            'nearby_boarding_stops': nearby_source[:4],
            'nearby_destination_stops': nearby_dest[:4],
            'available_routes_from_source': src_routes[:3],
            'available_routes_at_destination': dest_routes[:3],
            'advice': "Try selecting a major junction such as State Bank, Hampankatta, or Pumpwell as a connecting point."
        }
