import pytest
from app import create_app, db
from app.models.booking import Booking, Schedule, SeatReservation
from app.models.payment import Payment
from app.models.stop import BusStop
from app.models.user import User
from app.utils.auth_helpers import generate_token
import json
import uuid

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    with app.app_context():
        yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_phase4_end_to_end_flow(client, app):
    with app.app_context():
        # 1. Search journey with road distance and traffic ETA
        res = client.post('/api/journey/search',
                          data=json.dumps({
                              'source_stop_id': 1,
                              'destination_stop_id': 13,
                              'departure_time': '08:00',
                              'day_of_week': 'Mon'
                          }),
                          content_type='application/json')
        assert res.status_code == 200
        data = res.get_json()
        assert data['success'] is True
        assert len(data['journeys']) > 0
        j0 = data['journeys'][0]
        assert 'road_distance_km' in j0
        assert j0['road_distance_km'] > 0
        assert 'expected_arrival_time' in j0
        assert 'traffic_delay_minutes' in j0
        assert 'route_geometry' in j0
        assert len(j0['route_geometry']) >= 2

        # 2. Select schedule and initiate payment with temporary hold
        sched = Schedule.query.first()
        assert sched is not None

        rand_date = f"2026-12-{uuid.uuid4().hex[:4]}"
        seats = ["1A", "1B"]

        init_payload = {
            'schedule_id': sched.id,
            'travel_date': rand_date,
            'seat_numbers': seats,
            'passengers': [
                {'passenger_name': 'Ramesh Shenoy', 'passenger_gender': 'MALE', 'seat_number': '1A'},
                {'passenger_name': 'Sita Shenoy', 'passenger_gender': 'FEMALE', 'seat_number': '1B'}
            ],
            'amount': float(sched.fare * 2),
            'payment_method': 'PAYTM_UPI'
        }

        init_res = client.post('/api/payments/initiate',
                               data=json.dumps(init_payload),
                               content_type='application/json')
        assert init_res.status_code in [200, 201]
        init_data = init_res.get_json()
        assert init_data['success'] is True
        assert 'order_id' in init_data
        assert 'checksum' in init_data
        order_id = init_data['order_id']

        # Verify seats are HELD in /api/schedules/:id/seats
        seats_res = client.get(f'/api/schedules/{sched.id}/seats?date={rand_date}')
        assert seats_res.status_code == 200
        seat_list = seats_res.get_json()['seats']
        held_seats = [s['seat_number'] for s in seat_list if s['status'] == 'HELD']
        assert "1A" in held_seats
        assert "1B" in held_seats

        # 3. Simulate Paytm Callback
        callback_payload = {
            'ORDERID': order_id,
            'MID': init_data['mid'],
            'TXNAMOUNT': str(init_data['amount']),
            'STATUS': 'TXN_SUCCESS',
            'RESPCODE': '01',
            'RESPMSG': 'Txn Successful',
            'PAYMENTMODE': 'PAYTM_UPI',
            'CHECKSUMHASH': init_data['checksum'],
            'BANKNAME': 'State Bank of India'
        }

        cb_res = client.post('/api/payments/callback',
                             data=json.dumps(callback_payload),
                             content_type='application/json')
        assert cb_res.status_code == 200
        cb_data = cb_res.get_json()
        assert cb_data['success'] is True
        booking_ref = cb_data['booking_reference']
        assert booking_ref.startswith('MBC-MGL-')

        # 4. Conductor Verification API
        verify_res = client.get(f'/api/bookings/verify/{booking_ref}')
        if verify_res.status_code != 200:
            print("VERIFY ERROR:", verify_res.get_json())
        assert verify_res.status_code == 200
        v_data = verify_res.get_json()
        assert v_data['valid'] is True
        assert v_data['booking_reference'] == booking_ref
        assert len(v_data['passengers']) == 2
        assert v_data['payment']['status'] == 'PAID'

        # 5. Admin Payments and Revenue Dashboard
        admin_user = User.query.filter_by(role='ADMIN').first()
        if not admin_user:
            admin_user = User(name='Admin Officer', email='admin@mbc.gov.in', role='ADMIN')
            admin_user.set_password('Admin@123')
            db.session.add(admin_user)
            db.session.commit()

        admin_token = generate_token(admin_user.id, 'ADMIN')
        headers = {'Authorization': f'Bearer {admin_token}'}

        adm_res = client.get('/api/admin/payments', headers=headers)
        assert adm_res.status_code == 200
        adm_data = adm_res.get_json()
        assert adm_data['success'] is True
        assert adm_data['revenue_summary']['total_revenue'] >= init_data['amount']
        assert adm_data['revenue_summary']['successful_transactions'] >= 1
        assert len(adm_data['payments']) >= 1
