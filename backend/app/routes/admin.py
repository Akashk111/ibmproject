import csv
import io
from flask import Blueprint, request, jsonify, Response
from app.models import db
from app.models.user import User
from app.models.stop import BusStop
from app.models.route import BusRoute, RouteStop, BusService
from app.models.place import Place
from app.models.booking import Vehicle, Schedule, Booking
from app.models.payment import Payment
from app.models.user_data import SearchHistory, SavedJourney
from app.utils.auth_helpers import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard_summary(current_user):
    total_stops = BusStop.query.count()
    active_stops = BusStop.query.filter_by(is_active=True).count()
    total_routes = BusRoute.query.count()
    active_routes = BusRoute.query.filter_by(is_active=True).count()
    total_services = BusService.query.count()
    total_users = User.query.count()
    total_searches = SearchHistory.query.count()
    total_vehicles = Vehicle.query.count()
    total_bookings = Booking.query.count()
    total_places = Place.query.count()

    # Payment statistics
    successful_payments = Payment.query.filter_by(payment_status='SUCCESS').count()
    failed_payments = Payment.query.filter_by(payment_status='FAILED').count()
    pending_payments = Payment.query.filter_by(payment_status='PENDING').count()
    refunds_count = Payment.query.filter_by(payment_status='REFUNDED').count()

    revenue_query = db.session.query(db.func.sum(Payment.amount)).filter(Payment.payment_status == 'SUCCESS').scalar()
    total_revenue = float(revenue_query or 0.0)

    demo_routes = BusRoute.query.filter_by(verification_status='DEMO DATA').count()
    verified_routes = BusRoute.query.filter_by(verification_status='VERIFIED').count()

    # Recent activity
    recent_searches = SearchHistory.query.order_by(SearchHistory.searched_at.desc()).limit(8).all()
    recent_bookings = Booking.query.order_by(Booking.created_at.desc()).limit(8).all()
    recent_payments = Payment.query.order_by(Payment.created_at.desc()).limit(8).all()

    return jsonify({
        'stats': {
            'total_stops': total_stops,
            'active_stops': active_stops,
            'total_routes': total_routes,
            'active_routes': active_routes,
            'total_services': total_services,
            'total_users': total_users,
            'total_searches': total_searches,
            'total_vehicles': total_vehicles,
            'total_bookings': total_bookings,
            'total_places': total_places,
            'successful_payments': successful_payments,
            'failed_payments': failed_payments,
            'pending_payments': pending_payments,
            'refunds_count': refunds_count,
            'total_revenue': total_revenue,
            'demo_routes_count': demo_routes,
            'verified_routes_count': verified_routes
        },
        'recent_searches': [s.to_dict() for s in recent_searches],
        'recent_bookings': [b.to_dict() for b in recent_bookings],
        'recent_payments': [p.to_dict() for p in recent_payments]
    }), 200

@admin_bp.route('/payments', methods=['GET'])
@admin_required
def get_admin_payments(current_user):
    """
    Dedicated payment management endpoint returning transactions,
    status breakdowns, and bus-wise revenue totals.
    """
    payments = Payment.query.order_by(Payment.created_at.desc()).all()
    
    # Calculate bus-wise revenue breakdown
    bus_breakdown = {}
    for p in payments:
        if p.payment_status == 'SUCCESS' and p.booking and p.booking.schedule:
            veh = p.booking.schedule.vehicle
            v_num = veh.vehicle_number if veh else 'Unassigned'
            r_code = p.booking.schedule.route.route_code if (p.booking.schedule.route) else 'General'
            key = f"{v_num} ({r_code})"
            if key not in bus_breakdown:
                bus_breakdown[key] = {'vehicle_number': v_num, 'route_code': r_code, 'bookings': 0, 'revenue': 0.0}
            bus_breakdown[key]['bookings'] += 1
            bus_breakdown[key]['revenue'] += p.amount

    successful = [p for p in payments if p.payment_status == 'SUCCESS']
    failed = [p for p in payments if p.payment_status == 'FAILED']
    pending = [p for p in payments if p.payment_status == 'PENDING']
    refunded = [p for p in payments if p.payment_status == 'REFUNDED']

    return jsonify({
        'success': True,
        'summary': {
            'total_transactions': len(payments),
            'successful_count': len(successful),
            'failed_count': len(failed),
            'pending_count': len(pending),
            'refunded_count': len(refunded),
            'total_revenue': sum(p.amount for p in successful),
            'refunded_amount': sum(p.amount for p in refunded)
        },
        'revenue_summary': {
            'total_revenue': sum(p.amount for p in successful),
            'total_transactions': len(payments),
            'successful_transactions': len(successful),
            'failed_transactions': len(failed),
            'pending_transactions': len(pending),
            'refunded_transactions': len(refunded),
            'total_refunded': sum(p.amount for p in refunded)
        },
        'payments': [p.to_dict() for p in payments],
        'bus_wise_breakdown': list(bus_breakdown.values()),
        'bus_wise_revenue': [
            {
                'vehicle_number': b['vehicle_number'],
                'operator': 'DKBOA Mangaluru',
                'bookings_count': b['bookings'],
                'total_revenue': b['revenue']
            }
            for b in bus_breakdown.values()
        ]
    }), 200

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users(current_user):
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@admin_bp.route('/bookings', methods=['GET'])
@admin_required
def get_all_bookings(current_user):
    bookings = Booking.query.order_by(Booking.created_at.desc()).all()
    return jsonify({'bookings': [b.to_dict() for b in bookings]}), 200

@admin_bp.route('/export/stops', methods=['GET'])
@admin_required
def export_stops_csv(current_user):
    """Export all bus stops as a CSV file"""
    stops = BusStop.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['id', 'name', 'code', 'latitude', 'longitude', 'is_active'])

    for s in stops:
        writer.writerow([s.id, s.name, s.code, s.latitude, s.longitude, 'TRUE' if s.is_active else 'FALSE'])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=mangaluru_bus_stops.csv"}
    )

@admin_bp.route('/export/routes', methods=['GET'])
@admin_required
def export_routes_csv(current_user):
    """Export all bus routes as a CSV file"""
    routes = BusRoute.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['id', 'route_code', 'route_name', 'operator', 'standard_fare', 'is_active', 'verification_status'])

    for r in routes:
        writer.writerow([r.id, r.route_code, r.route_name, r.operator, r.standard_fare, 'TRUE' if r.is_active else 'FALSE', r.verification_status])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=mangaluru_bus_routes.csv"}
    )

@admin_bp.route('/import/stops', methods=['POST'])
@admin_required
def import_stops_csv(current_user):
    """Import stops from CSV upload or raw csv text"""
    try:
        csv_text = ''
        if 'file' in request.files:
            file = request.files['file']
            csv_text = file.read().decode('utf-8')
        elif request.data:
            csv_text = request.data.decode('utf-8')

        if not csv_text:
            return jsonify({'error': 'No CSV data provided'}), 400

        reader = csv.DictReader(io.StringIO(csv_text))
        imported_count = 0

        for row in reader:
            name = row.get('name') or row.get('Name')
            code = row.get('code') or row.get('Code') or (name[:4].upper() if name else 'STOP')
            lat = float(row.get('latitude') or row.get('lat') or 12.9141)
            lng = float(row.get('longitude') or row.get('lng') or 74.8560)

            if not name:
                continue

            existing = BusStop.query.filter_by(name=name).first()
            if existing:
                existing.code = code
                existing.latitude = lat
                existing.longitude = lng
            else:
                new_stop = BusStop(name=name, code=code, latitude=lat, longitude=lng, is_active=True)
                db.session.add(new_stop)
            imported_count += 1

        db.session.commit()
        return jsonify({'message': f'Successfully imported/updated {imported_count} bus stops'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to import CSV: {str(e)}'}), 400

@admin_bp.route('/services/<int:service_id>', methods=['DELETE'])
@admin_required
def delete_service(current_user, service_id):
    service = db.session.get(BusService, service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404
    db.session.delete(service)
    db.session.commit()
    return jsonify({'message': 'Timetable service deleted successfully'}), 200

@admin_bp.route('/services/<int:service_id>/verify', methods=['PUT'])
@admin_required
def toggle_service_verification(current_user, service_id):
    service = db.session.get(BusService, service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404
    data = request.get_json() or {}
    new_status = data.get('verification_status')
    if not new_status:
        new_status = 'VERIFIED' if service.verification_status == 'DEMO DATA' else 'DEMO DATA'

    service.verification_status = new_status
    db.session.commit()
    return jsonify({'message': 'Service verification status updated', 'service': service.to_dict()}), 200
