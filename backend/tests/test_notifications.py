import json
import uuid
import pytest
from app import create_app
from app.models import db
from app.models.booking import Booking, BookingNotification, Schedule, Passenger
from app.services.notification_service import (
    NotificationService,
    clean_and_validate_phone,
    validate_email,
    format_booking_sms,
    format_booking_email_html
)


@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['NOTIFICATION_TEST_MODE'] = True
    with app.test_client() as client:
        with app.app_context():
            yield client


def test_phone_number_validation():
    """Test valid and invalid mobile number validation"""
    # Valid Indian numbers
    valid_samples = [
        ('9876543210', '+919876543210'),
        ('+91 9876543210', '+919876543210'),
        ('09876543210', '+919876543210'),
        ('+91-8765432109', '+918765432109'),
        ('7654321098', '+917654321098'),
        ('6543210987', '+916543210987')
    ]
    for raw, expected in valid_samples:
        is_valid, normalized, err = clean_and_validate_phone(raw)
        assert is_valid is True, f"Failed for {raw}: {err}"
        assert normalized == expected

    # Invalid numbers
    invalid_samples = ['123', 'abcd', '1234567890', '', None, '0000000000']
    for raw in invalid_samples:
        is_valid, _, err = clean_and_validate_phone(raw)
        assert is_valid is False, f"Should be invalid: {raw}"


def test_email_address_validation():
    """Test valid and invalid email validation"""
    assert validate_email('passenger@gmail.com')[0] is True
    assert validate_email('user.test+bus@mangalore.gov.in')[0] is True
    assert validate_email('commuter@dkboa.org')[0] is True

    # Invalid emails
    assert validate_email('invalid-email')[0] is False
    assert validate_email('@gmail.com')[0] is False
    assert validate_email('commuter@')[0] is False
    assert validate_email('')[0] is False
    assert validate_email(None)[0] is False


def test_exact_sms_message_format(client):
    """Verify exact SMS text matches Requirement 1 template"""
    with client.application.app_context():
        booking = Booking.query.first()
        assert booking is not None

        sms_text = format_booking_sms(booking, passenger_name="Ramesh Rao")

        # Verify exact lines and format
        assert "Thank you for booking with Mangaluru Bus Connect!" in sms_text
        assert "Your bus booking is confirmed." in sms_text
        assert f"Booking ID: {booking.booking_reference}" in sms_text
        assert "Passenger: Ramesh Rao" in sms_text
        assert "From: State Bank" in sms_text
        assert "To: Surathkal" in sms_text
        assert f"Journey Date: {booking.travel_date}" in sms_text
        assert f"Departure: {booking.departure_time}" in sms_text
        assert f"Passengers: {booking.total_passengers}" in sms_text
        assert "Total Fare: ₹" in sms_text
        assert "Have a safe journey!\n- Mangaluru Bus Connect" in sms_text


def test_html_email_template_structure(client):
    """Verify professional HTML email structure matches Requirement 2"""
    with client.application.app_context():
        booking = Booking.query.first()
        html = format_booking_email_html(booking, passenger_name="Ramesh Rao")

        assert "MANGALURU BUS CONNECT" in html
        assert "BOOKING CONFIRMED" in html
        assert booking.booking_reference in html
        assert "Ramesh Rao" in html
        assert "State Bank" in html
        assert "Surathkal" in html
        assert "Have a safe and happy journey!" in html
        assert "Thank you for choosing Mangaluru Bus Connect." in html


def test_payment_failure_guard_prevents_notifications(client):
    """Requirement 5: Never send confirmation notifications for failed or pending bookings"""
    with client.application.app_context():
        # Create unconfirmed / pending booking
        sched = Schedule.query.first()
        b_ref = f"MBC-TEST-UNCONFIRMED-{uuid.uuid4().hex[:6].upper()}"
        unconfirmed = Booking(
            booking_reference=b_ref,
            schedule_id=sched.id,
            travel_date="2026-11-20",
            departure_time="09:00",
            total_passengers=1,
            total_amount=40.0,
            passenger_phone="+919876543210",
            passenger_email="unconfirmed@gmail.com",
            booking_status="PENDING",
            payment_status="PENDING"
        )
        db.session.add(unconfirmed)
        db.session.commit()

        # Attempt sending notifications
        results = NotificationService.send_booking_notifications(unconfirmed)
        assert results['sms']['attempted'] is False
        assert results['email']['attempted'] is False

        # Status should remain PENDING or not sent
        assert unconfirmed.sms_status == "PENDING"
        assert unconfirmed.email_status == "PENDING"

        # Cleanup
        db.session.delete(unconfirmed)
        db.session.commit()


def test_successful_booking_notification_dispatch(client):
    """Test full SMS and Email dispatch in test mode for confirmed booking"""
    with client.application.app_context():
        sched = Schedule.query.first()
        b_ref = f"MBC-TEST-CONFIRMED-{uuid.uuid4().hex[:6].upper()}"
        confirmed_booking = Booking(
            booking_reference=b_ref,
            schedule_id=sched.id,
            travel_date="2026-11-20",
            departure_time="10:00",
            total_passengers=1,
            total_amount=45.0,
            passenger_phone="+919876543210",
            passenger_email="commuter@gmail.com",
            booking_status="CONFIRMED",
            payment_status="SUCCESS"
        )
        db.session.add(confirmed_booking)
        db.session.commit()

        results = NotificationService.send_booking_notifications(confirmed_booking)

        assert results['sms']['success'] is True
        assert results['sms']['status'] == 'TEST_MODE_SENT'
        assert results['email']['success'] is True
        assert results['email']['status'] == 'TEST_MODE_SENT'

        # Check booking record updated
        assert confirmed_booking.sms_status == 'TEST_MODE_SENT'
        assert confirmed_booking.sms_sent_at is not None
        assert confirmed_booking.email_status == 'TEST_MODE_SENT'
        assert confirmed_booking.email_sent_at is not None

        # Check audit notification log records created
        notifs = BookingNotification.query.filter_by(booking_id=confirmed_booking.id).all()
        assert len(notifs) >= 2
        channels = {n.channel for n in notifs}
        assert 'SMS' in channels
        assert 'EMAIL' in channels

        # Cleanup
        db.session.delete(confirmed_booking)
        db.session.commit()


def test_duplicate_notification_prevention_idempotency(client):
    """Requirement 5: Avoid duplicate SMS and emails if user refreshes page"""
    with client.application.app_context():
        # Clean any old test records if present
        Booking.query.filter(Booking.booking_reference.like("MBC-TEST-IDEMPOTENT%")).delete()
        db.session.commit()

        sched = Schedule.query.first()
        b_ref = f"MBC-TEST-IDEMPOTENT-{uuid.uuid4().hex[:6].upper()}"
        booking = Booking(
            booking_reference=b_ref,
            schedule_id=sched.id,
            travel_date="2026-11-20",
            departure_time="11:00",
            total_passengers=1,
            total_amount=50.0,
            passenger_phone="+919876543210",
            passenger_email="idempotent@gmail.com",
            booking_status="CONFIRMED",
            payment_status="SUCCESS"
        )
        db.session.add(booking)
        db.session.commit()

        # Count before first dispatch
        count_before = BookingNotification.query.filter_by(booking_id=booking.id).count()

        # First dispatch
        res1 = NotificationService.send_booking_notifications(booking)
        assert res1['sms']['attempted'] is True
        assert res1['email']['attempted'] is True

        count_after_first = BookingNotification.query.filter_by(booking_id=booking.id).count()
        assert count_after_first == count_before + 2

        # Second dispatch (simulating browser page refresh)
        res2 = NotificationService.send_booking_notifications(booking, force_resend=False)
        assert res2['sms']['attempted'] is False
        assert res2['email']['attempted'] is False
        assert "already sent" in res2['sms']['message']

        # No duplicate audit log rows created
        count_after_second = BookingNotification.query.filter_by(booking_id=booking.id).count()
        assert count_after_second == count_after_first

        # Cleanup
        BookingNotification.query.filter_by(booking_id=booking.id).delete()
        db.session.delete(booking)
        db.session.commit()


def test_notification_retry_endpoint(client):
    """Test POST /api/bookings/<id>/resend-notifications endpoint"""
    with client.application.app_context():
        sched = Schedule.query.first()
        b_ref = f"MBC-TEST-RETRY-{uuid.uuid4().hex[:6].upper()}"
        booking = Booking(
            booking_reference=b_ref,
            schedule_id=sched.id,
            travel_date="2026-11-20",
            departure_time="12:00",
            total_passengers=1,
            total_amount=55.0,
            passenger_phone="+919876543210",
            passenger_email="retry@gmail.com",
            booking_status="CONFIRMED",
            payment_status="SUCCESS",
            sms_status="FAILED",
            sms_error="Network timeout",
            email_status="FAILED",
            email_error="SMTP connection refused"
        )
        db.session.add(booking)
        db.session.commit()

    # Trigger retry via API
    res = client.post(f'/api/bookings/{b_ref}/resend-notifications', json={
        'passenger_phone': '+919988776655',
        'passenger_email': 'updated@gmail.com'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['sms_status'] == 'TEST_MODE_SENT'
    assert data['email_status'] == 'TEST_MODE_SENT'

    # Check database was updated
    with client.application.app_context():
        updated_b = Booking.query.filter_by(booking_reference=b_ref).first()
        assert updated_b.passenger_phone == '+919988776655'
        assert updated_b.passenger_email == 'updated@gmail.com'
        assert updated_b.sms_status == 'TEST_MODE_SENT'
        assert updated_b.email_status == 'TEST_MODE_SENT'

        # Cleanup
        db.session.delete(updated_b)
        db.session.commit()


def test_notification_audit_log_endpoint(client):
    """Test GET /api/bookings/<id>/notifications endpoint"""
    with client.application.app_context():
        booking = Booking.query.first()
        b_ref = booking.booking_reference

    res = client.get(f'/api/bookings/{b_ref}/notifications')
    assert res.status_code == 200
    data = res.get_json()
    assert 'booking_reference' in data
    assert 'sms_status' in data
    assert 'email_status' in data
    assert 'notifications' in data
