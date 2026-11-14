import pytest
from app import create_app
from app.config import Config
from app.models import db
from app.models.tracking import BusLocation

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

def test_get_tracked_buses(client):
    res = client.get('/api/tracking/buses')
    assert res.status_code == 200
    data = res.json
    assert 'buses' in data
    assert len(data['buses']) >= 4
    first_bus = data['buses'][0]
    assert 'vehicle_id' in first_bus
    assert 'latitude' in first_bus
    assert 'longitude' in first_bus
    assert first_bus['source_type'] in ['DEMO', 'LIVE', 'STALE', 'OFFLINE']

def test_gps_ingestion_unauthorized(client):
    # Without API key or token -> 401
    res = client.post('/api/tracking/location', json={
        'vehicle_id': 'KA-19-F-9999',
        'route_id': 1,
        'latitude': 12.8700,
        'longitude': 74.8500
    })
    assert res.status_code == 401

def test_gps_ingestion_authorized_and_validation(client):
    # Valid device key
    headers = {'X-Device-Key': 'mangaluru-gps-device-secret-key-2025'}

    # 1. Invalid coordinates range
    res = client.post('/api/tracking/location', json={
        'vehicle_id': 'KA-19-F-9999',
        'route_id': 1,
        'latitude': 999.0, # invalid
        'longitude': 74.8500
    }, headers=headers)
    assert res.status_code == 400

    # 2. Valid coordinates update
    res = client.post('/api/tracking/location', json={
        'vehicle_id': 'KA-19-F-9999',
        'vehicle_name': 'Test Live Bus',
        'route_id': 1,
        'latitude': 12.8698,
        'longitude': 74.8431,
        'speed': 32.5,
        'heading': 180.0,
        'source_type': 'LIVE'
    }, headers=headers)
    assert res.status_code == 200
    assert res.json['bus']['source_type'] == 'LIVE'
    assert res.json['bus']['latitude'] == 12.8698

def test_demo_simulation_step(client):
    res = client.post('/api/tracking/simulate-step')
    assert res.status_code == 200
    assert 'updated_buses' in res.json
