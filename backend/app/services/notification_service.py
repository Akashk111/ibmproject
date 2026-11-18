import os
import re
import json
import uuid
import smtplib
import urllib.request
import urllib.parse
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.models import db
from app.models.booking import Booking, BookingNotification

# Regular Expressions for Validation
INDIAN_PHONE_REGEX = re.compile(r'^(?:(?:\+|0{0,2})91[\s\-]?)?0?[6789]\d{9}$')
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')


def is_test_mode():
    """Returns True if test mode is enabled via environment variable or default."""
    val = os.environ.get('NOTIFICATION_TEST_MODE', 'true').strip().lower()
    return val in ('1', 'true', 'yes', 'on')


def clean_and_validate_phone(phone_str):
    """
    Validates and normalizes phone number.
    Returns (is_valid, normalized_phone, error_msg)
    """
    if not phone_str or not str(phone_str).strip():
        return False, None, "Phone number is required."

    cleaned = re.sub(r'[\s\-\(\)]', '', str(phone_str).strip())
    digits = re.sub(r'\D', '', cleaned)
    
    # Check Indian standard 10-digit mobile (starting with 6, 7, 8, or 9)
    if len(digits) == 10 and digits[0] in '6789':
        return True, f"+91{digits}", None
    elif len(digits) == 11 and digits.startswith('0') and digits[1] in '6789':
        return True, f"+91{digits[1:]}", None
    elif len(digits) == 12 and digits.startswith('91') and digits[2] in '6789':
        return True, f"+{digits}", None

    # International E.164 (explicit '+' prefix with non-91 country code)
    if cleaned.startswith('+') and not cleaned.startswith('+91') and re.match(r'^\+[1-9]\d{9,14}$', cleaned):
        return True, cleaned, None

    return False, None, f"Invalid mobile number format: '{phone_str}'. Must be a valid 10-digit mobile number."


def validate_email(email_str):
    """
    Validates email format.
    Returns (is_valid, normalized_email, error_msg)
    """
    if not email_str or not str(email_str).strip():
        return False, None, "Email address is required."

    cleaned = str(email_str).strip().lower()
    if EMAIL_REGEX.match(cleaned):
        return True, cleaned, None

    return False, None, f"Invalid email address format: '{email_str}'."


def format_booking_sms(booking, passenger_name=None):
    """
    Requirement 1 Exact SMS Template:
    "Thank you for booking with Mangaluru Bus Connect!

    Your bus booking is confirmed.

    Booking ID: {booking_id}
    Passenger: {passenger_name}
    From: {boarding_stop}
    To: {destination_stop}
    Journey Date: {journey_date}
    Departure: {departure_time}
    Passengers: {number_of_passengers}
    Total Fare: ₹{total_fare}

    Have a safe journey!
    - Mangaluru Bus Connect"
    """
    # Resolve passenger name
    p_name = passenger_name
    if not p_name and booking.passengers:
        p_name = booking.passengers[0].passenger_name
    if not p_name and booking.user:
        p_name = booking.user.name
    if not p_name:
        p_name = "Commuter"

    boarding_stop = booking.schedule.departure_stop.name if booking.schedule and booking.schedule.departure_stop else "State Bank"
    dest_stop = booking.schedule.destination_stop.name if booking.schedule and booking.schedule.destination_stop else "Surathkal"
    
    # Format total fare without unnecessary trailing zeroes if integer
    fare_val = booking.total_amount
    fare_str = f"{int(fare_val)}" if fare_val.is_integer() else f"{fare_val:.2f}"

    return (
        f"Thank you for booking with Mangaluru Bus Connect!\n\n"
        f"Your bus booking is confirmed.\n\n"
        f"Booking ID: {booking.booking_reference}\n"
        f"Passenger: {p_name}\n"
        f"From: {boarding_stop}\n"
        f"To: {dest_stop}\n"
        f"Journey Date: {booking.travel_date}\n"
        f"Departure: {booking.departure_time}\n"
        f"Passengers: {booking.total_passengers}\n"
        f"Total Fare: ₹{fare_str}\n\n"
        f"Have a safe journey!\n"
        f"- Mangaluru Bus Connect"
    )


def format_booking_email_html(booking, passenger_name=None):
    """
    Requirement 2: Professional HTML email template with blue-and-white design
    (#0756B8 primary blue, #102B4E dark navy, #FFFFFF card).
    """
    p_name = passenger_name
    if not p_name and booking.passengers:
        p_name = booking.passengers[0].passenger_name
    if not p_name and booking.user:
        p_name = booking.user.name
    if not p_name:
        p_name = "Valued Passenger"

    route_code = booking.schedule.route.route_code if booking.schedule and booking.schedule.route else "1A"
    route_name = booking.schedule.route.route_name if booking.schedule and booking.schedule.route else "City Express Link"
    boarding_stop = booking.schedule.departure_stop.name if booking.schedule and booking.schedule.departure_stop else "State Bank"
    dest_stop = booking.schedule.destination_stop.name if booking.schedule and booking.schedule.destination_stop else "Surathkal"
    vehicle_num = booking.schedule.vehicle.vehicle_number if booking.schedule and booking.schedule.vehicle else "KA-19-F-1204"

    seats_list = []
    if hasattr(booking, 'seats') and booking.seats:
        for s in booking.seats:
            if hasattr(s, 'seat_number'):
                seats_list.append(s.seat_number)
            elif isinstance(s, str):
                seats_list.append(s)
    seats_str = ", ".join(seats_list) if seats_list else "Reserved"
    
    fare_val = booking.total_amount
    fare_str = f"{int(fare_val)}" if fare_val.is_integer() else f"{fare_val:.2f}"
    payment_status = booking.payment_status or "PAID (CONFIRMED)"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Mangaluru Bus Connect Booking is Confirmed!</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #F4F7FB;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
    }}
    .email-container {{
      max-width: 600px;
      margin: 30px auto;
      background: #FFFFFF;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
    }}
    .header {{
      background-color: #102B4E;
      color: #FFFFFF;
      padding: 32px 28px;
      text-align: center;
    }}
    .brand-title {{
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin: 0;
      color: #FFFFFF;
    }}
    .brand-sub {{
      font-size: 11px;
      color: #93C5FD;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 4px;
      font-weight: 700;
    }}
    .confirmed-badge {{
      display: inline-block;
      margin-top: 16px;
      padding: 6px 16px;
      background: #10B981;
      color: #FFFFFF;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }}
    .content {{
      padding: 28px;
    }}
    .greeting {{
      font-size: 18px;
      font-weight: 800;
      color: #102B4E;
      margin-top: 0;
      margin-bottom: 8px;
    }}
    .intro-text {{
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }}
    .ticket-card {{
      background: #F8FAFC;
      border: 1.5px solid #0756B8;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }}
    .ticket-header {{
      background: #0756B8;
      color: #FFFFFF;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .ticket-header table {{
      width: 100%;
    }}
    .ticket-header td {{
      color: #FFFFFF;
    }}
    .route-banner {{
      padding: 16px 20px;
      background: #EFF6FF;
      border-bottom: 1px dashed #CBD5E1;
    }}
    .route-stop {{
      font-size: 16px;
      font-weight: 800;
      color: #102B4E;
    }}
    .route-arrow {{
      color: #0756B8;
      font-weight: 900;
      padding: 0 8px;
    }}
    .details-table {{
      width: 100%;
      border-collapse: collapse;
      padding: 16px 20px;
    }}
    .details-table td {{
      padding: 10px 20px;
      font-size: 13px;
      border-bottom: 1px solid #F1F5F9;
    }}
    .details-label {{
      color: #64748B;
      font-weight: 600;
      width: 45%;
    }}
    .details-value {{
      color: #0F172A;
      font-weight: 800;
      text-align: right;
    }}
    .total-row td {{
      background: #EFF6FF;
      font-size: 15px;
      font-weight: 900;
      color: #0756B8;
      border-bottom: none;
    }}
    .safety-banner {{
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 24px;
    }}
    .safety-text {{
      font-size: 14px;
      font-weight: 800;
      color: #065F46;
      margin: 0;
    }}
    .safety-sub {{
      font-size: 12px;
      color: #047857;
      margin: 4px 0 0 0;
    }}
    .footer {{
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
    }}
  </style>
</head>
<body>
  <div class="email-container">
    
    <!-- Header -->
    <div class="header">
      <h1 class="brand-title">MANGALURU BUS CONNECT</h1>
      <div class="brand-sub">Official City Bus Transit Service</div>
      <div class="confirmed-badge">&#10003; BOOKING CONFIRMED</div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <h2 class="greeting">Dear {p_name},</h2>
      <p class="intro-text">
        Thank you for booking with <strong>Mangaluru Bus Connect</strong>! Your city bus ticket has been confirmed and verified. Please present your digital booking reference or this email when boarding the bus.
      </p>

      <!-- Digital Ticket Card -->
      <div class="ticket-card">
        
        <div class="ticket-header">
          <table>
            <tr>
              <td style="font-weight: 800; font-size: 13px;">BOOKING ID</td>
              <td style="text-align: right; font-weight: 900; font-family: monospace; font-size: 16px; color: #FEF08A;">
                {booking.booking_reference}
              </td>
            </tr>
          </table>
        </div>

        <div class="route-banner">
          <span class="route-stop">{boarding_stop}</span>
          <span class="route-arrow">&#10132;</span>
          <span class="route-stop">{dest_stop}</span>
          <div style="font-size: 11px; color: #0756B8; font-weight: 700; margin-top: 4px;">
            Route {route_code} &bull; {route_name}
          </div>
        </div>

        <table class="details-table">
          <tr>
            <td class="details-label">Passenger Name</td>
            <td class="details-value">{p_name}</td>
          </tr>
          <tr>
            <td class="details-label">Bus Route Number</td>
            <td class="details-value">Route {route_code}</td>
          </tr>
          <tr>
            <td class="details-label">Boarding Bus Stop</td>
            <td class="details-value">{boarding_stop}</td>
          </tr>
          <tr>
            <td class="details-label">Destination Bus Stop</td>
            <td class="details-value">{dest_stop}</td>
          </tr>
          <tr>
            <td class="details-label">Journey Date</td>
            <td class="details-value">{booking.travel_date}</td>
          </tr>
          <tr>
            <td class="details-label">Departure Time</td>
            <td class="details-value">{booking.departure_time}</td>
          </tr>
          <tr>
            <td class="details-label">Number of Passengers</td>
            <td class="details-value">{booking.total_passengers}</td>
          </tr>
          <tr>
            <td class="details-label">Seat Number(s)</td>
            <td class="details-value">{seats_str}</td>
          </tr>
          <tr>
            <td class="details-label">Vehicle Assigned</td>
            <td class="details-value">{vehicle_num}</td>
          </tr>
          <tr>
            <td class="details-label">Payment Status</td>
            <td class="details-value" style="color: #059669;">{payment_status}</td>
          </tr>
          <tr class="total-row">
            <td>Total Fare Paid</td>
            <td class="details-value" style="color: #0756B8; font-size: 18px;">&#8377;{fare_str}</td>
          </tr>
        </table>

      </div>

      <!-- Final Safe Journey Banner -->
      <div class="safety-banner">
        <p class="safety-text">Have a safe and happy journey!</p>
        <p class="safety-sub">Thank you for choosing Mangaluru Bus Connect.</p>
      </div>

      <p style="font-size: 12px; color: #64748B; line-height: 1.5; margin: 0;">
        <strong>Boarding Advice:</strong> Please arrive at {boarding_stop} at least 5 minutes before scheduled departure ({booking.departure_time}). City buses run on accurate regional timetables.
      </p>

    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 6px 0; font-weight: 700; color: #102B4E;">
        Mangaluru Bus Connect &bull; Dakshina Kannada Bus Operators Association
      </p>
      <p style="margin: 0; font-size: 11px;">
        State Bank Bus Terminus, Mangaluru, Karnataka 575001 &bull; Support: support@mangaluru-bus.in
      </p>
    </div>

  </div>
</body>
</html>"""


class NotificationService:
    """
    Handles end-to-end SMS and Email dispatch with provider abstraction:
    - SMS Providers: TEST_MODE, MSG91, TWILIO
    - Email Providers: TEST_MODE, RESEND, SENDGRID, SMTP
    - Complete error handling and database status persistence
    - Idempotency guards to prevent duplicate sends
    """

    @classmethod
    def send_sms(cls, phone_number, message, booking_id=None):
        """
        Sends SMS to passenger mobile number using configured provider.
        Supports MSG91, Twilio, and Test Mode.
        """
        is_valid, clean_phone, error_msg = clean_and_validate_phone(phone_number)
        if not is_valid:
            return {
                'success': False,
                'status': 'FAILED',
                'error': error_msg,
                'recipient': phone_number
            }

        provider = os.environ.get('SMS_PROVIDER', 'TEST_MODE').upper()
        api_key = os.environ.get('SMS_PROVIDER_API_KEY', '')
        sender_id = os.environ.get('SMS_SENDER_ID', 'MNGBUS')

        # Fallback to test mode if test mode flag is enabled or no credentials
        if is_test_mode() or provider == 'TEST_MODE' or not api_key:
            msg_id = f"SMS_TEST_{uuid.uuid4().hex[:12].upper()}"
            print(f"[TEST_MODE SMS] Recipient: {clean_phone} | Msg ID: {msg_id}")
            print(f"[TEST_MODE SMS CONTENT]\n{message}\n--------------------")

            # Record in notification log if booking_id provided
            if booking_id:
                notif = BookingNotification(
                    booking_id=booking_id,
                    channel='SMS',
                    recipient=clean_phone,
                    status='TEST_MODE_SENT',
                    provider='TEST_MODE',
                    message_id=msg_id,
                    payload_preview=message[:250]
                )
                db.session.add(notif)
                db.session.commit()

            return {
                'success': True,
                'status': 'TEST_MODE_SENT',
                'provider': 'TEST_MODE',
                'message_id': msg_id,
                'recipient': clean_phone,
                'message': 'SMS simulated and recorded in test mode.'
            }

        # MSG91 Provider
        if provider == 'MSG91':
            try:
                # MSG91 send API payload
                endpoint = "https://control.msg91.com/api/v5/flow/"
                flow_id = os.environ.get('MSG91_FLOW_ID', '')
                
                payload = {
                    "template_id": flow_id,
                    "sender": sender_id,
                    "short_url": "0",
                    "mobiles": clean_phone.replace('+', ''),
                    "message": message
                }
                req = urllib.request.Request(
                    endpoint,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        'authkey': api_key,
                        'Content-Type': 'application/json'
                    }
                )
                with urllib.request.urlopen(req, timeout=8) as res:
                    res_body = res.read().decode('utf-8')
                    res_data = json.loads(res_body)
                    msg_id = res_data.get('message', f"MSG91_{uuid.uuid4().hex[:8]}")

                if booking_id:
                    notif = BookingNotification(
                        booking_id=booking_id,
                        channel='SMS',
                        recipient=clean_phone,
                        status='SENT',
                        provider='MSG91',
                        message_id=str(msg_id),
                        payload_preview=message[:250]
                    )
                    db.session.add(notif)
                    db.session.commit()

                return {'success': True, 'status': 'SENT', 'provider': 'MSG91', 'message_id': msg_id}

            except Exception as e:
                err_str = str(e)
                print(f"[MSG91 ERROR] {err_str}")
                if booking_id:
                    notif = BookingNotification(
                        booking_id=booking_id,
                        channel='SMS',
                        recipient=clean_phone,
                        status='FAILED',
                        provider='MSG91',
                        error_message=err_str[:250]
                    )
                    db.session.add(notif)
                    db.session.commit()
                return {'success': False, 'status': 'FAILED', 'error': err_str, 'provider': 'MSG91'}

        # Twilio Provider
        if provider == 'TWILIO':
            try:
                account_sid = os.environ.get('TWILIO_ACCOUNT_SID', '')
                auth_token = os.environ.get('TWILIO_AUTH_TOKEN', '')
                from_num = os.environ.get('TWILIO_PHONE_NUMBER', '')

                url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
                data = urllib.parse.urlencode({
                    'To': clean_phone,
                    'From': from_num,
                    'Body': message
                }).encode('utf-8')

                req = urllib.request.Request(url, data=data)
                import base64
                auth_str = base64.b64encode(f"{account_sid}:{auth_token}".encode('utf-8')).decode('utf-8')
                req.add_header("Authorization", f"Basic {auth_str}")

                with urllib.request.urlopen(req, timeout=8) as res:
                    body = json.loads(res.read().decode('utf-8'))
                    msg_id = body.get('sid')

                if booking_id:
                    notif = BookingNotification(
                        booking_id=booking_id,
                        channel='SMS',
                        recipient=clean_phone,
                        status='SENT',
                        provider='TWILIO',
                        message_id=str(msg_id),
                        payload_preview=message[:250]
                    )
                    db.session.add(notif)
                    db.session.commit()

                return {'success': True, 'status': 'SENT', 'provider': 'TWILIO', 'message_id': msg_id}

            except Exception as e:
                err_str = str(e)
                print(f"[TWILIO ERROR] {err_str}")
                if booking_id:
                    notif = BookingNotification(
                        booking_id=booking_id,
                        channel='SMS',
                        recipient=clean_phone,
                        status='FAILED',
                        provider='TWILIO',
                        error_message=err_str[:250]
                    )
                    db.session.add(notif)
                    db.session.commit()
                return {'success': False, 'status': 'FAILED', 'error': err_str, 'provider': 'TWILIO'}

        return {'success': False, 'status': 'FAILED', 'error': f"Unsupported SMS provider '{provider}'"}

    @classmethod
    def send_email(cls, email_address, subject, html_content, text_content=None, booking_id=None):
        """
        Sends confirmation Email to passenger address using configured provider.
        Supports Resend, SendGrid, SMTP, and Test Mode.
        """
        is_valid, clean_email, error_msg = validate_email(email_address)
        if not is_valid:
            return {
                'success': False,
                'status': 'FAILED',
                'error': error_msg,
                'recipient': email_address
            }

        provider = os.environ.get('EMAIL_PROVIDER', 'TEST_MODE').upper()
        api_key = os.environ.get('EMAIL_API_KEY', '')
        from_email = os.environ.get('EMAIL_FROM', 'bookings@mangaluru-bus.in')

        # Fallback to test mode if test mode flag is enabled or no credentials
        if is_test_mode() or provider == 'TEST_MODE' or not api_key:
            msg_id = f"EMAIL_TEST_{uuid.uuid4().hex[:12].upper()}"
            print(f"[TEST_MODE EMAIL] Recipient: {clean_email} | Subject: '{subject}' | Msg ID: {msg_id}")
            print(f"[TEST_MODE EMAIL PREVIEW] HTML Size: {len(html_content)} bytes")

            if booking_id:
                notif = BookingNotification(
                    booking_id=booking_id,
                    channel='EMAIL',
                    recipient=clean_email,
                    status='TEST_MODE_SENT',
                    provider='TEST_MODE',
                    message_id=msg_id,
                    subject=subject,
                    payload_preview=f"Subject: {subject} | Recipient: {clean_email}"
                )
                db.session.add(notif)
                db.session.commit()

            return {
                'success': True,
                'status': 'TEST_MODE_SENT',
                'provider': 'TEST_MODE',
                'message_id': msg_id,
                'recipient': clean_email,
                'message': 'Email simulated and recorded in test mode.'
            }

        # Resend API Provider
        if provider == 'RESEND':
            try:
                url = "https://api.resend.com/emails"
                payload = {
                    "from": from_email,
                    "to": [clean_email],
                    "subject": subject,
                    "html": html_content
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    }
                )
                with urllib.request.urlopen(req, timeout=8) as res:
                    body = json.loads(res.read().decode('utf-8'))
                    msg_id = body.get('id')

                if booking_id:
                    notif = BookingNotification(
                        booking_id=booking_id,
                        channel='EMAIL',
                        recipient=clean_email,
                        status='SENT',
                        provider='RESEND',
                        message_id=str(msg_id),
                        subject=subject
                    )
                    db.session.add(notif)
                    db.session.commit()

                return {'success': True, 'status': 'SENT', 'provider': 'RESEND', 'message_id': msg_id}

            except Exception as e:
                err_str = str(e)
                print(f"[RESEND ERROR] {err_str}")
                if booking_id:
                    notif = BookingNotification(
                        booking_id=booking_id,
                        channel='EMAIL',
                        recipient=clean_email,
                        status='FAILED',
                        provider='RESEND',
                        error_message=err_str[:250]
                    )
                    db.session.add(notif)
                    db.session.commit()
                return {'success': False, 'status': 'FAILED', 'error': err_str, 'provider': 'RESEND'}

        # SendGrid API Provider
        if provider == 'SENDGRID':
            try:
                url = "https://api.sendgrid.com/v3/mail/send"
                payload = {
                    "personalizations": [{"to": [{"email": clean_email}]}],
                    "from": {"email": from_email, "name": "Mangaluru Bus Connect"},
                    "subject": subject,
                    "content": [{"type": "text/html", "value": html_content}]
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    }
                )
                with urllib.request.urlopen(req, timeout=8) as res:
                    msg_id = res.headers.get('X-Message-Id', f"SG_{uuid.uuid4().hex[:8]}")

                if booking_id:
                    notif = BookingNotification(
                        booking_id=booking_id,
                        channel='EMAIL',
                        recipient=clean_email,
                        status='SENT',
                        provider='SENDGRID',
                        message_id=str(msg_id),
                        subject=subject
                    )
                    db.session.add(notif)
                    db.session.commit()

                return {'success': True, 'status': 'SENT', 'provider': 'SENDGRID', 'message_id': msg_id}

            except Exception as e:
                err_str = str(e)
                print(f"[SENDGRID ERROR] {err_str}")
                if booking_id:
                    notif = BookingNotification(
                        booking_id=booking_id,
                        channel='EMAIL',
                        recipient=clean_email,
                        status='FAILED',
                        provider='SENDGRID',
                        error_message=err_str[:250]
                    )
                    db.session.add(notif)
                    db.session.commit()
                return {'success': False, 'status': 'FAILED', 'error': err_str, 'provider': 'SENDGRID'}

        # SMTP Provider
        if provider == 'SMTP':
            try:
                smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
                smtp_port = int(os.environ.get('SMTP_PORT', 587))
                smtp_user = os.environ.get('SMTP_USER', '')
                smtp_pass = os.environ.get('SMTP_PASSWORD', '')

                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = from_email
                msg['To'] = clean_email

                part = MIMEText(html_content, 'html')
                msg.attach(part)

                with smtplib.SMTP(smtp_host, smtp_port, timeout=8) as server:
                    server.starttls()
                    if smtp_user and smtp_pass:
                        server.login(smtp_user, smtp_pass)
                    server.sendmail(from_email, [clean_email], msg.as_string())

                msg_id = f"SMTP_{uuid.uuid4().hex[:8]}"
                if booking_id:
                    notif = BookingNotification(
                        booking_id=booking_id,
                        channel='EMAIL',
                        recipient=clean_email,
                        status='SENT',
                        provider='SMTP',
                        message_id=msg_id,
                        subject=subject
                    )
                    db.session.add(notif)
                    db.session.commit()

                return {'success': True, 'status': 'SENT', 'provider': 'SMTP', 'message_id': msg_id}

            except Exception as e:
                err_str = str(e)
                print(f"[SMTP ERROR] {err_str}")
                if booking_id:
                    notif = BookingNotification(
                        booking_id=booking_id,
                        channel='EMAIL',
                        recipient=clean_email,
                        status='FAILED',
                        provider='SMTP',
                        error_message=err_str[:250]
                    )
                    db.session.add(notif)
                    db.session.commit()
                return {'success': False, 'status': 'FAILED', 'error': err_str, 'provider': 'SMTP'}

        return {'success': False, 'status': 'FAILED', 'error': f"Unsupported Email provider '{provider}'"}

    @classmethod
    def send_booking_notifications(cls, booking, force_resend=False):
        """
        Coordinates full dispatch for confirmed booking:
        1. Checks payment & booking confirmation (NEVER sends for unconfirmed/failed bookings)
        2. Enforces idempotency (avoids duplicate notifications on page refresh)
        3. Validates phone number and email address
        4. Sends SMS and Email
        5. Updates booking notification state in SQLite database
        """
        results = {
            'sms': {'attempted': False, 'status': booking.sms_status or 'PENDING'},
            'email': {'attempted': False, 'status': booking.email_status or 'PENDING'}
        }

        # Guard: NEVER send confirmation if booking or payment is not confirmed
        if booking.booking_status != 'CONFIRMED' or booking.payment_status not in ('SUCCESS', 'PAID (CONFIRMED)', 'PAID (Paytm)'):
            print(f"[NOTIFICATION GUARD] Refusing to notify for unconfirmed booking {booking.booking_reference} (Status: {booking.booking_status}, Payment: {booking.payment_status})")
            return results

        # Resolve primary passenger name
        primary_name = "Commuter"
        if booking.passengers and len(booking.passengers) > 0:
            primary_name = booking.passengers[0].passenger_name
        elif booking.user:
            primary_name = booking.user.name

        # Resolve target phone number
        phone_target = booking.passenger_phone
        if not phone_target and booking.passengers and len(booking.passengers) > 0:
            phone_target = booking.passengers[0].passenger_contact

        # Resolve target email address
        email_target = booking.passenger_email
        if not email_target and booking.user and booking.user.email:
            email_target = booking.user.email

        # ---------------------------------------------------------------------
        # 1. DISPATCH SMS
        # ---------------------------------------------------------------------
        already_sent_sms = booking.sms_status in ('SENT', 'TEST_MODE_SENT')
        if already_sent_sms and not force_resend:
            results['sms'] = {
                'attempted': False,
                'status': booking.sms_status,
                'message': 'SMS already sent previously (idempotency preserved).'
            }
        elif phone_target:
            results['sms']['attempted'] = True
            is_valid, clean_phone, phone_err = clean_and_validate_phone(phone_target)
            if is_valid:
                sms_text = format_booking_sms(booking, primary_name)
                sms_res = cls.send_sms(clean_phone, sms_text, booking.id)
                
                booking.sms_status = sms_res.get('status', 'FAILED')
                booking.sms_sent_at = datetime.utcnow() if sms_res.get('success') else None
                booking.sms_error = sms_res.get('error')
                results['sms'] = {'attempted': True, **sms_res}
            else:
                booking.sms_status = 'FAILED'
                booking.sms_error = phone_err
                results['sms'] = {'attempted': True, 'success': False, 'status': 'FAILED', 'error': phone_err}
        else:
            booking.sms_status = 'NOT_PROVIDED'
            results['sms'] = {'attempted': False, 'status': 'NOT_PROVIDED', 'message': 'No mobile number provided.'}

        # ---------------------------------------------------------------------
        # 2. DISPATCH EMAIL
        # ---------------------------------------------------------------------
        already_sent_email = booking.email_status in ('SENT', 'TEST_MODE_SENT')
        if already_sent_email and not force_resend:
            results['email'] = {
                'attempted': False,
                'status': booking.email_status,
                'message': 'Email already sent previously (idempotency preserved).'
            }
        elif email_target:
            results['email']['attempted'] = True
            is_valid, clean_email, email_err = validate_email(email_target)
            if is_valid:
                subject = "Your Mangaluru Bus Connect Booking is Confirmed!"
                html_body = format_booking_email_html(booking, primary_name)
                email_res = cls.send_email(clean_email, subject, html_body, booking_id=booking.id)

                booking.email_status = email_res.get('status', 'FAILED')
                booking.email_sent_at = datetime.utcnow() if email_res.get('success') else None
                booking.email_error = email_res.get('error')
                results['email'] = {'attempted': True, **email_res}
            else:
                booking.email_status = 'FAILED'
                booking.email_error = email_err
                results['email'] = {'attempted': True, 'success': False, 'status': 'FAILED', 'error': email_err}
        else:
            booking.email_status = 'NOT_PROVIDED'
            results['email'] = {'attempted': False, 'status': 'NOT_PROVIDED', 'message': 'No email address provided.'}

        # Commit status updates to booking record
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"[NOTIFICATION DB ERROR] Could not save booking status: {e}")

        return results
