from app.models import db

class Place(db.Model):
    __tablename__ = 'places'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    category = db.Column(db.String(100), default='Landmark')
    description = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    nearest_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    is_verified = db.Column(db.Boolean, default=True)

    nearest_stop = db.relationship('BusStop', foreign_keys=[nearest_stop_id], backref='linked_places')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description or '',
            'latitude': self.latitude,
            'longitude': self.longitude,
            'nearest_stop_id': self.nearest_stop_id,
            'nearest_stop_name': self.nearest_stop.name if self.nearest_stop else None,
            'image_url': self.image_url,
            'is_verified': self.is_verified,
            'type': 'LANDMARK'
        }
