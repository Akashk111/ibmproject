from datetime import datetime
from app.models import db

class BusLocation(db.Model):
    __tablename__ = 'bus_locations'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.String(50), nullable=False, index=True)
    vehicle_name = db.Column(db.String(100), default="City Express Bus")
    route_id = db.Column(db.Integer, db.ForeignKey('bus_routes.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    speed = db.Column(db.Float, default=25.0)  # in km/h
    heading = db.Column(db.Float, default=0.0)  # 0 - 360 degrees
    next_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=True)
    eta_minutes = db.Column(db.Integer, default=5)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    source_type = db.Column(db.String(20), default='DEMO')  # 'LIVE', 'DEMO', 'STALE', 'OFFLINE'
    is_active = db.Column(db.Boolean, default=True)

    route = db.relationship('BusRoute', backref='tracked_vehicles')
    next_stop = db.relationship('BusStop', foreign_keys=[next_stop_id])

    def to_dict(self):
        # Calculate freshness
        now = datetime.utcnow()
        age_seconds = (now - self.recorded_at).total_seconds() if self.recorded_at else 9999
        
        computed_status = self.source_type
        if self.source_type == 'LIVE' and age_seconds > 120:
            computed_status = 'STALE'
        elif not self.is_active:
            computed_status = 'OFFLINE'

        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'vehicle_name': self.vehicle_name,
            'route_id': self.route_id,
            'route_code': self.route.route_code if self.route else None,
            'route_name': self.route.route_name if self.route else None,
            'operator': self.route.operator if self.route else None,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'speed': self.speed,
            'heading': self.heading,
            'next_stop_id': self.next_stop_id,
            'next_stop_name': self.next_stop.name if self.next_stop else None,
            'eta_minutes': self.eta_minutes,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None,
            'source_type': computed_status,
            'is_demo': computed_status == 'DEMO',
            'is_live': computed_status == 'LIVE',
            'age_seconds': int(age_seconds)
        }
