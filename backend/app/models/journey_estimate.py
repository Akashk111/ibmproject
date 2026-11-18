from datetime import datetime
from app.models import db

class JourneyEstimate(db.Model):
    __tablename__ = 'journey_estimates'

    id = db.Column(db.Integer, primary_key=True)
    source_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=True, index=True)
    destination_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=True, index=True)
    source_coords = db.Column(db.String(50), nullable=True)  # "lat,lon"
    dest_coords = db.Column(db.String(50), nullable=True)    # "lat,lon"
    distance_km = db.Column(db.Float, nullable=False)
    estimated_duration_minutes = db.Column(db.Integer, nullable=False)
    traffic_adjusted_duration = db.Column(db.Integer, nullable=False)
    calculation_source = db.Column(db.String(50), default='OSRM')  # 'OSRM', 'GEO_ROAD_MATRIX', 'TIMETABLE_DEFAULT'
    route_geometry = db.Column(db.Text, nullable=True)  # JSON GeoJSON coordinates [[lng, lat], ...]
    calculated_at = db.Column(db.DateTime, default=datetime.utcnow)

    source_stop = db.relationship('BusStop', foreign_keys=[source_id])
    destination_stop = db.relationship('BusStop', foreign_keys=[destination_id])

    def to_dict(self):
        return {
            'id': self.id,
            'source_id': self.source_id,
            'source_stop_name': self.source_stop.name if self.source_stop else None,
            'destination_id': self.destination_id,
            'destination_stop_name': self.destination_stop.name if self.destination_stop else None,
            'distance_km': round(self.distance_km, 2),
            'estimated_duration_minutes': self.estimated_duration_minutes,
            'traffic_adjusted_duration': self.traffic_adjusted_duration,
            'calculation_source': self.calculation_source,
            'route_geometry': self.route_geometry,
            'calculated_at': self.calculated_at.isoformat() if self.calculated_at else None
        }
