from datetime import datetime
from app.models import db

class SavedJourney(db.Model):
    __tablename__ = 'saved_journeys'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    source_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=False)
    destination_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    source_stop = db.relationship('BusStop', foreign_keys=[source_stop_id])
    destination_stop = db.relationship('BusStop', foreign_keys=[destination_stop_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'source_stop_id': self.source_stop_id,
            'source_stop_name': self.source_stop.name if self.source_stop else None,
            'destination_stop_id': self.destination_stop_id,
            'destination_stop_name': self.destination_stop.name if self.destination_stop else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class SearchHistory(db.Model):
    __tablename__ = 'search_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    source_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=False)
    destination_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stops.id'), nullable=False)
    searched_at = db.Column(db.DateTime, default=datetime.utcnow)

    source_stop = db.relationship('BusStop', foreign_keys=[source_stop_id])
    destination_stop = db.relationship('BusStop', foreign_keys=[destination_stop_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'source_stop_id': self.source_stop_id,
            'source_stop_name': self.source_stop.name if self.source_stop else None,
            'destination_stop_id': self.destination_stop_id,
            'destination_stop_name': self.destination_stop.name if self.destination_stop else None,
            'searched_at': self.searched_at.isoformat() if self.searched_at else None
        }
