import os
import pytest
from app import create_app
from app.config import Config
from app.models import db
from app.models.stop import BusStop
from app.models.route import BusRoute
from app.algorithms.journey_planner import JourneyPlanner, parse_time_to_minutes, format_minutes_to_time

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET = "test-secret-key"

@pytest.fixture
def app():
    app = create_app(TestConfig)
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_time_conversions():
    assert parse_time_to_minutes("00:00") == 0
    assert parse_time_to_minutes("08:30") == 510
    assert parse_time_to_minutes("14:15") == 855
    assert format_minutes_to_time(510) == "08:30 AM"
    assert format_minutes_to_time(855) == "02:15 PM"

def test_health_endpoint(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'

def test_stops_listing(client):
    response = client.get('/api/stops')
    assert response.status_code == 200
    data = response.json
    assert 'stops' in data
    assert len(data['stops']) > 0
    stop_names = [s['name'] for s in data['stops']]
    assert 'State Bank' in stop_names
    assert 'Hampankatta' in stop_names
    assert 'Kadri' in stop_names

def test_direct_journey(app):
    with app.app_context():
        state_bank = BusStop.query.filter_by(name="State Bank").first()
        kadri = BusStop.query.filter_by(name="Kadri").first()
        assert state_bank is not None
        assert kadri is not None

        planner = JourneyPlanner()
        # Search at 08:00 AM on Monday
        res = planner.plan_journey(state_bank.id, kadri.id, departure_time_str="08:00", day_of_week="Mon")
        assert res['success'] is True
        assert len(res['journeys']) > 0

        first_journey = res['journeys'][0]
        assert first_journey['journey_type'] == 'DIRECT'
        assert first_journey['transfer_count'] == 0
        assert first_journey['segments'][0]['route_code'] in ['15', '19']

def test_transfer_journey(app):
    with app.app_context():
        # From Kadri to Surathkal: Kadri only has route 15/15R (to State Bank) and route 19
        # Route 1A goes State Bank -> Lalbagh -> Surathkal.
        # So a passenger from Kadri to Surathkal can transfer at Lalbagh or Hampankatta!
        kadri = BusStop.query.filter_by(name="Kadri").first()
        surathkal = BusStop.query.filter_by(name="Surathkal").first()
        assert kadri is not None
        assert surathkal is not None

        planner = JourneyPlanner()
        res = planner.plan_journey(kadri.id, surathkal.id, departure_time_str="07:15", day_of_week="Mon")
        assert res['success'] is True
        assert len(res['journeys']) > 0

        # Must have transfer journeys
        transfer_options = [j for j in res['journeys'] if j['transfer_count'] == 1]
        assert len(transfer_options) > 0
        assert len(transfer_options[0]['segments']) == 2
        assert transfer_options[0]['transfer_stop'] is not None

def test_same_source_and_destination(app):
    with app.app_context():
        state_bank = BusStop.query.filter_by(name="State Bank").first()
        planner = JourneyPlanner()
        res = planner.plan_journey(state_bank.id, state_bank.id, departure_time_str="09:00", day_of_week="Mon")
        assert res['success'] is False
        assert "cannot be the same" in res['message']

def test_no_journey_fallback(app):
    with app.app_context():
        # Search at 23:55 when no services operate
        surathkal = BusStop.query.filter_by(name="Surathkal").first()
        ullal = BusStop.query.filter_by(name="Ullal").first()
        planner = JourneyPlanner()
        res = planner.plan_journey(surathkal.id, ullal.id, departure_time_str="23:55", day_of_week="Mon")
        assert res['success'] is False
        assert 'suggestions' in res
        assert 'nearby_boarding_stops' in res['suggestions']

def test_auth_and_favorites(client):
    # Register user
    reg_res = client.post('/api/auth/register', json={
        'name': 'Test Commuter',
        'email': 'commuter_test@mangaluru.in',
        'password': 'password123'
    })
    assert reg_res.status_code == 201
    token = reg_res.json['token']

    # Login
    login_res = client.post('/api/auth/login', json={
        'email': 'commuter_test@mangaluru.in',
        'password': 'password123'
    })
    assert login_res.status_code == 200

    # Add favorite
    fav_res = client.post('/api/user/favorites', json={
        'source_stop_id': 1,
        'destination_stop_id': 2
    }, headers={'Authorization': f'Bearer {token}'})
    assert fav_res.status_code in [200, 201]

    # Get favorites
    get_fav = client.get('/api/user/favorites', headers={'Authorization': f'Bearer {token}'})
    assert get_fav.status_code == 200
    assert len(get_fav.json['favorites']) >= 1
