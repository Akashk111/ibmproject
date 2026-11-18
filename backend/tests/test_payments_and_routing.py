import pytest
from app import create_app
from app.models import db
from app.models.booking import Booking, Schedule, Seat, BookingSeat, SeatReservation
from app.models.payment import Payment
from app.models.stop import BusStop
from app.algorithms.road_routing import get_accurate_road_distance, calculate_traffic_eta
from app.utils.paytm_checksum import PaytmChecksum

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_accurate_road_distance():
    # State Bank to Surathkal (approx 17-21 km road distance)
    sb_lat, sb_lon = 12.8617, 74.8378
    srtk_lat, srtk_lon = 13.0113, 74.7937
    road_data = get_accurate_road_distance(sb_lat, sb_lon, srtk_lat, srtk_lon)
    
    assert road_data['distance_km'] > 15.0
    assert road_data['duration_minutes'] > 20
    assert len(road_data['geometry']) >= 2
    # Verify distance is greater than euclidean straight-line
    from app.algorithms.road_routing import haversine_km
    straight_line = haversine_km(sb_lat, sb_lon, srtk_lat, srtk_lon)
    assert road_data['distance_km'] >= straight_line

def test_traffic_eta_calculation():
    # Off-peak test (14:00 = 840 mins)
    off_peak = calculate_traffic_eta(840, 30, intermediate_stops_count=4)
    assert off_peak['traffic_delay_minutes'] == 0
    assert off_peak['traffic_status'] == 'NORMAL_FLOW'

    # Morning peak test (09:00 = 540 mins)
    peak = calculate_traffic_eta(540, 30, intermediate_stops_count=4)
    assert peak['traffic_delay_minutes'] > 0
    assert peak['traffic_status'] == 'MORNING_PEAK_CONGESTION'
    assert peak['traffic_adjusted_duration_minutes'] > peak['scheduled_duration_minutes']

def test_paytm_checksum_generation_and_verification():
    merchant_key = "TEST_MERCHANT_KEY_2026"
    params = {
        "MID": "MGL_BUS_TEST_MID",
        "ORDER_ID": "ORDER_MBC_TEST001",
        "TXN_AMOUNT": "70.00",
        "CURRENCY": "INR"
    }
    checksum = PaytmChecksum.generate_signature(params, merchant_key)
    assert checksum is not None
    assert len(checksum) > 20

    # Verification with correct key
    assert PaytmChecksum.verify_signature(params, merchant_key, checksum) is True

    # Verification with tampered parameter
    tampered_params = params.copy()
    tampered_params["TXN_AMOUNT"] = "1.00"
    assert PaytmChecksum.verify_signature(tampered_params, merchant_key, checksum) is False

def test_payment_initiation_and_seat_hold(client):
    import uuid
    sched_resp = client.get('/api/schedules')
    assert sched_resp.status_code == 200
    schedule_id = sched_resp.get_json()[0]['id']
    travel_date = f"2026-12-{uuid.uuid4().hex[:4]}"

    init_payload = {
        "schedule_id": schedule_id,
        "travel_date": travel_date,
        "seat_numbers": ["6A", "6B"],
        "passengers": [
            {"passenger_name": "Deepak Shenoy", "passenger_gender": "MALE"},
            {"passenger_name": "Pooja Shenoy", "passenger_gender": "FEMALE"}
        ],
        "payment_method": "UPI"
    }

    resp = client.post('/api/payments/initiate', json=init_payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert 'order_id' in data
    assert 'checksum' in data
    assert 'txn_token' in data
    assert data['booking_reference'].startswith('MBC-MGL-')
    assert data['amount'] > 0

    order_id = data['order_id']
    booking_ref = data['booking_reference']

    # Test Seat Concurrency: another commuter trying to hold seat 6A on same date
    conflict_payload = {
        "schedule_id": schedule_id,
        "travel_date": travel_date,
        "seat_numbers": ["6A", "7C"],
        "passengers": [{"passenger_name": "Other User"}],
        "payment_method": "UPI"
    }
    conflict_resp = client.post('/api/payments/initiate', json=conflict_payload)
    assert conflict_resp.status_code == 409
    assert 'temporarily locked' in conflict_resp.get_json()['error']

    # Step 3: Complete payment callback with valid checksum
    from app.routes.payments import get_paytm_config
    cfg = get_paytm_config()
    callback_params = {
        "ORDERID": order_id,
        "TXNID": "PTM_TXN_99887766",
        "STATUS": "TXN_SUCCESS",
        "RESPCODE": "01",
        "RESPMSG": "Transaction Successful",
        "TXNAMOUNT": f"{data['amount']:.2f}"
    }
    cb_checksum = PaytmChecksum.generate_signature(callback_params, cfg['merchant_key'])
    callback_params["CHECKSUMHASH"] = cb_checksum

    cb_resp = client.post('/api/payments/callback', json=callback_params)
    assert cb_resp.status_code == 200
    cb_data = cb_resp.get_json()
    assert cb_data['booking']['booking_status'] == 'CONFIRMED'
    assert cb_data['payment']['payment_status'] == 'SUCCESS'
    assert cb_data['booking']['qr_verification_code'] is not None

    # Step 4: Verify ticket via public QR code endpoint
    verify_resp = client.get(f'/api/bookings/verify/{booking_ref}')
    assert verify_resp.status_code == 200
    v_data = verify_resp.get_json()
    assert v_data['is_valid'] is True
    assert v_data['booking_reference'] == booking_ref
    assert '6A' in v_data['seats']

    # Step 5: Test idempotency protection on duplicate callback
    dup_resp = client.post('/api/payments/callback', json=callback_params)
    assert dup_resp.status_code == 200
    assert 'already processed' in dup_resp.get_json()['message']

    # Step 6: Test Refund
    refund_payload = {
        "booking_id": cb_data['booking']['id'],
        "reason": "Commuter requested cancellation"
    }
    ref_resp = client.post('/api/payments/refund', json=refund_payload)
    assert ref_resp.status_code == 200
    assert ref_resp.get_json()['payment']['payment_status'] == 'REFUNDED'
