from datetime import datetime
import uuid
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
    total_passengers = db.Column(db.Integer, default=1)
    total_amount = db.Column(db.Float, default=0.0)
    booking_status = db.Column(db.String(30), default='CONFIRMED')  # 'CONFIRMED', 'CANCELLED'
    booking_source = db.Column(db.String(30), default='DEMO BOOKING') # 'DEMO BOOKING', 'REAL BOOKING'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='bookings')
    seats = db.relationship('BookingSeat', backref='booking', cascade='all, delete-orphan')
    passengers = db.relationship('Passenger', backref='booking', cascade='all, delete-orphan')

    @staticmethod
    def generate_reference():
        random_suffix = uuid.uuid4().hex[:6].upper()
        return f"MBC-MGL-{random_suffix}"

    def to_dict(self):
        return {
            'id': self.id,
            'booking_reference': self.booking_reference,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Guest Commuter',
            'schedule_id': self.schedule_id,
            'route_code': self.schedule.route.route_code if self.schedule and self.schedule.route else None,
            'route_name': self.schedule.route.route_name if self.schedule and self.schedule.route else None,
            'vehicle_number': self.schedule.vehicle.vehicle_number if self.schedule and self.schedule.vehicle else None,
            'vehicle_name': self.schedule.vehicle.vehicle_name if self.schedule and self.schedule.vehicle else None,
            'departure_stop_name': self.schedule.departure_stop.name if self.schedule and self.schedule.departure_stop else None,
            'destination_stop_name': self.schedule.destination_stop.name if self.schedule and self.schedule.destination_stop else None,
            'travel_date': self.travel_date,
            'departure_time': self.departure_time,
            'arrival_time': self.schedule.arrival_time if self.schedule else None,
            'total_passengers': self.total_passengers,
            'total_amount': self.total_amount,
            'booking_status': self.booking_status,
            'booking_source': self.booking_source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'seats': [bs.seat_number for bs in self.seats],
            'passengers': [p.to_dict() for p in self.passengers]
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
