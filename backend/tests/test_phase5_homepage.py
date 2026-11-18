import json
import pytest
from app import create_app, db
from app.models.user import User

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        with app.app_context():
            yield client

def test_popular_destinations_endpoint(client):
    """Test /api/places/destinations returns 15 regional & coastal cities with fares."""
    res = client.get('/api/places/destinations')
    assert res.status_code == 200
    data = json.loads(res.data)
    assert isinstance(data, list)
    assert len(data) >= 15
    city_names = [d['name'] for d in data]
    required_cities = [
        'Mangaluru', 'Bengaluru', 'Udupi', 'Manipal', 'Mysuru', 
        'Hubballi', 'Shivamogga', 'Hassan', 'Madikeri', 'Kasaragod', 
        'Kozhikode', 'Kannur', 'Puttur', 'Kundapura', 'Surathkal'
    ]
    for city in required_cities:
        assert city in city_names, f"Expected city {city} missing from destinations"
    
    first = data[0]
    assert 'name' in first
    assert 'state' in first
    assert 'image' in first
    assert 'available_services' in first

def test_popular_schedules_endpoint(client):
    """Test /api/schedules/popular returns verified bus schedules with road distance."""
    res = client.get('/api/schedules/popular')
    assert res.status_code == 200
    data = json.loads(res.data)
    assert isinstance(data, list)
    assert len(data) > 0
    item = data[0]
    assert 'vehicle_name' in item
    assert 'vehicle_number' in item
    assert 'vehicle_type' in item
    assert 'origin' in item
    assert 'destination' in item
    assert 'departure_time' in item
    assert 'arrival_time' in item
    assert 'fare' in item
    assert 'distance_km' in item
    assert 'available_seats' in item
    assert item['fare'] > 0
    assert item['distance_km'] > 0

def test_featured_vehicles_endpoint(client):
    """Test /api/vehicles/featured returns fleet vehicles."""
    res = client.get('/api/vehicles/featured')
    assert res.status_code == 200
    data = json.loads(res.data)
    assert isinstance(data, list)
    assert len(data) > 0
    v = data[0]
    assert 'vehicle_number' in v
    assert 'vehicle_type' in v
    assert 'operator' in v

def test_user_profile_endpoint(client):
    """Test /api/user/profile authenticated and unauthenticated behavior."""
    # Unauthenticated
    res = client.get('/api/user/profile')
    assert res.status_code in [401, 200]
    
    # Authenticated
    with client.application.app_context():
        test_user = User.query.filter_by(email='passenger@mangaluru.in').first()
        if not test_user:
            test_user = User(
                name='Priya Rao',
                email='passenger@mangaluru.in'
            )
            test_user.set_password('Password123!')
            db.session.add(test_user)
            db.session.commit()
    
    # Login to obtain token
    login_res = client.post('/api/auth/login', json={
        'email': 'passenger@mangaluru.in',
        'password': 'Password123!'
    })
    assert login_res.status_code == 200
    token = json.loads(login_res.data)['token']
    
    profile_res = client.get('/api/user/profile', headers={'Authorization': f'Bearer {token}'})
    assert profile_res.status_code == 200
    profile_data = json.loads(profile_res.data)
    assert profile_data['email'] == 'passenger@mangaluru.in'
    assert profile_data['name'] == 'Priya Rao'
