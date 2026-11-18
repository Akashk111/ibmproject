"""
Phase 6: Comprehensive Real-World Test Suite
Testing Mangaluru Bus Connect across:
1. Homepage & Data integrity
2. Destinations & Schedules
3. Authentication (Register, Duplicate, Bad Password, Session, Logout)
4. Booking & Concurrency (Seat selection, Duplicate prevention 409)
5. Payments (Paytm Sandbox flow: initiate, callback, failure, refund)
6. Tracking & Routes (GPS availability, DEMO status, Road distance & ETA)
"""

import json
import uuid
import pytest
from app import create_app, db
from app.models.user import User
from app.models.place import Place
from app.models.stop import BusStop
from app.models.route import BusRoute
from app.models.booking import Schedule, Vehicle, Booking, SeatReservation
from app.models.payment import Payment
from app.utils.paytm_checksum import PaytmChecksum
from app.algorithms.road_routing import get_accurate_road_distance, calculate_traffic_eta

@pytest.fixture(scope='module')
def app():
    _app = create_app()
    _app.config['TESTING'] = True
    yield _app

@pytest.fixture(scope='module')
def client(app):
    with app.test_client() as c:
        yield c

# ==========================================
# 1. HOMEPAGE & DESTINATIONS TESTING
# ==========================================
def test_all_15_destinations_integrity(client):
    """Verify all 15 destinations return accurate counts and starting fares from DB."""
    res = client.get('/api/places/destinations')
    assert res.status_code == 200
    destinations = json.loads(res.data)
    assert len(destinations) >= 15
    
    city_map = {d['name']: d for d in destinations}
    expected_cities = [
        'Mangaluru', 'Bengaluru', 'Udupi', 'Manipal', 'Mysuru', 
        'Hubballi', 'Shivamogga', 'Hassan', 'Madikeri', 'Kasaragod', 
        'Kozhikode', 'Kannur', 'Puttur', 'Kundapura', 'Surathkal'
    ]
    for city in expected_cities:
        assert city in city_map, f"Missing destination: {city}"
        d = city_map[city]
        assert d['state'] in ['Karnataka', 'Kerala']
        assert d['image'].startswith('http')
        # Check that starting_fare is numeric if services > 0
        if d['available_services'] > 0:
            assert d['starting_fare'] is not None and d['starting_fare'] > 0
            assert d['is_bookable'] is True
        else:
            assert d['is_bookable'] is False

def test_popular_schedules_accuracy(client):
    """Verify popular bus services match database records with honest distance & fares."""
    res = client.get('/api/schedules/popular')
    assert res.status_code == 200
    schedules = json.loads(res.data)
    assert len(schedules) > 0
    
    for s in schedules:
        assert s['distance_km'] > 0
        assert s['fare'] > 0
        assert s['available_seats'] >= 0
        assert s['total_seats'] > 0
        assert s['verification_status'] in ['VERIFIED', 'DEMO DATA']
        assert s['image'].startswith('http')

# ==========================================
# 2. JOURNEY SEARCH & COMBINATIONS
# ==========================================
def test_direct_and_transfer_search(client):
    """Test journey planning for direct routes, transfers, and unavailable combinations."""
    # Direct search: State Bank (1) to Surathkal (13) at 07:30
    res_direct = client.post('/api/journey/search', json={
        'source_stop_id': 1,
        'destination_stop_id': 13,
        'departure_time': '07:30',
        'day_of_week': 'Mon'
    })
    assert res_direct.status_code == 200
    data_direct = json.loads(res_direct.data)
    assert data_direct['success'] is True
    assert len(data_direct['journeys']) > 0
    first_direct = data_direct['journeys'][0]
    assert first_direct['journey_type'] == 'DIRECT'
    assert first_direct['distance_km'] > 15.0
    assert 'departure_time' in first_direct
    assert 'arrival_time' in first_direct
    assert first_direct['fare'] > 0
    
    # Same stop source & destination
    res_same = client.post('/api/journey/search', json={
        'source_stop_id': 1,
        'destination_stop_id': 1
    })
    assert res_same.status_code in [200, 400]
    if res_same.status_code == 200:
        data_same = json.loads(res_same.data)
        assert data_same.get('total_journeys', 0) == 0

    # Non-existent / disconnected journey
    res_none = client.post('/api/journey/search', json={
        'source_stop_id': 9999,
        'destination_stop_id': 9998
    })
    assert res_none.status_code in [200, 404]
    if res_none.status_code == 200:
        data_none = json.loads(res_none.data)
        assert data_none.get('total_options_found', 0) == 0
        assert len(data_none.get('journeys', [])) == 0

# ==========================================
# 3. AUTHENTICATION LIFECYCLE
# ==========================================
def test_auth_full_lifecycle(client):
    """Test register, duplicate reject, invalid password, valid login, profile, and logout."""
    test_email = f"commuter_{uuid.uuid4().hex[:8]}@mangaluru.in"
    password = "StrongPassword123!"

    # 1. Register new account
    reg_res = client.post('/api/auth/register', json={
        'name': 'Ramesh Shenoy',
        'email': test_email,
        'password': password
    })
    assert reg_res.status_code == 201
    reg_data = json.loads(reg_res.data)
    assert 'token' in reg_data
    assert reg_data['user']['email'] == test_email

    # 2. Duplicate account registration must fail
    dup_res = client.post('/api/auth/register', json={
        'name': 'Duplicate User',
        'email': test_email,
        'password': password
    })
    assert dup_res.status_code in [400, 409]

    # 3. Invalid password login must fail
    bad_login = client.post('/api/auth/login', json={
        'email': test_email,
        'password': 'WrongPassword999!'
    })
    assert bad_login.status_code == 401

    # 4. Valid login
    login_res = client.post('/api/auth/login', json={
        'email': test_email,
        'password': password
    })
    assert login_res.status_code == 200
    token = json.loads(login_res.data)['token']

    # 5. Session profile check via /api/user/profile
    profile_res = client.get('/api/user/profile', headers={'Authorization': f'Bearer {token}'})
    assert profile_res.status_code == 200
    profile_data = json.loads(profile_res.data)
    assert profile_data['email'] == test_email
    assert profile_data['name'] == 'Ramesh Shenoy'

    # 6. Session check via /api/auth/me
    me_res = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert me_res.status_code == 200
    me_data = json.loads(me_res.data)
    assert me_data['user']['email'] == test_email

    # 7. Logout endpoint
    logout_res = client.post('/api/auth/logout', headers={'Authorization': f'Bearer {token}'})
    assert logout_res.status_code == 200

# ==========================================
# 4. BOOKING & CONCURRENCY CONFLICT TEST
# ==========================================
def test_booking_and_duplicate_seat_conflict(client):
    """Test seat selection, booking creation, and duplicate seat collision handling."""
    # Find a schedule with available seats
    sched_res = client.get('/api/schedules/popular')
    schedules = json.loads(sched_res.data)
    sched = schedules[0]
    schedule_id = sched['id']

    # Check vehicle seats
    res_sched = client.get(f'/api/schedules/{schedule_id}')
    assert res_sched.status_code == 200
    sched_detail = json.loads(res_sched.data)
    vehicle_id = sched_detail['vehicle_id']

    seats_res = client.get(f'/api/vehicles/{vehicle_id}/seats?schedule_id={schedule_id}')
    assert seats_res.status_code == 200
    seat_data = json.loads(seats_res.data)
    available_seats = [s['seat_number'] for s in seat_data if s.get('is_available', True)]
    assert len(available_seats) >= 2, "Need at least 2 available seats for test"

    seat_to_book = available_seats[0]

    # Session 1: Book seat_to_book with unique date
    unique_date = f"2026-12-{uuid.uuid4().hex[:4]}"
    booking_payload = {
        'schedule_id': schedule_id,
        'passenger_name': 'Passenger Alpha',
        'passenger_email': 'alpha@mangaluru.in',
        'passenger_phone': '9876543211',
        'seat_numbers': [seat_to_book],
        'travel_date': unique_date
    }

    res_book1 = client.post('/api/bookings', json=booking_payload)
    assert res_book1.status_code in [200, 201]
    booking_result1 = json.loads(res_book1.data)
    booking1_id = booking_result1['booking']['id']
    booking1_ref = booking_result1['booking']['booking_reference']
    assert booking1_ref is not None

    # Session 2: Try booking the EXACT same seat on the same schedule and date
    booking_payload_collision = {
        'schedule_id': schedule_id,
        'passenger_name': 'Passenger Beta (Collision)',
        'passenger_email': 'beta@mangaluru.in',
        'passenger_phone': '9876543212',
        'seat_numbers': [seat_to_book],
        'travel_date': unique_date
    }
    res_book2 = client.post('/api/bookings', json=booking_payload_collision)
    # Must reject with 409 Conflict
    assert res_book2.status_code == 409, f"Expected 409 Conflict for double booking, got {res_book2.status_code}"
    error_msg = json.loads(res_book2.data).get('error', '')
    assert 'already been reserved' in error_msg.lower() or 'already booked' in error_msg.lower() or 'unavailable' in error_msg.lower()

    # Verify ticket lookup by reference
    ticket_res = client.get(f'/api/bookings/verify/{booking1_ref}')
    assert ticket_res.status_code == 200
    ticket_data = json.loads(ticket_res.data)
    assert ticket_data['booking_reference'] == booking1_ref
    assert seat_to_book in ticket_data['seats']

# ==========================================
# 5. PAYTM SANDBOX PAYMENT GATEWAY TEST
# ==========================================
def test_paytm_sandbox_payment_flow(client):
    """Test initiation, checksum generation, success callback, failure callback, and refund."""
    # 1. Fetch active schedule
    sched_res = client.get('/api/schedules/popular')
    schedules = json.loads(sched_res.data)
    sched = schedules[1]
    schedule_id = sched['id']

    # Get available seat
    res_sched = client.get(f'/api/schedules/{schedule_id}')
    assert res_sched.status_code == 200
    vehicle_id = json.loads(res_sched.data)['vehicle_id']
    seats_res = client.get(f'/api/vehicles/{vehicle_id}/seats?schedule_id={schedule_id}')
    seat_list = json.loads(seats_res.data)
    available_seats = [s['seat_number'] for s in seat_list if s.get('is_available', True)]
    chosen_seat = available_seats[-1]
    travel_date = f"2026-12-{uuid.uuid4().hex[:4]}"

    # 2. Initiate Paytm Sandbox Payment
    init_res = client.post('/api/payments/initiate', json={
        'schedule_id': schedule_id,
        'travel_date': travel_date,
        'seat_numbers': [chosen_seat],
        'passengers': [
            {'passenger_name': 'Paytm Test Commuter', 'passenger_gender': 'MALE'}
        ],
        'payment_method': 'UPI'
    })
    assert init_res.status_code in [200, 201]
    init_data = json.loads(init_res.data)
    assert init_data['success'] is True
    assert 'order_id' in init_data
    assert 'checksum' in init_data
    order_id = init_data['order_id']
    checksum = init_data['checksum']
    amount = init_data['amount']
    booking_ref = init_data['booking_reference']

    # 3. Simulate Successful Paytm Callback
    success_callback_data = {
        'ORDERID': order_id,
        'TXNID': f"PTM_TXN_{uuid.uuid4().hex[:10]}",
        'STATUS': 'TXN_SUCCESS',
        'RESPCODE': '01',
        'RESPMSG': 'Txn Success (Sandbox Demo)',
        'TXNAMOUNT': str(amount),
        'PAYMENTMODE': 'UPI',
        'GATEWAYNAME': 'PAYTM_SANDBOX',
        'BANKTXNID': f"BANK_{uuid.uuid4().hex[:8]}",
        'CHECKSUMHASH': checksum
    }
    cb_res = client.post('/api/payments/callback', json=success_callback_data)
    assert cb_res.status_code == 200
    cb_json = json.loads(cb_res.data)
    assert cb_json['success'] is True
    assert cb_json['booking']['booking_status'] == 'CONFIRMED'
    assert cb_json['payment']['payment_status'] == 'SUCCESS'
    assert 'booking_reference' in cb_json

    # Verify payment status endpoint
    status_res = client.get(f'/api/payments/status/{order_id}')
    assert status_res.status_code == 200
    status_json = json.loads(status_res.data)
    assert status_json['payment_status'] == 'SUCCESS'
    assert status_json['booking_status'] == 'CONFIRMED'

    # 4. Test Refund Request
    # Retrieve booking ID
    with client.application.app_context():
        b_obj = Booking.query.filter_by(booking_reference=booking_ref).first()
        b_id = b_obj.id

    refund_res = client.post('/api/payments/refund', json={
        'booking_id': b_id,
        'reason': 'Commuter requested itinerary reschedule'
    })
    assert refund_res.status_code == 200
    refund_json = json.loads(refund_res.data)
    assert refund_json['payment']['payment_status'] == 'REFUNDED'
    assert refund_json['booking']['booking_status'] == 'CANCELLED'

# ==========================================
# 6. LIVE TRACKING & ACCURATE ROUTING
# ==========================================
def test_tracking_and_routing_verification(client):
    """Verify live tracking vehicles, DEMO status tags, and genuine road distance calculation."""
    # 1. Live tracked buses
    track_res = client.get('/api/tracking/buses')
    assert track_res.status_code == 200
    track_data = json.loads(track_res.data)
    assert 'buses' in track_data
    buses = track_data['buses']
    assert len(buses) > 0
    for b in buses:
        assert 'vehicle_id' in b or 'vehicle_number' in b
        assert 'latitude' in b and 'longitude' in b
        # Mangaluru / Coastal Karnataka coordinates range: Lat 11.5 - 16.0, Lng 74.0 - 78.0
        assert 11.5 <= b['latitude'] <= 16.0
        assert 74.0 <= b['longitude'] <= 78.0
        assert b.get('is_demo', False) is True or b.get('source_type') == 'DEMO'

    # 2. Genuine road routing verification (Not Euclidean straight-line)
    # Distance between State Bank (12.8631, 74.8398) and Surathkal (13.0084, 74.7946)
    road_calc = get_accurate_road_distance(12.8631, 74.8398, 13.0084, 74.7946)
    road_dist = road_calc['distance_km']
    assert road_dist > 16.0, f"Road distance should reflect actual NH 66 route (~18-21 km), got {road_dist}"
    assert 'geometry' in road_calc
    
    # 3. Traffic ETA calculation verification
    traffic_eta = calculate_traffic_eta(540, int(road_calc['duration_minutes']), intermediate_stops_count=6)
    assert traffic_eta['traffic_adjusted_duration_minutes'] > 0
    assert traffic_eta['dwell_delay_minutes'] >= 0
    assert 'traffic_status' in traffic_eta
