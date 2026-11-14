import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from app.models import db
from app.models.user import User

def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=current_app.config.get('JWT_EXPIRY_HOURS', 72)),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET'], algorithm='HS256')

def decode_token(token):
    try:
        return jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user_from_header():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    payload = decode_token(parts[1])
    if not payload:
        return None
    return db.session.get(User, payload['user_id'])

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = get_current_user_from_header()
        if not current_user:
            return jsonify({'error': 'Valid authentication token is required'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = get_current_user_from_header()
        if not current_user:
            return jsonify({'error': 'Valid authentication token is required'}), 401
        if current_user.role != 'admin':
            return jsonify({'error': 'Administrator privileges required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated
