import math
from datetime import datetime
from app.models import db
from app.models.stop import BusStop
from app.models.route import BusRoute, RouteStop, BusService
from app.models.booking import Vehicle, Schedule
from app.algorithms.road_routing import get_accurate_road_distance, calculate_traffic_eta

def parse_time_to_minutes(time_str):
    """Convert 'HH:MM' string to minutes since midnight."""
    try:
        parts = time_str.strip().split(':')
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0

def format_minutes_to_time(minutes):
    """Convert minutes since midnight to 'HH:MM AM/PM' string."""
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
        Stage 3: Ranked alternatives with accurate OSRM road distance and traffic ETAs
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
        transfer_journeys = self._find_transfer_journeys(source_stop, destination_stop, req_mins, day_of_week)

        all_journeys = direct_journeys + transfer_journeys

        if not all_journeys:
            # Fallback suggestions (Stage 4)
            suggestions = self._get_fallback_suggestions(source_stop, destination_stop)
            return {
                'success': False,
                'message': "No buses are currently available for this journey and date.",
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

        # Calculate accurate road distance between source and destination
        road_data = get_accurate_road_distance(
            source_stop.latitude, source_stop.longitude,
            destination_stop.latitude, destination_stop.longitude,
            source_stop.id, destination_stop.id
        )

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

            # Get services on this route
            services = BusService.query.filter_by(route_id=route.id).all()
            candidate_services = []
            for service in services:
                if day_of_week not in service.operating_days:
                    continue

                service_dept_mins = parse_time_to_minutes(service.departure_time)
                board_mins = service_dept_mins + s_rs.departure_offset_minutes

                # Must depart at or after requested time on same travel day
                if board_mins < req_mins:
                    continue

                waiting_time = board_mins - req_mins
                if waiting_time > 900:
                    continue

                candidate_services.append((waiting_time, board_mins, service))

            candidate_services.sort(key=lambda x: x[0])

            for waiting_time, board_mins, service in candidate_services[:5]:
                service_dept_mins = parse_time_to_minutes(service.departure_time)
                alight_mins = service_dept_mins + d_rs.arrival_offset_minutes
                travel_time = alight_mins - board_mins
                total_duration = waiting_time + travel_time

                # Traffic-aware ETA calculation
                all_stops = sorted(route.route_stops, key=lambda x: x.stop_sequence)
                segment_stops = [rs.to_dict() for rs in all_stops if s_rs.stop_sequence <= rs.stop_sequence <= d_rs.stop_sequence]
                inter_stops_count = max(0, len(segment_stops) - 2)

                traffic_info = calculate_traffic_eta(board_mins, road_data['duration_minutes'], inter_stops_count)
                traffic_arrival_mins = (board_mins + travel_time + traffic_info['traffic_delay_minutes']) % 1440

                reliability_status, note = self._determine_reliability(service.verification_status, board_mins)

                # Check schedule and booking capabilities
                schedule_obj = Schedule.query.filter_by(route_id=route.id, departure_stop_id=source_stop.id).first()
                if not schedule_obj:
                    schedule_obj = Schedule.query.filter_by(route_id=route.id).first()

                direct_journeys.append({
                    'journey_type': 'DIRECT',
                    'transfer_count': 0,
                    'summary': f"Direct Bus {route.route_code} ({source_stop.name} to {destination_stop.name})",
                    'bus_name': f"{route.route_code} {route.route_name.split(' to ')[0]} Express",
                    'bus_number': schedule_obj.vehicle.vehicle_number if schedule_obj and schedule_obj.vehicle else f"KA-19-F-{1000 + route.id * 102}",
                    'schedule_id': schedule_obj.id if schedule_obj else None,
                    'booking_enabled': schedule_obj.booking_enabled if schedule_obj else False,
                    'available_seats': schedule_obj.vehicle.total_seats - 2 if schedule_obj and schedule_obj.vehicle else 28,
                    'departure_time': format_minutes_to_time(board_mins),
                    'departure_time_24h': format_minutes_to_24h(board_mins),
                    'arrival_time': format_minutes_to_time(alight_mins),
                    'arrival_time_24h': format_minutes_to_24h(alight_mins),
                    'expected_arrival_time': format_minutes_to_time(traffic_arrival_mins),
                    'traffic_delay_minutes': traffic_info['traffic_delay_minutes'],
                    'confidence_label': traffic_info['confidence_label'],
                    'board_minutes': board_mins,
                    'arrival_minutes': alight_mins,
                    'waiting_time_minutes': waiting_time,
                    'travel_time_minutes': travel_time,
                    'transfer_wait_minutes': 0,
                    'total_duration_minutes': total_duration,
                    'distance_km': road_data['distance_km'],
                    'road_distance_km': road_data['distance_km'],
                    'distance_label': f"{road_data['distance_km']} KM",
                    'road_routing_source': road_data['source'],
                    'route_geometry': road_data['geometry'],
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
                            'distance_km': road_data['distance_km'],
                            'geometry': road_data['geometry'],
                            'stops': segment_stops,
                            'stops_count': len(segment_stops)
                        }
                    ]
                })

        return direct_journeys

    def _find_transfer_journeys(self, source_stop, destination_stop, req_mins, day_of_week):
        transfer_journeys = []

        source_route_stops = RouteStop.query.filter_by(stop_id=source_stop.id).all()
        dest_route_stops = RouteStop.query.filter_by(stop_id=destination_stop.id).all()

        for s_rs in source_route_stops:
            route1 = s_rs.route
            if not route1 or not route1.is_active:
                continue

            route1_subsequent_stops = [
                rs for rs in route1.route_stops 
                if rs.stop_sequence > s_rs.stop_sequence and rs.stop_id != destination_stop.id
            ]

            for t_rs1 in route1_subsequent_stops:
                transfer_stop_id = t_rs1.stop_id
                candidate_route2_stops = RouteStop.query.filter_by(stop_id=transfer_stop_id).all()

                for t_rs2 in candidate_route2_stops:
                    route2 = t_rs2.route
                    if not route2 or not route2.is_active or route2.id == route1.id:
                        continue

                    d_rs2 = RouteStop.query.filter_by(route_id=route2.id, stop_id=destination_stop.id).first()
                    if not d_rs2 or d_rs2.stop_sequence <= t_rs2.stop_sequence:
                        continue

                    transfer_stop = db.session.get(BusStop, transfer_stop_id)
                    if not transfer_stop:
                        continue

                    # Road routing for segment 1 & segment 2 (Accurate, without double counting)
                    road1 = get_accurate_road_distance(
                        source_stop.latitude, source_stop.longitude,
                        transfer_stop.latitude, transfer_stop.longitude,
                        source_stop.id, transfer_stop.id
                    )
                    road2 = get_accurate_road_distance(
                        transfer_stop.latitude, transfer_stop.longitude,
                        destination_stop.latitude, destination_stop.longitude,
                        transfer_stop.id, destination_stop.id
                    )
                    total_road_km = round(road1['distance_km'] + road2['distance_km'], 1)
                    combined_geometry = road1['geometry'] + road2['geometry']

                    services1 = BusService.query.filter_by(route_id=route1.id).all()
                    services2 = BusService.query.filter_by(route_id=route2.id).all()

                    candidate_s1 = []
                    for s1 in services1:
                        if day_of_week not in s1.operating_days:
                            continue
                        s1_dept_mins = parse_time_to_minutes(s1.departure_time)
                        board1_mins = s1_dept_mins + s_rs.departure_offset_minutes
                        if board1_mins < req_mins:
                            continue
                        wait1_mins = board1_mins - req_mins
                        if wait1_mins > 900:
                            continue
                        candidate_s1.append((wait1_mins, board1_mins, s1))

                    candidate_s1.sort(key=lambda x: x[0])

                    for wait1_mins, board1_mins, s1 in candidate_s1[:3]:
                        s1_dept_mins = parse_time_to_minutes(s1.departure_time)
                        arrive_t_mins = s1_dept_mins + t_rs1.arrival_offset_minutes
                        travel1_mins = arrive_t_mins - board1_mins

                        best_s2 = None
                        best_board2_mins = None
                        best_transfer_wait = 9999

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

                            traffic_info = calculate_traffic_eta(board1_mins, road1['duration_minutes'] + road2['duration_minutes'], 2)
                            traffic_arrival_mins = (alight2_mins + traffic_info['traffic_delay_minutes']) % 1440

                            combined_status = 'VERIFIED' if (s1.verification_status == 'VERIFIED' and best_s2.verification_status == 'VERIFIED') else 'DEMO DATA'
                            reliability_status, note = self._determine_reliability(combined_status, board1_mins)

                            all_stops_r1 = sorted(route1.route_stops, key=lambda x: x.stop_sequence)
                            segment1_stops = [rs.to_dict() for rs in all_stops_r1 if s_rs.stop_sequence <= rs.stop_sequence <= t_rs1.stop_sequence]

                            all_stops_r2 = sorted(route2.route_stops, key=lambda x: x.stop_sequence)
                            segment2_stops = [rs.to_dict() for rs in all_stops_r2 if t_rs2.stop_sequence <= rs.stop_sequence <= d_rs2.stop_sequence]

                            total_fare = None
                            if s1.fare is not None and best_s2.fare is not None:
                                total_fare = round(s1.fare + best_s2.fare, 2)

                            sched2 = Schedule.query.filter_by(route_id=route2.id).first()

                            transfer_journeys.append({
                                'journey_type': 'TRANSFER_1',
                                'transfer_count': 1,
                                'transfer_stop': transfer_stop.to_dict() if transfer_stop else None,
                                'summary': f"Transfer via {transfer_stop.name}: Bus {route1.route_code} ➔ Bus {route2.route_code}",
                                'bus_name': f"Bus {route1.route_code} ➔ Bus {route2.route_code}",
                                'bus_number': f"KA-19-F-{1100 + route1.id * 50} / KA-19-F-{1200 + route2.id * 50}",
                                'schedule_id': sched2.id if sched2 else None,
                                'booking_enabled': False,
                                'available_seats': 24,
                                'departure_time': format_minutes_to_time(board1_mins),
                                'departure_time_24h': format_minutes_to_24h(board1_mins),
                                'arrival_time': format_minutes_to_time(alight2_mins),
                                'arrival_time_24h': format_minutes_to_24h(alight2_mins),
                                'expected_arrival_time': format_minutes_to_time(traffic_arrival_mins),
                                'traffic_delay_minutes': traffic_info['traffic_delay_minutes'],
                                'confidence_label': traffic_info['confidence_label'],
                                'board_minutes': board1_mins,
                                'arrival_minutes': alight2_mins,
                                'waiting_time_minutes': wait1_mins,
                                'travel_time_minutes': travel1_mins + travel2_mins,
                                'transfer_wait_minutes': best_transfer_wait,
                                'total_duration_minutes': total_duration,
                                'distance_km': total_road_km,
                                'road_distance_km': total_road_km,
                                'distance_label': f"{total_road_km} KM",
                                'road_routing_source': 'OSRM Road Routing Engine (Segments)',
                                'route_geometry': combined_geometry,
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
                                        'distance_km': road1['distance_km'],
                                        'geometry': road1['geometry'],
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
                                        'distance_km': road2['distance_km'],
                                        'geometry': road2['geometry'],
                                        'stops': segment2_stops,
                                        'stops_count': len(segment2_stops)
                                    }
                                ]
                            })

        return transfer_journeys

    def _get_fallback_suggestions(self, source_stop, destination_stop):
        """Find nearby alternative verified stops."""
        active_stops = BusStop.query.filter(
            BusStop.is_active == True,
            BusStop.id != source_stop.id,
            BusStop.id != destination_stop.id
        ).all()

        nearby_source = []
        for stop in active_stops:
            dist = calculate_distance(source_stop.latitude, source_stop.longitude, stop.latitude, stop.longitude)
            walk_time = int(math.ceil((dist / 4.5) * 60))
            nearby_source.append({
                'stop': stop.to_dict(),
                'distance_km': round(dist, 2),
                'walking_time_minutes': walk_time
            })
        nearby_source.sort(key=lambda x: x['distance_km'])

        return {
            'nearby_boarding_stops': nearby_source[:4],
            'advice': 'Try searching from a nearby central terminal like State Bank or Hampankatta, or select an earlier departure window.'
        }
