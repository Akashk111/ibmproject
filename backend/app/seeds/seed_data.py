from app.models import db
from app.models.user import User
from app.models.stop import BusStop
from app.models.route import BusRoute, RouteStop, BusService
from app.models.tracking import BusLocation

def seed_tracked_vehicles():
    """Seeds sample demo buses if not already present."""
    if BusLocation.query.first():
        return

    r1a = BusRoute.query.filter_by(route_code="1A").first()
    r15 = BusRoute.query.filter_by(route_code="15").first()
    r27 = BusRoute.query.filter_by(route_code="27").first()
    r42 = BusRoute.query.filter_by(route_code="42").first()

    lalbagh = BusStop.query.filter_by(name="Lalbagh").first()
    ladyhill = BusStop.query.filter_by(name="Ladyhill").first()
    bejai = BusStop.query.filter_by(name="Bejai").first()
    kadri = BusStop.query.filter_by(name="Kadri").first()
    kankanady = BusStop.query.filter_by(name="Kankanady").first()
    pumpwell = BusStop.query.filter_by(name="Pumpwell").first()
    ullal = BusStop.query.filter_by(name="Ullal").first()

    tracked_vehicles = [
        BusLocation(
            vehicle_id="KA-19-F-1204",
            vehicle_name="Surathkal Express 1A",
            route_id=r1a.id if r1a else 1,
            latitude=lalbagh.latitude if lalbagh else 12.8795,
            longitude=lalbagh.longitude if lalbagh else 74.8427,
            speed=32.0,
            heading=345.0,
            next_stop_id=ladyhill.id if ladyhill else 10,
            eta_minutes=4,
            source_type="DEMO",
            is_active=True
        ),
        BusLocation(
            vehicle_id="KA-19-F-3891",
            vehicle_name="Kadri Cityliner 15",
            route_id=r15.id if r15 else 3,
            latitude=bejai.latitude if bejai else 12.8856,
            longitude=bejai.longitude if bejai else 74.8485,
            speed=28.5,
            heading=60.0,
            next_stop_id=kadri.id if kadri else 6,
            eta_minutes=6,
            source_type="DEMO",
            is_active=True
        ),
        BusLocation(
            vehicle_id="KA-19-F-5502",
            vehicle_name="Junction Connector 27",
            route_id=r27.id if r27 else 5,
            latitude=kankanady.latitude if kankanady else 12.8647,
            longitude=kankanady.longitude if kankanady else 74.8624,
            speed=30.0,
            heading=120.0,
            next_stop_id=pumpwell.id if pumpwell else 8,
            eta_minutes=5,
            source_type="DEMO",
            is_active=True
        ),
        BusLocation(
            vehicle_id="KA-19-F-7119",
            vehicle_name="Ullal Coastal Shuttle 42",
            route_id=r42.id if r42 else 7,
            latitude=pumpwell.latitude if pumpwell else 12.8615,
            longitude=pumpwell.longitude if pumpwell else 74.8724,
            speed=35.0,
            heading=195.0,
            next_stop_id=ullal.id if ullal else 14,
            eta_minutes=12,
            source_type="DEMO",
            is_active=True
        )
    ]
    db.session.add_all(tracked_vehicles)
    db.session.commit()
    print("Tracked vehicles seeded successfully!")

def seed_database():
    """Populates the database with realistic Mangaluru bus network demonstration data."""
    # Check if database already has tracked vehicles
    if BusStop.query.first():
        if BusLocation.query.first() is None:
            seed_tracked_vehicles()
        print("Database already seeded. Skipping initial seeding.")
        return

    print("Seeding Mangaluru Bus Connect database...")

    # 1. Users (Admin and Test Commuter)
    admin_user = User(
        name="Mangaluru Transit Admin",
        email="admin@mangaluru.gov.in",
        role="admin"
    )
    admin_user.set_password("admin123")

    commuter_user = User(
        name="Akash Shenoy",
        email="commuter@mangaluru.in",
        role="user"
    )
    commuter_user.set_password("user123")

    db.session.add_all([admin_user, commuter_user])
    db.session.flush()

    # 2. Authentic Mangaluru Bus Stops with verified GPS coordinates
    stops_data = [
        {"name": "State Bank", "desc": "City Bus Stand Hub, Car Street vicinity", "lat": 12.8617, "lon": 74.8378},
        {"name": "Hampankatta", "desc": "Central commercial hub & Old Bus Stand", "lat": 12.8698, "lon": 74.8431},
        {"name": "Mangaluru Central", "desc": "Central Railway Station (MAQ), Attavar", "lat": 12.8633, "lon": 74.8465},
        {"name": "Lalbagh", "desc": "Mangaluru City Corporation (MCC) & MG Road", "lat": 12.8795, "lon": 74.8427},
        {"name": "Bejai", "desc": "KSRTC Inter-state Bus Terminal area", "lat": 12.8856, "lon": 74.8485},
        {"name": "Kadri", "desc": "Kadri Manjunatha Temple & Kadri Park", "lat": 12.8841, "lon": 74.8583},
        {"name": "Kankanady", "desc": "Fr Muller Hospital & Flower Market", "lat": 12.8647, "lon": 74.8624},
        {"name": "Pumpwell", "desc": "Mahaveera Circle & National Highway 66 Junction", "lat": 12.8615, "lon": 74.8724},
        {"name": "Mangaluru Junction", "desc": "Junction Railway Station (MAJN), Kankanady", "lat": 12.8623, "lon": 74.8872},
        {"name": "Ladyhill", "desc": "Ladyhill Circle & St. Aloysius Urwa", "lat": 12.8885, "lon": 74.8360},
        {"name": "Urwa Market", "desc": "Urwa Stores & Residential Market", "lat": 12.8943, "lon": 74.8322},
        {"name": "Kottara Chowki", "desc": "NH-66 Intersection & Infosys Kottara", "lat": 12.9056, "lon": 74.8385},
        {"name": "Surathkal", "desc": "NITK Campus, Lighthouse & Surathkal Market", "lat": 13.0113, "lon": 74.7937},
        {"name": "Ullal", "desc": "Rani Abbakka Circle, Dargah & Summer Sands", "lat": 12.8062, "lon": 74.8569},
        {"name": "Bunder", "desc": "Old Port & Fisheries Dock", "lat": 12.8631, "lon": 74.8335},
        {"name": "Pilikula", "desc": "Pilikula Nisargadhama Biological Park, Vamanjoor", "lat": 12.9287, "lon": 74.9015}
    ]

    stop_map = {}
    for item in stops_data:
        stop = BusStop(
            name=item["name"],
            location_description=item["desc"],
            latitude=item["lat"],
            longitude=item["lon"],
            is_active=True
        )
        db.session.add(stop)
        db.session.flush()
        stop_map[item["name"]] = stop

    # 3. Routes
    routes_def = [
        {
            "code": "1A",
            "name": "State Bank to Surathkal (NITK)",
            "operator": "DKBOA Mangaluru Private City Bus",
            "origin": "State Bank",
            "dest": "Surathkal",
            "status": "DEMO DATA",
            "stops": [
                ("State Bank", 0, 0),
                ("Hampankatta", 4, 5),
                ("Lalbagh", 10, 11),
                ("Ladyhill", 16, 17),
                ("Urwa Market", 22, 23),
                ("Kottara Chowki", 28, 29),
                ("Surathkal", 50, 50)
            ],
            "fare": 30.0,
            "services": ["06:30", "07:15", "08:00", "08:45", "09:30", "10:15", "11:30", "13:00", "14:30", "16:00", "17:15", "18:00", "19:00", "20:30"]
        },
        {
            "code": "1B",
            "name": "Surathkal (NITK) to State Bank",
            "operator": "DKBOA Mangaluru Private City Bus",
            "origin": "Surathkal",
            "dest": "State Bank",
            "status": "DEMO DATA",
            "stops": [
                ("Surathkal", 0, 0),
                ("Kottara Chowki", 20, 21),
                ("Urwa Market", 26, 27),
                ("Ladyhill", 32, 33),
                ("Lalbagh", 38, 39),
                ("Hampankatta", 45, 46),
                ("State Bank", 52, 52)
            ],
            "fare": 30.0,
            "services": ["07:00", "07:45", "08:30", "09:15", "10:00", "11:00", "12:30", "14:00", "15:30", "17:00", "18:00", "19:15", "20:45"]
        },
        {
            "code": "15",
            "name": "State Bank to Kadri Park via Lalbagh & Bejai",
            "operator": "DKBOA Mangaluru Private City Bus",
            "origin": "State Bank",
            "dest": "Kadri",
            "status": "VERIFIED",
            "stops": [
                ("State Bank", 0, 0),
                ("Hampankatta", 4, 5),
                ("Lalbagh", 10, 11),
                ("Bejai", 16, 17),
                ("Kadri", 23, 23)
            ],
            "fare": 15.0,
            "services": ["06:45", "07:30", "08:15", "09:00", "09:45", "10:30", "11:15", "12:15", "13:30", "14:45", "15:45", "16:45", "17:30", "18:15", "19:15", "20:15", "21:00"]
        },
        {
            "code": "15R",
            "name": "Kadri to State Bank via Bejai & Lalbagh",
            "operator": "DKBOA Mangaluru Private City Bus",
            "origin": "Kadri",
            "dest": "State Bank",
            "status": "VERIFIED",
            "stops": [
                ("Kadri", 0, 0),
                ("Bejai", 6, 7),
                ("Lalbagh", 12, 13),
                ("Hampankatta", 18, 19),
                ("State Bank", 24, 24)
            ],
            "fare": 15.0,
            "services": ["07:15", "08:00", "08:45", "09:30", "10:15", "11:00", "12:00", "13:00", "14:15", "15:30", "16:30", "17:15", "18:00", "19:00", "20:00", "21:30"]
        },
        {
            "code": "27",
            "name": "State Bank to Mangaluru Junction via Pumpwell",
            "operator": "DKBOA Mangaluru Private City Bus",
            "origin": "State Bank",
            "dest": "Mangaluru Junction",
            "status": "DEMO DATA",
            "stops": [
                ("State Bank", 0, 0),
                ("Hampankatta", 4, 5),
                ("Kankanady", 11, 12),
                ("Pumpwell", 18, 19),
                ("Mangaluru Junction", 26, 26)
            ],
            "fare": 18.0,
            "services": ["06:15", "07:00", "07:45", "08:30", "09:15", "10:00", "11:00", "12:00", "13:15", "14:30", "15:45", "16:45", "17:45", "18:45", "19:45", "21:00"]
        },
        {
            "code": "27R",
            "name": "Mangaluru Junction to State Bank via Pumpwell",
            "operator": "DKBOA Mangaluru Private City Bus",
            "origin": "Mangaluru Junction",
            "dest": "State Bank",
            "status": "DEMO DATA",
            "stops": [
                ("Mangaluru Junction", 0, 0),
                ("Pumpwell", 7, 8),
                ("Kankanady", 14, 15),
                ("Hampankatta", 21, 22),
                ("State Bank", 27, 27)
            ],
            "fare": 18.0,
            "services": ["06:45", "07:30", "08:15", "09:00", "09:45", "10:45", "11:45", "12:45", "14:00", "15:15", "16:30", "17:30", "18:30", "19:30", "20:30", "21:45"]
        },
        {
            "code": "42",
            "name": "State Bank to Ullal via Mangaluru Central & Kankanady",
            "operator": "KSRTC Mangaluru City Suburban",
            "origin": "State Bank",
            "dest": "Ullal",
            "status": "DEMO DATA",
            "stops": [
                ("State Bank", 0, 0),
                ("Mangaluru Central", 5, 6),
                ("Kankanady", 12, 13),
                ("Pumpwell", 18, 19),
                ("Ullal", 35, 35)
            ],
            "fare": 25.0,
            "services": ["06:30", "07:30", "08:30", "09:30", "10:45", "12:00", "13:30", "15:00", "16:30", "17:30", "18:45", "20:00", "21:15"]
        },
        {
            "code": "42R",
            "name": "Ullal to State Bank via Kankanady & Central",
            "operator": "KSRTC Mangaluru City Suburban",
            "origin": "Ullal",
            "dest": "State Bank",
            "status": "DEMO DATA",
            "stops": [
                ("Ullal", 0, 0),
                ("Pumpwell", 15, 16),
                ("Kankanady", 21, 22),
                ("Mangaluru Central", 28, 29),
                ("State Bank", 35, 35)
            ],
            "fare": 25.0,
            "services": ["07:15", "08:15", "09:15", "10:15", "11:30", "12:45", "14:15", "15:45", "17:15", "18:15", "19:30", "20:45"]
        },
        {
            "code": "19",
            "name": "State Bank to Pilikula Nisargadhama via Kadri",
            "operator": "DKBOA Mangaluru Private City Bus",
            "origin": "State Bank",
            "dest": "Pilikula",
            "status": "DEMO DATA",
            "stops": [
                ("State Bank", 0, 0),
                ("Hampankatta", 4, 5),
                ("Kadri", 15, 16),
                ("Pilikula", 38, 38)
            ],
            "fare": 28.0,
            "services": ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30"]
        }
    ]

    for r_def in routes_def:
        origin_st = stop_map[r_def["origin"]]
        dest_st = stop_map[r_def["dest"]]

        route = BusRoute(
            route_code=r_def["code"],
            route_name=r_def["name"],
            operator=r_def["operator"],
            origin_stop_id=origin_st.id,
            destination_stop_id=dest_st.id,
            is_active=True,
            data_source="Mangaluru City Bus Timetable Reference 2025",
            verification_status=r_def["status"]
        )
        db.session.add(route)
        db.session.flush()

        # Route stops
        for seq, (st_name, arr_off, dep_off) in enumerate(r_def["stops"], 1):
            st = stop_map[st_name]
            rs = RouteStop(
                route_id=route.id,
                stop_id=st.id,
                stop_sequence=seq,
                arrival_offset_minutes=arr_off,
                departure_offset_minutes=dep_off
            )
            db.session.add(rs)

        # Services / Timetable
        max_duration = r_def["stops"][-1][1]
        for dept in r_def["services"]:
            service = BusService(
                route_id=route.id,
                service_name=f"Trip from {origin_st.name}",
                operating_days="Mon,Tue,Wed,Thu,Fri,Sat,Sun",
                departure_time=dept,
                estimated_duration_minutes=max_duration,
                fare=r_def["fare"],
                verification_status=r_def["status"]
            )
            db.session.add(service)

    # 4. Seed Tracked Demo Vehicles
    r1a = BusRoute.query.filter_by(route_code="1A").first()
    r15 = BusRoute.query.filter_by(route_code="15").first()
    r27 = BusRoute.query.filter_by(route_code="27").first()
    r42 = BusRoute.query.filter_by(route_code="42").first()

    lalbagh = stop_map.get("Lalbagh")
    ladyhill = stop_map.get("Ladyhill")
    bejai = stop_map.get("Bejai")
    kadri = stop_map.get("Kadri")
    kankanady = stop_map.get("Kankanady")
    pumpwell = stop_map.get("Pumpwell")

    tracked_vehicles = [
        BusLocation(
            vehicle_id="KA-19-F-1204",
            vehicle_name="Surathkal Express 1A",
            route_id=r1a.id if r1a else 1,
            latitude=lalbagh.latitude if lalbagh else 12.8795,
            longitude=lalbagh.longitude if lalbagh else 74.8427,
            speed=32.0,
            heading=345.0,
            next_stop_id=ladyhill.id if ladyhill else 10,
            eta_minutes=4,
            source_type="DEMO",
            is_active=True
        ),
        BusLocation(
            vehicle_id="KA-19-F-3891",
            vehicle_name="Kadri Cityliner 15",
            route_id=r15.id if r15 else 3,
            latitude=bejai.latitude if bejai else 12.8856,
            longitude=bejai.longitude if bejai else 74.8485,
            speed=28.5,
            heading=60.0,
            next_stop_id=kadri.id if kadri else 6,
            eta_minutes=6,
            source_type="DEMO",
            is_active=True
        ),
        BusLocation(
            vehicle_id="KA-19-F-5502",
            vehicle_name="Junction Connector 27",
            route_id=r27.id if r27 else 5,
            latitude=kankanady.latitude if kankanady else 12.8647,
            longitude=kankanady.longitude if kankanady else 74.8624,
            speed=30.0,
            heading=120.0,
            next_stop_id=pumpwell.id if pumpwell else 8,
            eta_minutes=5,
            source_type="DEMO",
            is_active=True
        ),
        BusLocation(
            vehicle_id="KA-19-F-7119",
            vehicle_name="Ullal Coastal Shuttle 42",
            route_id=r42.id if r42 else 7,
            latitude=pumpwell.latitude if pumpwell else 12.8615,
            longitude=pumpwell.longitude if pumpwell else 74.8724,
            speed=35.0,
            heading=195.0,
            next_stop_id=stop_map.get("Ullal").id if stop_map.get("Ullal") else 14,
            eta_minutes=12,
            source_type="DEMO",
            is_active=True
        )
    ]
    db.session.add_all(tracked_vehicles)

    db.session.commit()
    print("Database successfully seeded with Mangaluru stops, routes, services, and tracked buses!")
