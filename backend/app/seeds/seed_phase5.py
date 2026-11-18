from app import create_app, db
from app.models.stop import BusStop
from app.models.route import BusRoute, RouteStop, BusService
from app.models.booking import Vehicle, Seat, Schedule
from app.algorithms.road_routing import get_accurate_road_distance

def seed_phase5_intercity_network():
    print("Seeding Phase 5 VRL-Inspired Intercity & Regional Destinations...")
    
    cities = [
        {"name": "Bengaluru", "desc": "Majestic Kempegowda & Shantinagar Satellite Bus Terminal", "lat": 12.9716, "lon": 77.5946, "code": "BLRU"},
        {"name": "Udupi", "desc": "Service & City Bus Stand, Sri Krishna Temple Circle", "lat": 13.3409, "lon": 74.7421, "code": "UDPI"},
        {"name": "Manipal", "desc": "Tiger Circle, MIT Campus & MAHE University Terminal", "lat": 13.3525, "lon": 74.7865, "code": "MNPL"},
        {"name": "Mysuru", "desc": "Suburban KSRTC Bus Stand & Palace Highway Road", "lat": 12.2958, "lon": 76.6394, "code": "MYS"},
        {"name": "Hubballi", "desc": "Old Bus Stand, CBT & North Karnataka Transit Junction", "lat": 15.3647, "lon": 75.1240, "code": "HBL"},
        {"name": "Shivamogga", "desc": "KSRTC Central Bus Terminal & Sahyadri Gate", "lat": 13.9299, "lon": 75.5681, "code": "SHVG"},
        {"name": "Hassan", "desc": "Hassan New Central Bus Terminal & Belur Highway", "lat": 13.0072, "lon": 76.0963, "code": "HSN"},
        {"name": "Madikeri", "desc": "Coorg Hill Station Private & KSRTC Bus Terminal", "lat": 12.4244, "lon": 75.7382, "code": "MDKR"},
        {"name": "Kasaragod", "desc": "New Bus Stand & Bekal Fort Coastal Gateway", "lat": 12.5102, "lon": 74.9852, "code": "KSRG"},
        {"name": "Kozhikode", "desc": "Calicut KSRTC & Palayam Central Terminal", "lat": 11.2588, "lon": 75.7804, "code": "CLCT"},
        {"name": "Kannur", "desc": "Central Bus Terminal & Fort Road Junction", "lat": 11.8745, "lon": 75.3704, "code": "KNNR"},
        {"name": "Puttur", "desc": "Puttur KSRTC & Sri Mahalingeshwara Temple Stand", "lat": 12.7667, "lon": 75.2000, "code": "PTTR"},
        {"name": "Kundapura", "desc": "Shastri Circle Central Bus Stand & NH-66 Junction", "lat": 13.6277, "lon": 74.6934, "code": "KNDP"}
    ]

    city_stops = {}
    for c in cities:
        stop = BusStop.query.filter_by(name=c["name"]).first()
        if not stop:
            stop = BusStop(
                name=c["name"],
                location_description=c["desc"],
                latitude=c["lat"],
                longitude=c["lon"],
                code=c["code"],
                is_active=True
            )
            db.session.add(stop)
            db.session.flush()
        else:
            stop.latitude = c["lat"]
            stop.longitude = c["lon"]
            stop.code = c["code"]
            stop.location_description = c["desc"]
        city_stops[c["name"]] = stop

    db.session.commit()

    # Get local anchor stops
    state_bank = BusStop.query.filter_by(name="State Bank").first()
    bejai = BusStop.query.filter_by(name="Bejai").first() or state_bank
    surathkal = BusStop.query.filter_by(name="Surathkal").first()

    # Seed Luxury & Intercity Fleet
    new_vehicles = [
        {
            "num": "KA-19-AB-2040",
            "name": "Canara Multi-Axle Sleeper",
            "operator": "Canara Coastal Lines",
            "type": "AC Sleeper",
            "seats": 32
        },
        {
            "num": "KA-19-F-6210",
            "name": "Sahyadri Night Express",
            "operator": "DKBOA Mangaluru Express",
            "type": "Non-AC Sleeper",
            "seats": 32
        },
        {
            "num": "KA-19-F-4488",
            "name": "Airavat Club Class",
            "operator": "Coastal Transit Lines",
            "type": "Semi-Sleeper",
            "seats": 32
        },
        {
            "num": "KA-19-F-3320",
            "name": "Kudla Coastal Deluxe",
            "operator": "DKBOA Mangaluru Private Bus",
            "type": "Non-AC Seater",
            "seats": 32
        }
    ]

    veh_map = {}
    for v in new_vehicles:
        veh = Vehicle.query.filter_by(vehicle_number=v["num"]).first()
        if not veh:
            veh = Vehicle(
                vehicle_number=v["num"],
                vehicle_name=v["name"],
                operator=v["operator"],
                vehicle_type=v["type"],
                total_seats=v["seats"],
                tracking_enabled=True,
                booking_enabled=True,
                data_source="Verified Intercity Fleet"
            )
            db.session.add(veh)
            db.session.flush()

            # Generate 32 seats
            for r in range(1, 9):
                for col in ['L1', 'L2', 'R1', 'R2']:
                    seat_num = f"{r}{'A' if col=='L1' else 'B' if col=='L2' else 'C' if col=='R1' else 'D'}"
                    st = Seat(
                        vehicle_id=veh.id,
                        seat_number=seat_num,
                        seat_type='WINDOW' if col in ['L1', 'R2'] else 'AISLE',
                        row_number=r,
                        column_position=col,
                        is_active=True
                    )
                    db.session.add(st)
        veh_map[v["num"]] = veh

    db.session.commit()

    # Existing vehicles
    v_coastal = Vehicle.query.filter_by(vehicle_number="KA-19-F-1204").first()
    v_flyer = Vehicle.query.filter_by(vehicle_number="KA-19-F-7119").first()

    # Seed Intercity Routes and Timetable Schedules
    routes_def = [
        {
            "code": "KA-01",
            "name": "Mangaluru to Bengaluru via Hassan",
            "origin": bejai,
            "dest": city_stops["Bengaluru"],
            "operator": "Canara Coastal Lines",
            "vehicle": veh_map["KA-19-AB-2040"],
            "dep_time": "21:30",
            "arr_time": "05:45",
            "duration": 495,
            "fare": 750.0
        },
        {
            "code": "KA-02",
            "name": "Mangaluru to Udupi & Manipal via Surathkal",
            "origin": state_bank,
            "dest": city_stops["Manipal"],
            "operator": "DKBOA Mangaluru Express",
            "vehicle": veh_map["KA-19-F-4488"],
            "dep_time": "07:45",
            "arr_time": "09:15",
            "duration": 90,
            "fare": 95.0
        },
        {
            "code": "KA-03",
            "name": "Mangaluru to Mysuru via Madikeri (Coorg)",
            "origin": bejai,
            "dest": city_stops["Mysuru"],
            "operator": "Coastal Transit Lines",
            "vehicle": veh_map["KA-19-F-6210"],
            "dep_time": "13:00",
            "arr_time": "18:30",
            "duration": 330,
            "fare": 380.0
        },
        {
            "code": "KA-04",
            "name": "Mangaluru to Kundapura via Udupi",
            "origin": state_bank,
            "dest": city_stops["Kundapura"],
            "operator": "DKBOA Mangaluru Private Bus",
            "vehicle": veh_map["KA-19-F-3320"],
            "dep_time": "08:15",
            "arr_time": "10:30",
            "duration": 135,
            "fare": 130.0
        },
        {
            "code": "KA-05",
            "name": "Mangaluru to Kasaragod via Talapady",
            "origin": state_bank,
            "dest": city_stops["Kasaragod"],
            "operator": "DKBOA Mangaluru Private Bus",
            "vehicle": v_flyer or veh_map["KA-19-F-3320"],
            "dep_time": "09:30",
            "arr_time": "11:00",
            "duration": 90,
            "fare": 65.0
        },
        {
            "code": "KA-06",
            "name": "Mangaluru to Puttur via Pumpwell & BC Road",
            "origin": state_bank,
            "dest": city_stops["Puttur"],
            "operator": "DKBOA Mangaluru Private Bus",
            "vehicle": v_coastal or veh_map["KA-19-F-4488"],
            "dep_time": "10:15",
            "arr_time": "11:45",
            "duration": 90,
            "fare": 60.0
        },
        {
            "code": "KA-07",
            "name": "Mangaluru to Hubballi via Shivamogga",
            "origin": bejai,
            "dest": city_stops["Hubballi"],
            "operator": "Canara Coastal Lines",
            "vehicle": veh_map["KA-19-AB-2040"],
            "dep_time": "20:00",
            "arr_time": "04:30",
            "duration": 510,
            "fare": 680.0
        },
        {
            "code": "KA-08",
            "name": "Mangaluru to Kozhikode via Kannur",
            "origin": bejai,
            "dest": city_stops["Kozhikode"],
            "operator": "Coastal Transit Lines",
            "vehicle": veh_map["KA-19-F-4488"],
            "dep_time": "14:30",
            "arr_time": "20:00",
            "duration": 330,
            "fare": 320.0
        }
    ]

    for r_data in routes_def:
        route = BusRoute.query.filter_by(route_code=r_data["code"]).first()
        if not route:
            route = BusRoute(
                route_code=r_data["code"],
                route_name=r_data["name"],
                operator=r_data["operator"],
                origin_stop_id=r_data["origin"].id,
                destination_stop_id=r_data["dest"].id,
                is_active=True,
                data_source="Intercity Verified Schedule",
                verification_status="VERIFIED"
            )
            db.session.add(route)
            db.session.flush()

            # Route stops
            rs1 = RouteStop(route_id=route.id, stop_id=r_data["origin"].id, stop_sequence=1, departure_offset_minutes=0)
            rs2 = RouteStop(route_id=route.id, stop_id=r_data["dest"].id, stop_sequence=2, arrival_offset_minutes=r_data["duration"])
            db.session.add(rs1)
            db.session.add(rs2)

            # Bus Service
            srv = BusService(
                route_id=route.id,
                service_name=f"{r_data['code']} {route.route_name.split(' to ')[0]} Express",
                departure_time=r_data["dep_time"],
                estimated_duration_minutes=r_data["duration"],
                operating_days="Mon,Tue,Wed,Thu,Fri,Sat,Sun",
                fare=r_data["fare"],
                verification_status="VERIFIED"
            )
            db.session.add(srv)

        # Schedule
        sched = Schedule.query.filter_by(route_id=route.id, departure_stop_id=r_data["origin"].id, destination_stop_id=r_data["dest"].id).first()
        if not sched:
            sched = Schedule(
                vehicle_id=r_data["vehicle"].id,
                route_id=route.id,
                departure_stop_id=r_data["origin"].id,
                destination_stop_id=r_data["dest"].id,
                departure_time=r_data["dep_time"],
                arrival_time=r_data["arr_time"],
                estimated_duration_minutes=r_data["duration"],
                operating_days="Mon,Tue,Wed,Thu,Fri,Sat,Sun",
                fare=r_data["fare"],
                booking_enabled=True,
                verification_status="VERIFIED"
            )
            db.session.add(sched)

    db.session.commit()
    print("Phase 5 Intercity network and luxury fleet seeded successfully!")

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        seed_phase5_intercity_network()
