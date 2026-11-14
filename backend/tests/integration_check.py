import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.config import Config

app = create_app()
client = app.test_client()

print("--- Starting Phase 3 Full Integration Check ---")

# 1. Health
res = client.get('/api/health')
assert res.status_code == 200, f"Health check failed: {res.data}"
print("✔ 1. Health check passed:", res.json)

# 2. Stops listing (40+ Mangaluru Stops)
res = client.get('/api/stops')
assert res.status_code == 200
stops = res.json['stops']
assert len(stops) >= 40
print(f"✔ 2. Bus stops retrieved ({len(stops)} stops in Mangaluru transportation database)")

# 3. Direct Journey Search: State Bank -> Kadri
res = client.post('/api/journey/search', json={
    'source_stop_id': 1, # State Bank
    'destination_stop_id': 6, # Kadri
    'departure_time': '08:00',
    'day_of_week': 'Mon'
})
assert res.status_code == 200
data = res.json
assert data['success'] is True
assert len(data['journeys']) > 0
direct_opt = [j for j in data['journeys'] if j['journey_type'] == 'DIRECT']
assert len(direct_opt) > 0
print(f"✔ 3. Direct journey found: {direct_opt[0]['summary']}, departure: {direct_opt[0]['departure_time']}, duration: {direct_opt[0]['total_duration_minutes']}m")

# 4. Transfer Journey Search: Kadri -> Surathkal
kadri_id = next(s['id'] for s in stops if s['name'] == 'Kadri')
surathkal_id = next(s['id'] for s in stops if s['name'] == 'Surathkal')
res = client.post('/api/journey/search', json={
    'source_stop_id': kadri_id,
    'destination_stop_id': surathkal_id,
    'departure_time': '07:30',
    'day_of_week': 'Mon'
})
assert res.status_code == 200
data = res.json
assert data['success'] is True
transfer_opt = [j for j in data['journeys'] if j['transfer_count'] == 1]
assert len(transfer_opt) > 0
print(f"✔ 4. 1-Transfer journey found: {transfer_opt[0]['summary']}, transfer at: {transfer_opt[0]['transfer_stop']['name']}, total duration: {transfer_opt[0]['total_duration_minutes']}m")

# 5. Fallback Stage 4: Pilikula -> Ullal late night
pilikula_id = next(s['id'] for s in stops if s['name'] == 'Pilikula')
ullal_id = next(s['id'] for s in stops if s['name'] == 'Ullal')
res = client.post('/api/journey/search', json={
    'source_stop_id': pilikula_id,
    'destination_stop_id': ullal_id,
    'departure_time': '23:45',
    'day_of_week': 'Mon'
})
assert res.status_code == 200
data = res.json
assert data['success'] is False
assert 'suggestions' in data
assert len(data['suggestions']['nearby_boarding_stops']) > 0
print(f"✔ 5. Fallback suggestion passed: '{data['message']}' with {len(data['suggestions']['nearby_boarding_stops'])} nearby boarding suggestions")

# 6. Admin login & protected dashboard
login_res = client.post('/api/auth/login', json={
    'email': 'admin@mangaluru.gov.in',
    'password': 'admin123'
})
assert login_res.status_code == 200
admin_token = login_res.json['token']
dash_res = client.get('/api/admin/dashboard', headers={'Authorization': f'Bearer {admin_token}'})
assert dash_res.status_code == 200
dash_stats = dash_res.json['stats']
print(f"✔ 6. Admin dashboard authenticated successfully: {dash_stats['total_stops']} stops, {dash_stats['total_routes']} routes, {dash_stats['total_services']} departures, {dash_stats['total_vehicles']} vehicles")

# 7. Commuter login & favorites
user_login = client.post('/api/auth/login', json={
    'email': 'commuter@mangaluru.in',
    'password': 'user123'
})
assert user_login.status_code == 200
user_token = user_login.json['token']

fav_add = client.post('/api/user/favorites', json={
    'source_stop_id': 1,
    'destination_stop_id': 6
}, headers={'Authorization': f'Bearer {user_token}'})
assert fav_add.status_code in [200, 201]

fav_list = client.get('/api/user/favorites', headers={'Authorization': f'Bearer {user_token}'})
assert fav_list.status_code == 200
assert len(fav_list.json['favorites']) >= 1
print(f"✔ 7. Commuter favorites flow passed ({len(fav_list.json['favorites'])} saved favorites)")

# 8. Automatic Place & Stop Search (/api/stops/search?q=Kan)
search_res = client.get('/api/stops/search?q=Kan')
assert search_res.status_code == 200
names = [r['name'] for r in search_res.json['results']]
assert any('Kankanady' in n for n in names)
print(f"✔ 8. Place autocomplete search passed: typing 'Kan' returned {len(names)} verified matches ({', '.join(names[:3])})")

# 9. Geolocation Nearby Stops (/api/stops/nearby)
nearby_res = client.get('/api/stops/nearby?lat=12.8698&lng=74.8431&limit=3')
assert nearby_res.status_code == 200
assert len(nearby_res.json['nearest_stops']) == 3
closest = nearby_res.json['nearest_stops'][0]
print(f"✔ 9. Geolocation nearest stop calculation passed: nearest to [12.8698, 74.8431] is {closest['name']} ({closest['formatted_distance']}, {closest['walking_time_label']})")

# 10. Live Tracking & Simulation (/api/tracking/buses)
buses_res = client.get('/api/tracking/buses')
assert buses_res.status_code == 200
assert len(buses_res.json['buses']) >= 4
sim_res = client.post('/api/tracking/simulate-step')
assert sim_res.status_code == 200
print(f"✔ 10. Tracking telematics & demo simulation passed: {len(buses_res.json['buses'])} buses active on fleet")

# 11. Curated Places & Landmarks (/api/places)
places_res = client.get('/api/places')
assert places_res.status_code == 200
places_list = places_res.json
assert len(places_list) >= 10
print(f"✔ 11. Curated Mangaluru landmarks retrieved ({len(places_list)} destinations, e.g. {places_list[0]['name']})")

# 12. Visual 32-Seat Layout & Schedules (/api/schedules)
sched_res = client.get('/api/schedules')
assert sched_res.status_code == 200
schedules_list = sched_res.json
assert len(schedules_list) >= 5
first_sched_id = schedules_list[0]['id']

seats_res = client.get(f'/api/schedules/{first_sched_id}/seats')
assert seats_res.status_code == 200
seats_data = seats_res.json
assert seats_data['total_seats'] == 32
assert len(seats_data['seats']) == 32
print(f"✔ 12. 32-Seat bus layout verified for schedule {first_sched_id} ({seats_data['available_seats']} available, {seats_data['occupied_seats']} occupied)")

# 13. Concurrency / Double-Booking Prevention (/api/bookings)
test_date = "2026-11-20"
book1 = client.post('/api/bookings', json={
    'schedule_id': first_sched_id,
    'travel_date': test_date,
    'seat_numbers': ['3A', '3B'],
    'passengers': [
        {'passenger_name': 'Commuter A', 'passenger_gender': 'MALE'},
        {'passenger_name': 'Commuter B', 'passenger_gender': 'FEMALE'}
    ]
})
assert book1.status_code == 201
b_ref = book1.json['booking']['booking_reference']
assert b_ref.startswith('MBC-MGL-')

# Try booking seat 3A again on same schedule & date -> Must return 409
book2_conflict = client.post('/api/bookings', json={
    'schedule_id': first_sched_id,
    'travel_date': test_date,
    'seat_numbers': ['3A', '4A'],
    'passengers': [
        {'passenger_name': 'Commuter C', 'passenger_gender': 'MALE'},
        {'passenger_name': 'Commuter D', 'passenger_gender': 'MALE'}
    ]
})
assert book2_conflict.status_code == 409
assert 'already been reserved' in book2_conflict.json['error']
print(f"✔ 13. Seat reservation & double-booking prevention passed: {b_ref} confirmed, conflicting attempt rejected with 409")

# 14. Admin CSV Export (/api/admin/export/stops)
csv_res = client.get('/api/admin/export/stops', headers={'Authorization': f'Bearer {admin_token}'})
assert csv_res.status_code == 200
assert 'text/csv' in csv_res.headers.get('Content-Type', '')
assert b'name,code,latitude,longitude' in csv_res.data
print(f"✔ 14. Admin CSV export passed: exported bus stops dataset ({len(csv_res.data.splitlines())} lines)")

print("\n🎉 ALL 14 FULL-STACK PHASE 3 INTEGRATION SCENARIOS PASSED WITH 100% SUCCESS!")
