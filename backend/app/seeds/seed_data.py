from app.models import db
from app.models.user import User
from app.models.stop import BusStop
from app.models.route import BusRoute, RouteStop, BusService
from app.models.tracking import BusLocation
from app.models.place import Place
from app.models.booking import Vehicle, Seat, Schedule, Booking, BookingSeat, Passenger
from datetime import datetime, timedelta

def seed_all_mangalore_stops():
    """Seeds all 40+ authentic Mangaluru bus stops with verified GPS coordinates."""
    stops_data = [
        {"name": "State Bank", "desc": "City Bus Stand Hub, Car Street & Service Bus Terminal", "lat": 12.8617, "lon": 74.8378, "code": "STBK"},
        {"name": "Hampankatta", "desc": "Central commercial hub & Old Bus Stand junction", "lat": 12.8698, "lon": 74.8431, "code": "HMPK"},
        {"name": "Mangaluru Central", "desc": "Central Railway Station (MAQ), Attavar entrance", "lat": 12.8633, "lon": 74.8465, "code": "MAQC"},
        {"name": "Lalbagh", "desc": "Mangaluru City Corporation (MCC) & MG Road circle", "lat": 12.8795, "lon": 74.8427, "code": "LALB"},
        {"name": "Bejai", "desc": "KSRTC Inter-state Bus Terminal area & Church", "lat": 12.8856, "lon": 74.8485, "code": "BEJI"},
        {"name": "Kadri", "desc": "Kadri Manjunatha Temple & Kadri Park road", "lat": 12.8841, "lon": 74.8583, "code": "KADR"},
        {"name": "Kankanady", "desc": "Fr Muller Hospital, Flower Market & Bypass circle", "lat": 12.8647, "lon": 74.8624, "code": "KNKD"},
        {"name": "Pumpwell", "desc": "Mahaveera Circle & National Highway 66 Junction hub", "lat": 12.8615, "lon": 74.8724, "code": "PUMP"},
        {"name": "Mangaluru Junction", "desc": "Junction Railway Station (MAJN), Kankanady East", "lat": 12.8623, "lon": 74.8872, "code": "MAJN"},
        {"name": "Ladyhill", "desc": "Ladyhill Circle, Urwa Church & St. Aloysius School", "lat": 12.8885, "lon": 74.8360, "code": "LDHL"},
        {"name": "Urwa", "desc": "Urwa Stores & Marigudi temple road", "lat": 12.8912, "lon": 74.8340, "code": "URWA"},
        {"name": "Urwa Market", "desc": "Urwa Residential Market & Canara College vicinity", "lat": 12.8943, "lon": 74.8322, "code": "URWM"},
        {"name": "Kottara Chowki", "desc": "NH-66 Intersection, Infosys Kottara & Flyover junction", "lat": 12.9056, "lon": 74.8385, "code": "KTCH"},
        {"name": "Surathkal", "desc": "NITK Campus, Lighthouse & Surathkal Market terminal", "lat": 13.0113, "lon": 74.7937, "code": "SRTK"},
        {"name": "Kulai", "desc": "Honnakatte Junction & Kulai residential zone", "lat": 12.9865, "lon": 74.8052, "code": "KULI"},
        {"name": "Baikampady", "desc": "KIADB Industrial Estate & APMC Yard", "lat": 12.9642, "lon": 74.8105, "code": "BKMP"},
        {"name": "Panambur", "desc": "New Mangalore Port (NMPT) & Panambur Beach road", "lat": 12.9498, "lon": 74.8156, "code": "PNMB"},
        {"name": "Kulur", "desc": "Gurupura River Bridge & Tannirbhavi connection point", "lat": 12.9245, "lon": 74.8290, "code": "KULR"},
        {"name": "Kavoor", "desc": "Kavoor Mahalingeshwara Temple & Lake road", "lat": 12.9238, "lon": 74.8576, "code": "KAVR"},
        {"name": "Kavoor Junction", "desc": "Airport Road & Derebail junction", "lat": 12.9248, "lon": 74.8585, "code": "KVRJ"},
        {"name": "Derebail", "desc": "Konchady, Derebail Church & Residential Area", "lat": 12.9095, "lon": 74.8498, "code": "DRBL"},
        {"name": "Bondel", "desc": "MITE/St. Joseph Engineering, Airport bypass", "lat": 12.9341, "lon": 74.8710, "code": "BNDL"},
        {"name": "Vamanjoor", "desc": "Pilikula Nisargadhama & St. Joseph Eng College", "lat": 12.9192, "lon": 74.9008, "code": "VMNJ"},
        {"name": "Valencia", "desc": "Valencia Circle, St. Vincent Ferrer Church", "lat": 12.8592, "lon": 74.8562, "code": "VLNC"},
        {"name": "Falnir", "desc": "Mother Teresa Road, Highland & Kankanady link", "lat": 12.8645, "lon": 74.8510, "code": "FLNR"},
        {"name": "Attavar", "desc": "KMC Hospital Attavar & Central Station vicinity", "lat": 12.8598, "lon": 74.8448, "code": "ATVR"},
        {"name": "Jeppinamogaru", "desc": "Netravati River Bridge North bank & NH-66", "lat": 12.8462, "lon": 74.8695, "code": "JPMN"},
        {"name": "Thokkottu", "desc": "Thokkottu Overbridge & Ullal gate junction", "lat": 12.8258, "lon": 74.8672, "code": "TKKT"},
        {"name": "Ullal", "desc": "Rani Abbakka Circle, Dargah & Summer Sands area", "lat": 12.8062, "lon": 74.8569, "code": "ULLL"},
        {"name": "Deralakatte", "desc": "Yenepoya, KS Hegde & Nitte University Medical Hub", "lat": 12.8142, "lon": 74.8890, "code": "DRLK"},
        {"name": "Kotekar", "desc": "Kotekar Beeri Junction & Someshwara route", "lat": 12.7845, "lon": 74.8752, "code": "KTKR"},
        {"name": "Talapady", "desc": "Karnataka-Kerala Border Toll Gate Terminal", "lat": 12.7521, "lon": 74.8824, "code": "TLPD"},
        {"name": "Bendoorwell", "desc": "St. Theresa School, Balmatta & Kankanady road", "lat": 12.8710, "lon": 74.8550, "code": "BNDW"},
        {"name": "Mallikatte", "desc": "Kadri Kambla road & Lion's Club Circle", "lat": 12.8765, "lon": 74.8568, "code": "MLKT"},
        {"name": "Bunts Hostel", "desc": "Bunts Hostel Circle, Kadri Road & Ramakrishna College", "lat": 12.8732, "lon": 74.8475, "code": "BNTH"},
        {"name": "PVS Circle", "desc": "PVS Building, Kodialbail & Navabharath Circle", "lat": 12.8758, "lon": 74.8450, "code": "PVSC"},
        {"name": "Mannagudda", "desc": "Sanghaniketan & Kudroli Temple entrance", "lat": 12.8845, "lon": 74.8315, "code": "MNGD"},
        {"name": "Kodialbail", "desc": "Besant Women's College, District Court area", "lat": 12.8762, "lon": 74.8398, "code": "KDLB"},
        {"name": "Bharath Mall", "desc": "Bharath Mall, Big Bazaar & Bejai link", "lat": 12.8821, "lon": 74.8382, "code": "BHRM"},
        {"name": "Jyothi", "desc": "Dr. Ambedkar Circle, KMC Jyothi & Light House Hill", "lat": 12.8705, "lon": 74.8488, "code": "JYOT"},
        {"name": "Padil", "desc": "Mangaluru DC Office Complex & BC Road gateway", "lat": 12.8655, "lon": 74.8962, "code": "PADL"},
        {"name": "Bunder", "desc": "Old Port & Fisheries Dock", "lat": 12.8631, "lon": 74.8335, "code": "BNDR"},
        {"name": "Pilikula", "desc": "Pilikula Nisargadhama Biological Park, Vamanjoor", "lat": 12.9287, "lon": 74.9015, "code": "PLKL"}
    ]

    stop_map = {}
    for item in stops_data:
        stop = BusStop.query.filter_by(name=item["name"]).first()
        if not stop:
            stop = BusStop(
                name=item["name"],
                location_description=item["desc"],
                latitude=item["lat"],
                longitude=item["lon"],
                code=item["code"],
                is_active=True
            )
            db.session.add(stop)
            db.session.flush()
        else:
            stop.code = item["code"]
            stop.latitude = item["lat"]
            stop.longitude = item["lon"]
            stop.location_description = item["desc"]
        stop_map[item["name"]] = stop

    db.session.commit()
    return stop_map

def seed_mangalore_places(stop_map):
    """Seeds curated Mangaluru tourist, heritage, and shopping landmarks."""
    places_data = [
        {
            "name": "Panambur Beach",
            "category": "Beach & Recreation",
            "description": "Mangaluru's most popular sandy beach known for kite festivals, camel rides, watersports, and stunning Arabian Sea sunsets.",
            "lat": 12.9468, "lon": 74.8080,
            "stop_name": "Panambur",
            "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Tannirbhavi Beach & Tree Park",
            "category": "Beach & Nature",
            "description": "A tranquil pine-fringed coastal paradise with a tree park, wooden walkaways, and serene sea breeze.",
            "lat": 12.9015, "lon": 74.8145,
            "stop_name": "Urwa Market",
            "image": "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Kadri Manjunatha Temple",
            "category": "Temple & Heritage",
            "description": "Historic 10th-century temple situated on Kadri Hills housing ancient bronze statues and sacred natural natural spring Gomukhas.",
            "lat": 12.8872, "lon": 74.8601,
            "stop_name": "Kadri",
            "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Kudroli Gokarnanatheshwara Temple",
            "category": "Temple & Culture",
            "description": "Grand religious marvel founded by Narayana Guru, world-famous for its spectacular Mangaluru Dasara celebrations and lighting.",
            "lat": 12.8765, "lon": 74.8310,
            "stop_name": "Mannagudda",
            "image": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Mangaladevi Temple",
            "category": "Heritage Temple",
            "description": "The sacred 9th-century shrine dedicated to Goddess Mangaladevi, after whom the historic city of Mangaluru is named.",
            "lat": 12.8482, "lon": 74.8452,
            "stop_name": "Attavar",
            "image": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "St. Aloysius Chapel",
            "category": "Heritage & Architecture",
            "description": "Historic chapel built in 1880, featuring world-renowned Sistine-Chapel-style frescoes and oil paintings by Italian master Antony Moscheni.",
            "lat": 12.8725, "lon": 74.8445,
            "stop_name": "Hampankatta",
            "image": "https://images.unsplash.com/photo-1548625361-19602e1c3a64?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Sultan Battery Watchtower",
            "category": "Historical Fort",
            "description": "Historic mini-fortress built in 1784 by Tipu Sultan using black stones along Gurupura river to prevent British warships from entering.",
            "lat": 12.8875, "lon": 74.8242,
            "stop_name": "Ladyhill",
            "image": "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Pilikula Nisargadhama & Zoo",
            "category": "Eco-Tourism & Wildlife",
            "description": "Sprawling 370-acre eco-heritage park featuring a biological wildlife safari, botanical science centre, artisan village, and golf course.",
            "lat": 12.9287, "lon": 74.9015,
            "stop_name": "Vamanjoor",
            "image": "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Someshwara Beach & Rudra Shile",
            "category": "Beach & Scenic",
            "description": "Breathtaking coastline known for giant rocky formations called Rudra Shile and the ancient Someshwara Shiva Temple atop the hill.",
            "lat": 12.7932, "lon": 74.8580,
            "stop_name": "Ullal",
            "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "NITK Beach & Lighthouse",
            "category": "Beach & Landmark",
            "description": "Picturesque rocky shoreline with a prominent historic lighthouse adjacent to the prestigious National Institute of Technology Karnataka.",
            "lat": 13.0118, "lon": 74.7895,
            "stop_name": "Surathkal",
            "image": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Kadri Park & Musical Fountain",
            "category": "Park & Family",
            "description": "The largest municipal park in Mangaluru with lush green gardens, walking trails, and animated laser musical fountains.",
            "lat": 12.8855, "lon": 74.8620,
            "stop_name": "Kadri",
            "image": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "City Centre Mall Mangaluru",
            "category": "Shopping & Dining",
            "description": "One of the premier retail and lifestyle malls on KS Rao Road with five floors of national brands, food courts, and entertainment.",
            "lat": 12.8712, "lon": 74.8438,
            "stop_name": "Hampankatta",
            "image": "https://images.unsplash.com/photo-1567449303078-57ad995bd301?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Forum Fiza Mall (Nexus Fiza)",
            "category": "Shopping & Cinema",
            "description": "Modern shopping destination located on Pandeshwar Road featuring multiplex cinemas, dining restaurants, and global brands.",
            "lat": 12.8585, "lon": 74.8420,
            "stop_name": "Attavar",
            "image": "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Bharath Mall",
            "category": "Entertainment & Retail",
            "description": "Popular shopping complex opposite KSRTC bus stand featuring Cinepolis multiplex, Big Bazaar, and gaming arcade.",
            "lat": 12.8821, "lon": 74.8382,
            "stop_name": "Bharath Mall",
            "image": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80"
        }
    ]

    for p in places_data:
        existing = Place.query.filter_by(name=p["name"]).first()
        nearest_stop = stop_map.get(p["stop_name"])
        if not existing:
            new_place = Place(
                name=p["name"],
                category=p["category"],
                description=p["description"],
                latitude=p["lat"],
                longitude=p["lon"],
                nearest_stop_id=nearest_stop.id if nearest_stop else None,
                image_url=p["image"],
                is_verified=True
            )
            db.session.add(new_place)
        else:
            existing.category = p["category"]
            existing.description = p["description"]
            existing.latitude = p["lat"]
            existing.longitude = p["lon"]
            if nearest_stop:
                existing.nearest_stop_id = nearest_stop.id
            existing.image_url = p["image"]

    db.session.commit()

def seed_fleet_vehicles_and_seats(stop_map):
    """Seeds transit fleet vehicles with realistic 32-seat configurations."""
    r1a = BusRoute.query.filter_by(route_code="1A").first()
    r15 = BusRoute.query.filter_by(route_code="15").first()
    r27 = BusRoute.query.filter_by(route_code="27").first()
    r42 = BusRoute.query.filter_by(route_code="42").first()

    vehicles_data = [
        {
            "num": "KA-19-F-1204",
            "name": "Surathkal Express 1A",
            "operator": "DKBOA Mangaluru Private City Bus",
            "type": "A/C Coastal Express",
            "route": r1a
        },
        {
            "num": "KA-19-F-3891",
            "name": "Kadri Cityliner 15",
            "operator": "DKBOA Mangaluru Private City Bus",
            "type": "Standard City Bus",
            "route": r15
        },
        {
            "num": "KA-19-F-5502",
            "name": "Junction Connector 27",
            "operator": "DKBOA Mangaluru Private City Bus",
            "type": "Standard City Bus",
            "route": r27
        },
        {
            "num": "KA-19-F-7119",
            "name": "Ullal Coastal Shuttle 42",
            "operator": "DKBOA Mangaluru Private City Bus",
            "type": "Coastal Flyer",
            "route": r42
        },
        {
            "num": "KA-19-F-8400",
            "name": "Deralakatte Health Express 44",
            "operator": "DKBOA Mangaluru Private City Bus",
            "type": "A/C City Express",
            "route": None
        },
        {
            "num": "KA-19-F-9122",
            "name": "Pilikula Eco Explorer 19",
            "operator": "DKBOA Mangaluru Private City Bus",
            "type": "Eco Tourism Bus",
            "route": None
        }
    ]

    for v_info in vehicles_data:
        veh = Vehicle.query.filter_by(vehicle_number=v_info["num"]).first()
        if not veh:
            veh = Vehicle(
                vehicle_number=v_info["num"],
                vehicle_name=v_info["name"],
                operator=v_info["operator"],
                vehicle_type=v_info["type"],
                route_id=v_info["route"].id if v_info["route"] else None,
                total_seats=32,
                tracking_enabled=True,
                booking_enabled=True,
                data_source="DKBOA Mangaluru Fleet Demo"
            )
            db.session.add(veh)
            db.session.flush()

            # Create 32 seats: 8 rows of 4 seats (L1, L2, Aisle, R1, R2)
            # Row 1 to 8:
            # L1: Window Left, L2: Aisle Left, R1: Aisle Right, R2: Window Right
            cols = [
                ("A", "WINDOW", "L1"),
                ("B", "AISLE", "L2"),
                ("C", "AISLE", "R1"),
                ("D", "WINDOW", "R2")
            ]
            for row in range(1, 9):
                for letter, stype, col_pos in cols:
                    seat_num = f"{row}{letter}"
                    seat = Seat(
                        vehicle_id=veh.id,
                        seat_number=seat_num,
                        seat_type=stype,
                        row_number=row,
                        column_position=col_pos,
                        is_active=True
                    )
                    db.session.add(seat)
            db.session.commit()

def seed_schedules_and_demo_bookings(stop_map):
    """Seeds booking schedules across Mangaluru routes with realistic fares and demo bookings."""
    state_bank = stop_map.get("State Bank")
    surathkal = stop_map.get("Surathkal")
    kadri = stop_map.get("Kadri")
    junction = stop_map.get("Mangaluru Junction")
    ullal = stop_map.get("Ullal")
    deralakatte = stop_map.get("Deralakatte")
    vamanjoor = stop_map.get("Vamanjoor")

    v1 = Vehicle.query.filter_by(vehicle_number="KA-19-F-1204").first()
    v2 = Vehicle.query.filter_by(vehicle_number="KA-19-F-3891").first()
    v3 = Vehicle.query.filter_by(vehicle_number="KA-19-F-5502").first()
    v4 = Vehicle.query.filter_by(vehicle_number="KA-19-F-7119").first()
    v5 = Vehicle.query.filter_by(vehicle_number="KA-19-F-8400").first()
    v6 = Vehicle.query.filter_by(vehicle_number="KA-19-F-9122").first()

    r1a = BusRoute.query.filter_by(route_code="1A").first()
    r15 = BusRoute.query.filter_by(route_code="15").first()
    r27 = BusRoute.query.filter_by(route_code="27").first()
    r42 = BusRoute.query.filter_by(route_code="42").first()

    schedules_specs = [
        {
            "vehicle": v1, "route": r1a, "dep": state_bank, "dest": surathkal,
            "dtime": "08:00", "atime": "08:50", "dur": 50, "fare": 35.0
        },
        {
            "vehicle": v1, "route": r1a, "dep": state_bank, "dest": surathkal,
            "dtime": "11:30", "atime": "12:20", "dur": 50, "fare": 35.0
        },
        {
            "vehicle": v1, "route": r1a, "dep": state_bank, "dest": surathkal,
            "dtime": "16:00", "atime": "16:50", "dur": 50, "fare": 35.0
        },
        {
            "vehicle": v2, "route": r15, "dep": state_bank, "dest": kadri,
            "dtime": "09:00", "atime": "09:25", "dur": 25, "fare": 20.0
        },
        {
            "vehicle": v2, "route": r15, "dep": state_bank, "dest": kadri,
            "dtime": "14:45", "atime": "15:10", "dur": 25, "fare": 20.0
        },
        {
            "vehicle": v3, "route": r27, "dep": state_bank, "dest": junction,
            "dtime": "08:30", "atime": "08:56", "dur": 26, "fare": 22.0
        },
        {
            "vehicle": v3, "route": r27, "dep": state_bank, "dest": junction,
            "dtime": "17:45", "atime": "18:11", "dur": 26, "fare": 22.0
        },
        {
            "vehicle": v4, "route": r42, "dep": state_bank, "dest": ullal,
            "dtime": "10:00", "atime": "10:35", "dur": 35, "fare": 25.0
        },
        {
            "vehicle": v4, "route": r42, "dep": state_bank, "dest": ullal,
            "dtime": "15:30", "atime": "16:05", "dur": 35, "fare": 25.0
        }
    ]

    for spec in schedules_specs:
        if not (spec["vehicle"] and spec["route"] and spec["dep"] and spec["dest"]):
            continue
        existing_sched = Schedule.query.filter_by(
            vehicle_id=spec["vehicle"].id,
            departure_time=spec["dtime"],
            departure_stop_id=spec["dep"].id
        ).first()

        if not existing_sched:
            sched = Schedule(
                vehicle_id=spec["vehicle"].id,
                route_id=spec["route"].id,
                departure_stop_id=spec["dep"].id,
                destination_stop_id=spec["dest"].id,
                departure_time=spec["dtime"],
                arrival_time=spec["atime"],
                estimated_duration_minutes=spec["dur"],
                operating_days="Mon,Tue,Wed,Thu,Fri,Sat,Sun",
                fare=spec["fare"],
                booking_enabled=True,
                verification_status="DEMO DATA"
            )
            db.session.add(sched)
            db.session.flush()

            # Seed sample demo booking for today so seats 1A and 1B appear OCCUPIED
            today_str = datetime.utcnow().strftime('%Y-%m-%d')
            if spec["dtime"] == "08:00":
                demo_booking = Booking(
                    booking_reference="MBC-MGL-DEMO01",
                    user_id=1,
                    schedule_id=sched.id,
                    travel_date=today_str,
                    departure_time="08:00",
                    total_passengers=2,
                    total_amount=spec["fare"] * 2,
                    booking_status="CONFIRMED",
                    booking_source="DEMO BOOKING"
                )
                db.session.add(demo_booking)
                db.session.flush()

                seats_to_book = Seat.query.filter(
                    Seat.vehicle_id == spec["vehicle"].id,
                    Seat.seat_number.in_(["1A", "1B"])
                ).all()

                for s in seats_to_book:
                    bs = BookingSeat(
                        booking_id=demo_booking.id,
                        seat_id=s.id,
                        seat_number=s.seat_number
                    )
                    db.session.add(bs)

                p1 = Passenger(booking_id=demo_booking.id, passenger_name="Ramesh Rao", passenger_gender="MALE", seat_number="1A")
                p2 = Passenger(booking_id=demo_booking.id, passenger_name="Sunita Rao", passenger_gender="FEMALE", seat_number="1B")
                db.session.add_all([p1, p2])

    db.session.commit()

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

def seed_routes_and_services(stop_map):
    """Seeds routes, route stops, and timetable services if not already present."""
    if BusRoute.query.first():
        return

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
            "services": ["06:50", "07:35", "08:20", "09:05", "09:50", "10:45", "11:45", "12:45", "14:00", "15:15", "16:30", "17:30", "18:30", "19:30", "20:30"]
        },
        {
            "code": "42",
            "name": "State Bank to Ullal via Pumpwell",
            "operator": "DKBOA Mangaluru Private City Bus",
            "origin": "State Bank",
            "dest": "Ullal",
            "status": "DEMO DATA",
            "stops": [
                ("State Bank", 0, 0),
                ("Hampankatta", 4, 5),
                ("Kankanady", 11, 12),
                ("Pumpwell", 18, 19),
                ("Ullal", 35, 35)
            ],
            "fare": 22.0,
            "services": ["06:00", "07:00", "08:00", "09:00", "10:00", "11:15", "12:30", "13:45", "15:00", "16:15", "17:30", "18:45", "20:00"]
        },
        {
            "code": "42R",
            "name": "Ullal to State Bank via Pumpwell",
            "operator": "DKBOA Mangaluru Private City Bus",
            "origin": "Ullal",
            "dest": "State Bank",
            "status": "DEMO DATA",
            "stops": [
                ("Ullal", 0, 0),
                ("Pumpwell", 16, 17),
                ("Kankanady", 23, 24),
                ("Hampankatta", 30, 31),
                ("State Bank", 36, 36)
            ],
            "fare": 22.0,
            "services": ["06:45", "07:45", "08:45", "09:45", "10:45", "12:00", "13:15", "14:30", "15:45", "17:00", "18:15", "19:30", "20:45"]
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
        origin_st = stop_map.get(r_def["origin"])
        dest_st = stop_map.get(r_def["dest"])
        if not origin_st or not dest_st:
            continue

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
            st = stop_map.get(st_name)
            if not st:
                continue
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

    db.session.commit()

def seed_database():
    """Populates the database with realistic Mangaluru bus network demonstration data."""
    # Check users
    if not User.query.first():
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
        db.session.commit()

    # Seed 40+ stops
    stop_map = seed_all_mangalore_stops()

    # Seed routes and timetable services
    seed_routes_and_services(stop_map)

    # Seed tracking
    seed_tracked_vehicles()

    # Seed Curated Places
    seed_mangalore_places(stop_map)

    # Seed Fleet Vehicles & 32 Seats
    seed_fleet_vehicles_and_seats(stop_map)

    # Seed Schedules and initial bookings
    seed_schedules_and_demo_bookings(stop_map)

    print("Phase 3 Database Expansion completed successfully!")
