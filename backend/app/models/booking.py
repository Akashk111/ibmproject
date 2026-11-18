from datetime import datetime, timedelta
import uuid
import hashlib
from app.models import db

class Vehicle(db.Model):
    __tablename__ = 'vehicles'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    vehicle_name = db.Column(db.String(100), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('bus_routes.id'), nullable=True)
    operator = db.Column(db.String(100), default='DKBOA Mangaluru')
    vehicle_type = db.Column(db.String(50), default='Standard City Express')  # 'A/C Coastal Express', 'City Bus', etc.
    total_seats = db.Column(db.Integer, default=32)
    tracking_enabled = db.Column(db.Boolean, default=True)
    booking_enabled = db.Column(db.Boolean, default=True)
    data_source = db.Column(db.String(100), default='Mangaluru Transit Authority Demo')

    route = db.relationship('BusRoute', backref='fleet_vehicles')
    seats = db.relationship('Seat', backref='vehicle', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_number': self.vehicle_number,
            'vehicle_name': self.vehicle_name,
            'route_id': self.route_id,
            'route_code': self.route.route_code if self.route else None,
            'route_name': self.route.route_name if self.route else None,
            'operator': self.operator,
            'vehicle_type': self.vehicle_type,
            'total_seats': self.total_seats,
            'tracking_enabled': self.tracking_enabled,
            'booking_enabled': self.booking_enabled,
            'data_source': self.data_source
        }


class Seat(db.Model):
    __tablename__ = 'seats'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    seat_number = db.Column(db.String(10), nullable=False)  # e.g., '1A', '1B', '2A', '2B'
    seat_type = db.Column(db.String(20), default='WINDOW')   # 'WINDOW', 'AISLE'
    row_number = db.Column(db.Integer, default=1)
    column_position = db.Column(db.String(5), default='L1')  # 'L1', 'L2', 'R1', 'R2'
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'seat_number': self.seat_number,
            'seat_type': self.seat_type,
            'row_number': self.row_number,
            'column_position': self.column_position,
            'is_active': self.is_active
        }


class Schedule(db.Model):
    __tablename__ = 'schedules'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('bus_routes.id'), nullable=False)
    departure_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=False)
    destination_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=False)
    departure_time = db.Column(db.String(10), nullable=False)  # "08:30"
    arrival_time = db.Column(db.String(10), nullable=False)    # "09:45"
    estimated_duration_minutes = db.Column(db.Integer, default=45)
    operating_days = db.Column(db.String(100), default='Mon,Tue,Wed,Thu,Fri,Sat,Sun')
    fare = db.Column(db.Float, default=40.0)
    booking_enabled = db.Column(db.Boolean, default=True)
    verification_status = db.Column(db.String(50), default='DEMO DATA')  # 'DEMO DATA' or 'VERIFIED'

    vehicle = db.relationship('Vehicle', backref='schedules')
    route = db.relationship('BusRoute', backref='schedules')
    departure_stop = db.relationship('BusStop', foreign_keys=[departure_stop_id])
    destination_stop = db.relationship('BusStop', foreign_keys=[destination_stop_id])

    bookings = db.relationship('Booking', backref='schedule', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'vehicle_number': self.vehicle.vehicle_number if self.vehicle else None,
            'vehicle_name': self.vehicle.vehicle_name if self.vehicle else None,
            'vehicle_type': self.vehicle.vehicle_type if self.vehicle else 'Standard',
            'route_id': self.route_id,
            'route_code': self.route.route_code if self.route else None,
            'route_name': self.route.route_name if self.route else None,
            'operator': self.vehicle.operator if self.vehicle else 'DKBOA Mangaluru',
            'departure_stop_id': self.departure_stop_id,
            'departure_stop_name': self.departure_stop.name if self.departure_stop else None,
            'destination_stop_id': self.destination_stop_id,
            'destination_stop_name': self.destination_stop.name if self.destination_stop else None,
            'departure_time': self.departure_time,
            'arrival_time': self.arrival_time,
            'estimated_duration_minutes': self.estimated_duration_minutes,
            'operating_days': self.operating_days,
            'fare': self.fare,
            'booking_enabled': self.booking_enabled,
            'verification_status': self.verification_status
        }


class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    booking_reference = db.Column(db.String(40), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedules.id'), nullable=False)
    travel_date = db.Column(db.String(20), nullable=False)  # "YYYY-MM-DD"
    departure_time = db.Column(db.String(10), nullable=False)
    expected_arrival_time = db.Column(db.String(10), nullable=True)
    distance_km = db.Column(db.Float, default=0.0)
    total_passengers = db.Column(db.Integer, default=1)
    total_amount = db.Column(db.Float, default=0.0)
    passenger_phone = db.Column(db.String(30), nullable=True)
    passenger_email = db.Column(db.String(120), nullable=True)
    sms_status = db.Column(db.String(30), default='PENDING')  # 'PENDING', 'SENT', 'TEST_MODE_SENT', 'FAILED', 'NOT_PROVIDED'
    sms_sent_at = db.Column(db.DateTime, nullable=True)
    sms_error = db.Column(db.String(255), nullable=True)
    email_status = db.Column(db.String(30), default='PENDING')  # 'PENDING', 'SENT', 'TEST_MODE_SENT', 'FAILED', 'NOT_PROVIDED'
    email_sent_at = db.Column(db.DateTime, nullable=True)
    email_error = db.Column(db.String(255), nullable=True)
    booking_status = db.Column(db.String(30), default='CONFIRMED')  # 'CONFIRMED', 'CANCELLED', 'PENDING'
    payment_status = db.Column(db.String(30), default='PENDING')  # 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
    qr_verification_code = db.Column(db.String(120), unique=True, nullable=True, index=True)
    booking_source = db.Column(db.String(30), default='DEMO BOOKING') # 'DEMO BOOKING', 'REAL BOOKING'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='bookings')
    seats = db.relationship('BookingSeat', backref='booking', cascade='all, delete-orphan')
    passengers = db.relationship('Passenger', backref='booking', cascade='all, delete-orphan')

    @staticmethod
    def generate_reference():
        random_suffix = uuid.uuid4().hex[:6].upper()
        return f"MBC-MGL-{random_suffix}"

    @staticmethod
    def generate_qr_code(reference, travel_date):
        salt = uuid.uuid4().hex[:8]
        raw = f"{reference}:{travel_date}:{salt}"
        token = hashlib.sha256(raw.encode()).hexdigest()[:16].upper()
        return f"MBC-PASS:{reference}:{travel_date}:{token}"

    def to_dict(self):
        return {
            'id': self.id,
            'booking_reference': self.booking_reference,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Guest Commuter',
            'user_email': self.user.email if self.user else None,
            'schedule_id': self.schedule_id,
            'route_code': self.schedule.route.route_code if self.schedule and self.schedule.route else None,
            'route_name': self.schedule.route.route_name if self.schedule and self.schedule.route else None,
            'vehicle_number': self.schedule.vehicle.vehicle_number if self.schedule and self.schedule.vehicle else None,
            'vehicle_name': self.schedule.vehicle.vehicle_name if self.schedule and self.schedule.vehicle else None,
            'operator': self.schedule.vehicle.operator if self.schedule and self.schedule.vehicle else 'DKBOA Mangaluru',
            'departure_stop_name': self.schedule.departure_stop.name if self.schedule and self.schedule.departure_stop else None,
            'destination_stop_name': self.schedule.destination_stop.name if self.schedule and self.schedule.destination_stop else None,
            'travel_date': self.travel_date,
            'departure_time': self.departure_time,
            'expected_arrival_time': self.expected_arrival_time or (self.schedule.arrival_time if self.schedule else None),
            'distance_km': round(self.distance_km, 1) if self.distance_km else 18.5,
            'total_passengers': self.total_passengers,
            'total_amount': self.total_amount,
            'passenger_phone': self.passenger_phone,
            'passenger_email': self.passenger_email,
            'sms_status': self.sms_status or 'PENDING',
            'sms_sent_at': self.sms_sent_at.isoformat() if self.sms_sent_at else None,
            'sms_error': self.sms_error,
            'email_status': self.email_status or 'PENDING',
            'email_sent_at': self.email_sent_at.isoformat() if self.email_sent_at else None,
            'email_error': self.email_error,
            'booking_status': self.booking_status,
            'payment_status': self.payment_status,
            'qr_verification_code': self.qr_verification_code,
            'booking_source': self.booking_source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'seats': [bs.seat_number for bs in self.seats],
            'passengers': [p.to_dict() for p in self.passengers]
        }


class SeatReservation(db.Model):
    """
    Temporary seat reservation / hold to prevent concurrency double-booking during checkout.
    Expires automatically after hold duration (e.g. 10 minutes) if payment is not completed.
    """
    __tablename__ = 'seat_reservations'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True, index=True)
    seat_id = db.Column(db.Integer, db.ForeignKey('seats.id'), nullable=False)
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedules.id'), nullable=False, index=True)
    travel_date = db.Column(db.String(20), nullable=False, index=True)  # "YYYY-MM-DD"
    seat_number = db.Column(db.String(10), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    status = db.Column(db.String(20), default='HELD', index=True)  # 'HELD', 'CONFIRMED', 'RELEASED', 'EXPIRED'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    seat = db.relationship('Seat')
    booking = db.relationship('Booking')

    @property
    def is_expired(self):
        return datetime.utcnow() > self.expires_at

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'seat_id': self.seat_id,
            'schedule_id': self.schedule_id,
            'travel_date': self.travel_date,
            'seat_number': self.seat_number,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'status': self.status,
            'is_expired': self.is_expired
        }


class BookingSeat(db.Model):
    __tablename__ = 'booking_seats'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    seat_id = db.Column(db.Integer, db.ForeignKey('seats.id'), nullable=False)
    seat_number = db.Column(db.String(10), nullable=False)

    seat = db.relationship('Seat')


class Passenger(db.Model):
    __tablename__ = 'passengers'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    passenger_name = db.Column(db.String(100), nullable=False)
    passenger_contact = db.Column(db.String(50), nullable=True)
    passenger_gender = db.Column(db.String(20), default='MALE')
    seat_number = db.Column(db.String(10), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'passenger_name': self.passenger_name,
            'passenger_contact': self.passenger_contact or '',
            'passenger_gender': self.passenger_gender,
            'seat_number': self.seat_number
        }


class BookingNotification(db.Model):
    __tablename__ = 'booking_notifications'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False, index=True)
    channel = db.Column(db.String(20), nullable=False)  # 'SMS' or 'EMAIL'
    recipient = db.Column(db.String(150), nullable=False)
    status = db.Column(db.String(30), default='PENDING', index=True)  # 'PENDING', 'SENT', 'TEST_MODE_SENT', 'FAILED'
    provider = db.Column(db.String(50), default='TEST_MODE')  # 'MSG91', 'TWILIO', 'RESEND', 'SENDGRID', 'SMTP', 'TEST_MODE'
    message_id = db.Column(db.String(120), nullable=True)
    subject = db.Column(db.String(255), nullable=True)
    payload_preview = db.Column(db.Text, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    booking = db.relationship('Booking', backref=db.backref('notifications', lazy='dynamic', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'channel': self.channel,
            'recipient': self.recipient,
            'status': self.status,
            'provider': self.provider,
            'message_id': self.message_id,
            'subject': self.subject,
            'payload_preview': self.payload_preview,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
