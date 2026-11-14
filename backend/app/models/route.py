from app.models import db

class BusRoute(db.Model):
    __tablename__ = 'bus_routes'

    id = db.Column(db.Integer, primary_key=True)
    route_code = db.Column(db.String(30), nullable=False, index=True)
    route_name = db.Column(db.String(150), nullable=False)
    operator = db.Column(db.String(100), default='DKBOA Mangaluru')
    origin_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=False)
    destination_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    data_source = db.Column(db.String(100), default='Mangaluru City Bus Timetable Reference')
    verification_status = db.Column(db.String(50), default='DEMO DATA')  # 'DEMO DATA' or 'VERIFIED'

    origin_stop = db.relationship('BusStop', foreign_keys=[origin_stop_id], backref='origin_routes')
    destination_stop = db.relationship('BusStop', foreign_keys=[destination_stop_id], backref='destination_routes')

    route_stops = db.relationship('RouteStop', backref='route', cascade='all, delete-orphan', order_by='RouteStop.stop_sequence')
    services = db.relationship('BusService', backref='route', cascade='all, delete-orphan')

    def to_dict(self, include_stops=False, include_services=False):
        data = {
            'id': self.id,
            'route_code': self.route_code,
            'route_name': self.route_name,
            'operator': self.operator,
            'origin_stop_id': self.origin_stop_id,
            'origin_stop_name': self.origin_stop.name if self.origin_stop else None,
            'destination_stop_id': self.destination_stop_id,
            'destination_stop_name': self.destination_stop.name if self.destination_stop else None,
            'is_active': self.is_active,
            'data_source': self.data_source,
            'verification_status': self.verification_status
        }
        if include_stops:
            data['stops'] = [rs.to_dict() for rs in sorted(self.route_stops, key=lambda x: x.stop_sequence)]
        if include_services:
            data['services'] = [s.to_dict() for s in self.services]
        return data


class RouteStop(db.Model):
    __tablename__ = 'route_stops'

    id = db.Column(db.Integer, primary_key=True)
    route_id = db.Column(db.Integer, db.ForeignKey('bus_routes.id'), nullable=False)
    stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=False)
    stop_sequence = db.Column(db.Integer, nullable=False)
    arrival_offset_minutes = db.Column(db.Integer, default=0)
    departure_offset_minutes = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'route_id': self.route_id,
            'stop_id': self.stop_id,
            'stop_name': self.stop.name if self.stop else None,
            'latitude': self.stop.latitude if self.stop else None,
            'longitude': self.stop.longitude if self.stop else None,
            'location_description': self.stop.location_description if self.stop else '',
            'stop_sequence': self.stop_sequence,
            'arrival_offset_minutes': self.arrival_offset_minutes,
            'departure_offset_minutes': self.departure_offset_minutes
        }


class BusService(db.Model):
    __tablename__ = 'bus_services'

    id = db.Column(db.Integer, primary_key=True)
    route_id = db.Column(db.Integer, db.ForeignKey('bus_routes.id'), nullable=False)
    service_name = db.Column(db.String(100), default='Standard City Trip')
    operating_days = db.Column(db.String(100), default='Mon,Tue,Wed,Thu,Fri,Sat,Sun')
    departure_time = db.Column(db.String(10), nullable=False)  # "HH:MM"
    estimated_duration_minutes = db.Column(db.Integer, nullable=False)
    fare = db.Column(db.Float, nullable=True)
    verification_status = db.Column(db.String(50), default='DEMO DATA')  # 'DEMO DATA' or 'VERIFIED'

    def to_dict(self):
        return {
            'id': self.id,
            'route_id': self.route_id,
            'route_code': self.route.route_code if self.route else None,
            'service_name': self.service_name,
            'operating_days': self.operating_days,
            'departure_time': self.departure_time,
            'estimated_duration_minutes': self.estimated_duration_minutes,
            'fare': self.fare,
            'verification_status': self.verification_status
        }
