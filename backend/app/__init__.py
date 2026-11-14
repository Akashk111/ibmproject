import os
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.models import db
from app.routes.auth import auth_bp
from app.routes.stops import stops_bp
from app.routes.routes import routes_bp
from app.routes.journeys import journeys_bp
from app.routes.user import user_bp
from app.routes.admin import admin_bp
from app.routes.tracking import tracking_bp
from app.routes.places import places_bp
from app.routes.schedules import schedules_bp
from app.routes.bookings import bookings_bp
from app.routes.vehicles import vehicles_bp
from app.seeds.seed_data import seed_database

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(stops_bp)
    app.register_blueprint(routes_bp)
    app.register_blueprint(journeys_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(tracking_bp)
    app.register_blueprint(places_bp)
    app.register_blueprint(schedules_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(vehicles_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'platform': 'Mangaluru Bus Connect API',
            'city': 'Mangaluru, Karnataka, India'
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'An internal server error occurred'}), 500

    # Auto-create tables and seed data if needed
    with app.app_context():
        db.create_all()
        seed_database()

    return app
