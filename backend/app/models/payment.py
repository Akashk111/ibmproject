from datetime import datetime
import uuid
from app.models import db

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False, index=True)
    order_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    transaction_id = db.Column(db.String(100), nullable=True, index=True)
    payment_gateway = db.Column(db.String(50), default='PAYTM')
    payment_method = db.Column(db.String(50), default='UPI')  # UPI, DEBIT_CARD, CREDIT_CARD, NET_BANKING, WALLET
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='INR')
    payment_status = db.Column(db.String(30), default='PENDING', index=True)  # PENDING, SUCCESS, FAILED, REFUNDED
    gateway_response = db.Column(db.Text, nullable=True)
    bank_reference = db.Column(db.String(100), nullable=True)
    checksum = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    booking = db.relationship('Booking', backref=db.backref('payments', lazy=True, cascade='all, delete-orphan'))

    @staticmethod
    def generate_order_id():
        return f"ORDER_MBC_{uuid.uuid4().hex[:12].upper()}"

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'booking_reference': self.booking.booking_reference if self.booking else None,
            'order_id': self.order_id,
            'transaction_id': self.transaction_id,
            'payment_gateway': self.payment_gateway,
            'payment_method': self.payment_method,
            'amount': self.amount,
            'currency': self.currency,
            'payment_status': self.payment_status,
            'bank_reference': self.bank_reference,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
