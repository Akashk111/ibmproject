import pytest
from app import create_app
from app.models import db
from app.models.booking import Booking, Schedule, Seat, BookingSeat
from app.models.place import Place
from app.models.stop import BusStop

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'

def test_places_and_stops_search(client):
    response = client.get('/api/places/search?q=Kan')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) > 0
    # Should include Kankanady
    names = [item['name'] for item in data]
    assert any('Kankanady' in name for name in names)

def test_curated_places_list(client):
    response = client.get('/api/places')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) >= 10
    # Verify landmark fields
    first = data[0]
    assert 'name' in first
    assert 'category' in first
    assert 'latitude' in first
    assert 'longitude' in first

def test_schedules_search_and_seats(client):
    response = client.get('/api/schedules')
    assert response.status_code == 200
    schedules = response.get_json()
    assert len(schedules) > 0

    first_sched_id = schedules[0]['id']
    # Check 32-seat layout
    seat_resp = client.get(f'/api/schedules/{first_sched_id}/seats')
    assert seat_resp.status_code == 200
    seat_data = seat_resp.get_json()
    assert seat_data['total_seats'] == 32
    assert len(seat_data['seats']) == 32
    # Verify seat status contains AVAILABLE or OCCUPIED
    assert any(s['status'] in ['AVAILABLE', 'OCCUPIED'] for s in seat_data['seats'])

def test_booking_creation_and_double_booking_conflict(client):
    # Find an active schedule
    sched_resp = client.get('/api/schedules')
    schedule = sched_resp.get_json()[0]
    sched_id = schedule['id']
    travel_date = "2026-12-25"

    # Step 1: Book seat 4A and 4B
    payload = {
        "schedule_id": sched_id,
        "travel_date": travel_date,
        "seat_numbers": ["4A", "4B"],
        "passengers": [
            {"passenger_name": "Arun Kumar", "passenger_gender": "MALE"},
            {"passenger_name": "Divya Kumar", "passenger_gender": "FEMALE"}
        ]
    }
    book_resp = client.post('/api/bookings', json=payload)
    assert book_resp.status_code == 201
    booking_data = book_resp.get_json()
    assert 'booking' in booking_data
    ref = booking_data['booking']['booking_reference']
    assert ref.startswith('MBC-MGL-')
    assert len(booking_data['booking']['seats']) == 2

    # Step 2: Try to book seat 4A again on same date (Conflict check)
    conflict_payload = {
        "schedule_id": sched_id,
        "travel_date": travel_date,
        "seat_numbers": ["4A", "5C"],
        "passengers": [
            {"passenger_name": "Other Commuter", "passenger_gender": "MALE"},
            {"passenger_name": "Other Friend", "passenger_gender": "MALE"}
        ]
    }
    conflict_resp = client.post('/api/bookings', json=conflict_payload)
    assert conflict_resp.status_code == 409
    err_json = conflict_resp.get_json()
    assert "already been reserved" in err_json['error']

    # Step 3: Verify booking retrieval by reference
    get_resp = client.get(f'/api/bookings/{ref}')
    assert get_resp.status_code == 200
    assert get_resp.get_json()['booking_reference'] == ref

    # Step 4: Cancel booking and verify release
    cancel_resp = client.post(f'/api/bookings/{booking_data["booking"]["id"]}/cancel')
    assert cancel_resp.status_code == 200
    assert cancel_resp.get_json()['booking']['booking_status'] == 'CANCELLED'
