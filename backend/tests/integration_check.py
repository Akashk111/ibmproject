import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.config import Config

app = create_app()
client = app.test_client()

print("--- Starting Full Integration Check ---")

# 1. Health
res = client.get('/api/health')
assert res.status_code == 200, f"Health check failed: {res.data}"
print("✔ 1. Health check passed:", res.json)

# 2. Stops listing
res = client.get('/api/stops')
assert res.status_code == 200
stops = res.json['stops']
assert len(stops) >= 16
print(f"✔ 2. Bus stops retrieved ({len(stops)} stops in Mangaluru)")

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
print(f"✔ 6. Admin dashboard authenticated successfully: {dash_stats['total_stops']} stops, {dash_stats['total_routes']} routes, {dash_stats['total_services']} departures")

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

print("\n🎉 ALL 7 FULL-STACK INTEGRATION SCENARIOS PASSED WITH 100% SUCCESS!")
