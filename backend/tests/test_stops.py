import pytest
from app import create_app
from app.config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET = "test-secret-key-32-chars-long-minimum!"

@pytest.fixture
def app():
    app = create_app(TestConfig)
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_stops_search_endpoint(client):
    # 1. Typing 'Kan'
    res = client.get('/api/stops/search?q=Kan')
    assert res.status_code == 200
    names = [r['name'] for r in res.json['results']]
    assert any('Kankanady' in name for name in names)

    # 2. Typing 'Ham'
    res = client.get('/api/stops/search?q=Ham')
    assert res.status_code == 200
    names = [r['name'] for r in res.json['results']]
    assert any('Hampankatta' in name for name in names)

    # 3. Typing 'Sta'
    res = client.get('/api/stops/search?q=Sta')
    assert res.status_code == 200
    names = [r['name'] for r in res.json['results']]
    assert any('State Bank' in name for name in names)

    # 4. Searching for Landmark 'Forum'
    res = client.get('/api/stops/search?q=Forum')
    assert res.status_code == 200
    landmarks = [r for r in res.json['results'] if r['type'] == 'LANDMARK']
    assert len(landmarks) > 0
    assert 'Forum Fiza Mall' in landmarks[0]['name']
    assert landmarks[0]['matched_stop_id'] is not None

def test_stops_nearby_endpoint(client):
    # Coordinates of Hampankatta (12.8698, 74.8431)
    res = client.get('/api/stops/nearby?lat=12.8698&lng=74.8431')
    assert res.status_code == 200
    data = res.json
    assert 'nearest_stops' in data
    assert len(data['nearest_stops']) > 0
    closest = data['nearest_stops'][0]
    assert closest['name'] == 'Hampankatta'
    assert closest['distance_km'] < 0.1 # within 100 meters
    assert 'walking_time_label' in closest
