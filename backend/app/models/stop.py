from app.models import db

class BusStop(db.Model):
    __tablename__ = 'bus_stops'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, index=True)
    code = db.Column(db.String(20), nullable=True)
    location_description = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    route_stops = db.relationship('RouteStop', backref='stop', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code or (self.name[:4].upper() if self.name else 'STOP'),
            'location_description': self.location_description or '',
            'latitude': self.latitude,
            'longitude': self.longitude,
            'is_active': self.is_active
        }
