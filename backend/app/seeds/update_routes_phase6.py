import sys
from app import create_app
from app.models import db
from app.models.stop import BusStop
from app.models.route import BusRoute, RouteStop, BusService
from app.models.booking import Vehicle, Schedule, Seat

def run_migration():
    app = create_app()
    with app.app_context():
        print("--- Starting Phase 6 Database Upgrade ---")

        # 1. Ensure required stops exist
        stops_to_ensure = [
            {"code": "MULK", "name": "Mulki", "lat": 13.0934, "lng": 74.7925, "desc": "NH-66 Bus Stand, Punaroor & Bappanadu Temple Junction"},
            {"code": "KAUP", "name": "Kaup", "lat": 13.2205, "lng": 74.7470, "desc": "NH-66 Junction, Light House & Beach Road"},
            {"code": "BNTW", "name": "Bantwal", "lat": 12.8940, "lng": 75.0345, "desc": "BC Road Bus Stand, NH-73 Mangaluru-Puttur Junction"},
        ]

        stop_map = {}
        for s_info in stops_to_ensure:
            existing = BusStop.query.filter(BusStop.name.ilike(s_info["name"])).first()
            if not existing:
                new_stop = BusStop(
                    name=s_info["name"],
                    code=s_info["code"],
                    latitude=s_info["lat"],
                    longitude=s_info["lng"],
                    location_description=s_info["desc"],
                    is_active=True
                )
                db.session.add(new_stop)
                db.session.flush()
                print(f"Created stop {new_stop.id}: {new_stop.name}")
                stop_map[s_info["name"]] = new_stop
            else:
                stop_map[s_info["name"]] = existing

        # Cache existing stops
        all_stops = {s.name: s for s in BusStop.query.all()}

        # 2. Helper to configure route stops, services, vehicle, schedule
        def configure_corridor_route(code, name, operator, origin_name, dest_name, stops_list, departure_times, fare, duration, veh_number, veh_type):
            route = BusRoute.query.filter_by(route_code=code).first()
            origin_stop = all_stops.get(origin_name) or BusStop.query.filter(BusStop.name.ilike(f"%{origin_name}%")).first()
            dest_stop = all_stops.get(dest_name) or BusStop.query.filter(BusStop.name.ilike(f"%{dest_name}%")).first()

            if not origin_stop or not dest_stop:
                print(f"ERROR: Cannot find origin {origin_name} or dest {dest_name}")
                return

            if not route:
                route = BusRoute(
                    route_code=code,
                    route_name=name,
                    operator=operator,
                    origin_stop_id=origin_stop.id,
                    destination_stop_id=dest_stop.id,
                    is_active=True,
                    data_source="Intercity Verified Timetable Schedule",
                    verification_status="VERIFIED"
                )
                db.session.add(route)
                db.session.flush()
                print(f"Created route {route.id}: {route.route_code} ({route.route_name})")
            else:
                route.route_name = name
                route.operator = operator
                route.origin_stop_id = origin_stop.id
                route.destination_stop_id = dest_stop.id
                route.is_active = True
                route.verification_status = "VERIFIED"
                db.session.flush()
                print(f"Updating route {route.id}: {route.route_code}")

            # Clean and rebuild route stops
            RouteStop.query.filter_by(route_id=route.id).delete()
            for seq, (st_name, arr_off, dep_off) in enumerate(stops_list, 1):
                st = all_stops.get(st_name) or BusStop.query.filter(BusStop.name.ilike(f"%{st_name}%")).first()
                if st:
                    rs = RouteStop(
                        route_id=route.id,
                        stop_id=st.id,
                        stop_sequence=seq,
                        arrival_offset_minutes=arr_off,
                        departure_offset_minutes=dep_off
                    )
                    db.session.add(rs)
                else:
                    print(f"  Warning: Stop {st_name} not found for route {code}")

            # Rebuild services
            BusService.query.filter_by(route_id=route.id).delete()
            for dep in departure_times:
                srv = BusService(
                    route_id=route.id,
                    service_name=f"{code} Express ({dep})",
                    operating_days="Mon,Tue,Wed,Thu,Fri,Sat,Sun",
                    departure_time=dep,
                    estimated_duration_minutes=duration,
                    fare=fare,
                    verification_status="VERIFIED"
                )
                db.session.add(srv)

            # Ensure vehicle and seats
            veh = Vehicle.query.filter_by(vehicle_number=veh_number).first()
            if not veh:
                veh = Vehicle(
                    vehicle_number=veh_number,
                    vehicle_name=f"{operator} ({code})",
                    route_id=route.id,
                    operator=operator,
                    vehicle_type=veh_type,
                    total_seats=32,
                    tracking_enabled=True,
                    booking_enabled=True,
                    data_source="Verified Coastal Fleet"
                )
                db.session.add(veh)
                db.session.flush()
                # Create 32 seats
                for r in range(1, 9):
                    for c_idx, col in enumerate(['L1', 'L2', 'R1', 'R2']):
                        s_type = 'WINDOW' if col in ['L1', 'R2'] else 'AISLE'
                        seat = Seat(
                            vehicle_id=veh.id,
                            seat_number=f"{r}{chr(65 + c_idx)}",
                            seat_type=s_type,
                            row_number=r,
                            column_position=col,
                            is_active=True
                        )
                        db.session.add(seat)
            else:
                veh.route_id = route.id

            # Ensure schedule
            sched = Schedule.query.filter_by(route_id=route.id).first()
            if not sched:
                sched = Schedule(
                    vehicle_id=veh.id,
                    route_id=route.id,
                    departure_stop_id=origin_stop.id,
                    destination_stop_id=dest_stop.id,
                    departure_time=departure_times[0],
                    arrival_time="10:00",
                    fare=fare,
                    operating_days="Mon,Tue,Wed,Thu,Fri,Sat,Sun",
                    booking_enabled=True,
                    verification_status="VERIFIED"
                )
                db.session.add(sched)
            else:
                sched.vehicle_id = veh.id
                sched.departure_stop_id = origin_stop.id
                sched.destination_stop_id = dest_stop.id
                sched.fare = fare
                sched.booking_enabled = True

        # Refresh all stops dict
        all_stops = {s.name: s for s in BusStop.query.all()}

        # 3. ROUTE DEFINITIONS
        # KA-02: Mangaluru to Udupi & Manipal
        stops_ka02 = [
            ("State Bank", 0, 0),
            ("Lalbagh", 8, 10),
            ("Kottara Chowki", 18, 20),
            ("Surathkal", 32, 35),
            ("Mulki", 48, 50),
            ("Kaup", 65, 67),
            ("Udupi", 80, 83),
            ("Manipal", 92, 92)
        ]
        times_ka02 = ["06:30", "07:15", "08:00", "08:45", "09:30", "10:15", "11:00", "12:15", "13:30", "14:45", "15:45", "16:45", "17:45", "18:45", "19:45", "20:45"]
        configure_corridor_route("KA-02", "Mangaluru to Udupi & Manipal via Surathkal", "DKBOA Mangaluru Express", "State Bank", "Manipal", stops_ka02, times_ka02, 95.0, 92, "KA-19-F-4488", "A/C Coastal Express")

        # KA-02R: Return
        stops_ka02r = [
            ("Manipal", 0, 0),
            ("Udupi", 10, 12),
            ("Kaup", 25, 27),
            ("Mulki", 42, 44),
            ("Surathkal", 58, 60),
            ("Kottara Chowki", 72, 74),
            ("Lalbagh", 82, 84),
            ("State Bank", 92, 92)
        ]
        times_ka02r = ["06:15", "07:00", "07:45", "08:30", "09:15", "10:00", "11:00", "12:15", "13:30", "14:45", "15:45", "16:45", "17:45", "18:45", "19:45", "20:30"]
        configure_corridor_route("KA-02R", "Manipal & Udupi to Mangaluru via Surathkal", "DKBOA Mangaluru Express", "Manipal", "State Bank", stops_ka02r, times_ka02r, 95.0, 92, "KA-19-F-4489", "A/C Coastal Express")

        # KA-04: Mangaluru to Kundapura via Udupi
        stops_ka04 = [
            ("State Bank", 0, 0),
            ("Surathkal", 32, 35),
            ("Mulki", 48, 50),
            ("Kaup", 65, 67),
            ("Udupi", 80, 83),
            ("Kundapura", 125, 125)
        ]
        times_ka04 = ["06:45", "07:30", "08:15", "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"]
        configure_corridor_route("KA-04", "Mangaluru to Kundapura via Udupi", "DKBOA Mangaluru Private Bus", "State Bank", "Kundapura", stops_ka04, times_ka04, 130.0, 125, "KA-19-F-3320", "Express Seater")

        # KA-04R: Return
        stops_ka04r = [
            ("Kundapura", 0, 0),
            ("Udupi", 42, 45),
            ("Kaup", 58, 60),
            ("Mulki", 75, 77),
            ("Surathkal", 90, 93),
            ("State Bank", 125, 125)
        ]
        times_ka04r = ["06:30", "07:15", "08:00", "09:15", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"]
        configure_corridor_route("KA-04R", "Kundapura to Mangaluru via Udupi", "DKBOA Mangaluru Private Bus", "Kundapura", "State Bank", stops_ka04r, times_ka04r, 130.0, 125, "KA-19-F-3321", "Express Seater")

        # KA-06: Mangaluru to Puttur via Pumpwell & BC Road
        stops_ka06 = [
            ("State Bank", 0, 0),
            ("Kankanady", 12, 14),
            ("Pumpwell", 20, 22),
            ("Bantwal", 48, 50),
            ("Puttur", 85, 85)
        ]
        times_ka06 = ["06:45", "07:30", "08:15", "09:00", "10:00", "11:15", "12:30", "13:45", "15:00", "16:15", "17:30", "18:45", "20:00"]
        configure_corridor_route("KA-06", "Mangaluru to Puttur via Pumpwell & BC Road", "DKBOA Mangaluru Private Bus", "State Bank", "Puttur", stops_ka06, times_ka06, 60.0, 85, "KA-19-F-7120", "Express Seater")

        # KA-06R: Return
        stops_ka06r = [
            ("Puttur", 0, 0),
            ("Bantwal", 35, 37),
            ("Pumpwell", 63, 65),
            ("Kankanady", 71, 73),
            ("State Bank", 85, 85)
        ]
        times_ka06r = ["06:30", "07:15", "08:00", "08:45", "09:45", "11:00", "12:15", "13:30", "14:45", "16:00", "17:15", "18:30", "19:45"]
        configure_corridor_route("KA-06R", "Puttur to Mangaluru via BC Road & Pumpwell", "DKBOA Mangaluru Private Bus", "Puttur", "State Bank", stops_ka06r, times_ka06r, 60.0, 85, "KA-19-F-7121", "Express Seater")

        # KA-01: Mangaluru to Bengaluru via Hassan
        stops_ka01 = [
            ("Bejai", 0, 0),
            ("Pumpwell", 15, 20),
            ("Hassan", 240, 255),
            ("Bengaluru", 480, 480)
        ]
        times_ka01 = ["07:30", "09:00", "14:00", "20:30", "21:30", "22:30"]
        configure_corridor_route("KA-01", "Mangaluru to Bengaluru via Hassan", "Canara Coastal Lines", "Bejai", "Bengaluru", stops_ka01, times_ka01, 750.0, 480, "KA-19-AB-2040", "Multi-Axle Sleeper AC")

        # KA-01R: Return
        stops_ka01r = [
            ("Bengaluru", 0, 0),
            ("Hassan", 225, 240),
            ("Pumpwell", 460, 465),
            ("Bejai", 480, 480)
        ]
        times_ka01r = ["07:00", "09:30", "14:30", "20:30", "21:30", "22:30"]
        configure_corridor_route("KA-01R", "Bengaluru to Mangaluru via Hassan", "Canara Coastal Lines", "Bengaluru", "Bejai", stops_ka01r, times_ka01r, 750.0, 480, "KA-19-AB-2041", "Multi-Axle Sleeper AC")

        # KA-05: Mangaluru to Kasaragod via Talapady
        stops_ka05 = [
            ("State Bank", 0, 0),
            ("Kankanady", 12, 14),
            ("Pumpwell", 20, 22),
            ("Thokkottu", 35, 37),
            ("Talapady", 52, 54),
            ("Kasaragod", 85, 85)
        ]
        times_ka05 = ["06:30", "07:30", "08:30", "09:30", "10:45", "12:00", "13:30", "15:00", "16:30", "17:45", "19:00", "20:15"]
        configure_corridor_route("KA-05", "Mangaluru to Kasaragod via Talapady", "DKBOA Mangaluru Private Bus", "State Bank", "Kasaragod", stops_ka05, times_ka05, 65.0, 85, "KA-19-F-5530", "Coastal Express")

        # KA-05R: Return
        stops_ka05r = [
            ("Kasaragod", 0, 0),
            ("Talapady", 30, 32),
            ("Thokkottu", 48, 50),
            ("Pumpwell", 63, 65),
            ("Kankanady", 71, 73),
            ("State Bank", 85, 85)
        ]
        times_ka05r = ["06:15", "07:15", "08:15", "09:15", "10:30", "11:45", "13:15", "14:45", "16:15", "17:30", "18:45", "20:00"]
        configure_corridor_route("KA-05R", "Kasaragod to Mangaluru via Talapady", "DKBOA Mangaluru Private Bus", "Kasaragod", "State Bank", stops_ka05r, times_ka05r, 65.0, 85, "KA-19-F-5531", "Coastal Express")

        db.session.commit()
        print("✅ Phase 6 Database Upgrade committed successfully!")

if __name__ == '__main__':
    run_migration()
