import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, CheckCircle2, Bus, Calendar, Clock, MapPin, 
  User, Download, ArrowRight, ShieldCheck, QrCode, AlertCircle, 
  ExternalLink, Home, Copy, Check, Heart, Sparkles, CreditCard,
  Printer, ArrowLeft, Users, IndianRupee, RefreshCw, Smartphone, Mail,
  Ticket
} from 'lucide-react';
import { bookingService } from '../api/services';
import QRCodeDisplay from '../components/QRCodeDisplay';
import ThankYouBus3D from '../components/ThankYouBus3D';

export default function BookingConfirmation() {
  const { bookingRef } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [bookingRef]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getByIdOrRef(bookingRef);
      setBooking(data);
    } catch (err) {
      console.error('Failed to load booking record:', err);
      setError('Booking details could not be found. Please check your booking reference code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBookingId = () => {
    if (booking?.booking_reference) {
      navigator.clipboard.writeText(booking.booking_reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTicket = () => {
    window.print();
  };

  const handleResendNotifications = async () => {
    if (!booking) return;
    try {
      setResending(true);
      setResendMessage('');
      const res = await bookingService.resendNotifications(booking.booking_reference);
      setResendMessage(res.message || 'Notification dispatch re-triggered.');
      fetchBooking();
    } catch (err) {
      console.error('Failed to resend notifications:', err);
      setResendMessage(err.message || 'Failed to resend notifications.');
    } finally {
      setResending(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center py-20 px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <div className="w-12 h-12 border-4 border-[#0756B8] border-t-transparent rounded-full animate-spin" />
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#102B4E]">Verifying Booking Details</h3>
            <p className="text-xs text-slate-500">Retrieving official digital boarding pass from Mangaluru Transit database...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#102B4E]">Booking Not Found</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error || 'No booking record matching this reference was found.'}</p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/my-bookings"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#0756B8] text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition-colors"
            >
              Check My Bookings
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // REQUIREMENT 7: NEVER show success if payment or booking failed
  const isFailedOrCancelled = 
    booking.booking_status === 'CANCELLED' || 
    booking.payment_status === 'FAILED';

  if (isFailedOrCancelled) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] py-16 px-4">
        <div className="max-w-xl mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50">
            <AlertCircle className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider">
            Booking Status: {booking.booking_status || 'FAILED'}
          </span>
          <h2 className="text-2xl font-black text-[#102B4E]">
            Booking Was Not Confirmed
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Your transaction could not be completed or the reservation was cancelled. No seats have been permanently confirmed for booking ref <strong className="font-mono text-slate-900">{booking.booking_reference}</strong>.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/schedules"
              className="px-6 py-3 rounded-2xl bg-[#0756B8] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Try Booking Again
            </Link>
            <Link
              to="/"
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // REQUIREMENT 7: NEVER show success if payment or booking is pending
  const isPending = 
    booking.booking_status === 'PENDING' || 
    booking.payment_status === 'PENDING';

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] py-16 px-4 flex items-center justify-center">
        <div className="max-w-xl mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-amber-200 shadow-xl text-center space-y-4">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50">
            <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider">
            Payment Status: PENDING VERIFICATION
          </span>
          <h2 className="text-2xl font-black text-[#102B4E]">
            Payment is Being Processed
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Your booking reference <strong className="font-mono text-slate-900">{booking.booking_reference}</strong> is currently awaiting final bank confirmation. Seat reservation will be officially locked once payment clears.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={fetchBooking}
              className="px-6 py-3 rounded-2xl bg-[#0756B8] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>
            <Link
              to="/my-bookings"
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
            >
              Go to My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Primary Passenger Name
  const primaryPassengerName = 
    booking.passengers?.[0]?.passenger_name || 
    booking.user_name || 
    'Passenger';

  return (
    <div className="min-h-screen bg-[#F4F7FB] py-8 sm:py-12 selection:bg-brand-500 selection:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* ============================================================ */}
        {/* 2. MAIN 3D HERO BANNER (Three.js Coastal City Bus & Scenery) */}
        {/* ============================================================ */}
        <div className="no-print">
          <ThankYouBus3D 
            destinationText={booking.destination_stop_name || "MANGALURU CITY"} 
            passengerName={primaryPassengerName}
          />
        </div>

        {/* ============================================================ */}
        {/* 1. BOOKING SUCCESS SCREEN HEADER                            */}
        {/* ============================================================ */}
        <div className="text-center no-print pt-2 space-y-3">
          
          {/* Celebratory Animated Green Success Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-400/20 animate-success-ring" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-100 animate-checkmark">
              <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3.5]" />
            </div>
          </div>

          {/* Status Badge & Confirmed Booking ID */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payment Verified & Confirmed</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#0756B8] border border-blue-200 text-xs font-mono font-black">
              <span>Booking ID: {booking.booking_reference}</span>
            </span>
          </div>

          {/* Main Heading & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#102B4E] tracking-tight">
              Thank You for Booking with Us!
            </h1>
            <p className="mt-2 text-sm sm:text-base font-semibold text-slate-600 max-w-2xl mx-auto">
              Your journey starts here. Have a safe and happy journey!
            </p>
          </div>

          {/* Personalised Message */}
          <div className="pt-1">
            <p className="text-xs sm:text-sm font-bold text-[#0756B8] bg-blue-50/80 inline-block px-4 py-1.5 rounded-full border border-blue-200">
              Thank you, {primaryPassengerName}, for choosing Mangaluru Bus Connect.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. LARGE WHITE ROUNDED BOOKING CONFIRMATION CARD            */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl print-card">
          
          {/* Card Top Header Strip */}
          <div className="bg-[#102B4E] text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-300">
                    Mangaluru City Bus Transit
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-black uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Payment Successful
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Ticket className="w-6 h-6 text-blue-300" />
                  <span>Booking Confirmed!</span>
                </h2>
              </div>

              {/* Booking Reference Pill */}
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
                <div>
                  <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">
                    Actual Booking ID
                  </span>
                  <span className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider">
                    {booking.booking_reference}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBookingId}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors no-print"
                  title="Copy Booking ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-200" />}
                </button>
              </div>
            </div>

            {/* Boarding and Destination Stops Section */}
            <div className="relative z-10 pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Boarding Bus Stop */}
              <div className="md:col-span-5 space-y-1">
                <span className="text-[10px] text-blue-300 font-extrabold uppercase tracking-widest block">
                  Boarding Bus Stop (From)
                </span>
                <p className="text-xl sm:text-2xl font-black text-white">
                  {booking.departure_stop_name || 'State Bank'}
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-bold text-blue-100">
                  <Clock className="w-3.5 h-3.5 text-blue-300" />
                  <span>Departure: {booking.departure_time || '08:30 AM'}</span>
                </div>
              </div>

              {/* Bus Route Graphic Indicator */}
              <div className="md:col-span-2 flex flex-col items-center justify-center py-2">
                <span className="text-[11px] font-black text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30">
                  Route {booking.route_code || '1A'}
                </span>
                <div className="flex items-center w-full justify-center my-1.5">
                  <div className="h-0.5 bg-blue-400/50 flex-grow" />
                  <Bus className="w-5 h-5 text-blue-300 mx-2 flex-shrink-0" />
                  <div className="h-0.5 bg-blue-400/50 flex-grow" />
                </div>
                <span className="text-[10px] text-blue-200 font-semibold text-center line-clamp-1">
                  {booking.route_name || 'City Express'}
                </span>
              </div>

              {/* Destination Bus Stop */}
              <div className="md:col-span-5 space-y-1 md:text-right">
                <span className="text-[10px] text-blue-300 font-extrabold uppercase tracking-widest block">
                  Destination Bus Stop (To)
                </span>
                <p className="text-xl sm:text-2xl font-black text-white">
                  {booking.destination_stop_name || 'Surathkal'}
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-200 border border-emerald-400/20">
                  <Clock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>ETA: {booking.expected_arrival_time || '09:15 AM'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Ticket Perforation Notch */}
          <div className="relative flex items-center justify-between bg-white px-2 py-1 select-none">
            <div className="w-6 h-6 rounded-full bg-[#F4F7FB] -ml-5 border border-slate-200 shadow-inner" />
            <div className="w-full border-t-2 border-dashed border-slate-300 my-2" />
            <div className="w-6 h-6 rounded-full bg-[#F4F7FB] -mr-5 border border-slate-200 shadow-inner" />
          </div>

          {/* Core Passenger Details Grid */}
          <div className="p-6 sm:p-8 space-y-6">
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-[#F4F7FB] p-5 rounded-2xl border border-slate-200">
              
              {/* Passenger Name */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Passenger Name
                </span>
                <p className="text-sm sm:text-base font-black text-[#102B4E] mt-0.5 truncate">
                  {primaryPassengerName}
                </p>
              </div>

              {/* Booking ID */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Booking ID
                </span>
                <p className="text-sm sm:text-base font-mono font-black text-[#0756B8] mt-0.5">
                  {booking.booking_reference}
                </p>
              </div>

              {/* Journey Date */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Journey Date
                </span>
                <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                  {booking.travel_date || new Date().toISOString().split('T')[0]}
                </p>
              </div>

              {/* Departure Time */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Departure Time
                </span>
                <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                  {booking.departure_time || '08:30 AM'}
                </p>
              </div>

              {/* From Bus Stop */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  From Bus Stop
                </span>
                <p className="text-sm sm:text-base font-black text-slate-800 mt-0.5 truncate">
                  {booking.departure_stop_name || 'State Bank'}
                </p>
              </div>

              {/* To Bus Stop */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  To Bus Stop
                </span>
                <p className="text-sm sm:text-base font-black text-slate-800 mt-0.5 truncate">
                  {booking.destination_stop_name || 'Surathkal'}
                </p>
              </div>

              {/* Bus Number / Route */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Bus Number / Route
                </span>
                <p className="text-sm sm:text-base font-black text-slate-800 mt-0.5">
                  Route {booking.route_code || '1A'} ({booking.vehicle_number || 'KA-19-F-1204'})
                </p>
              </div>

              {/* Number of Passengers */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  No. of Passengers
                </span>
                <p className="text-sm sm:text-base font-black text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>
                    {booking.total_passengers || booking.passengers?.length || 1} {booking.total_passengers === 1 ? 'Passenger' : 'Passengers'}
                  </span>
                </p>
              </div>

              {/* Reserved Seats */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Seat Number(s)
                </span>
                <p className="text-sm sm:text-base font-black text-[#0756B8] mt-0.5">
                  {booking.seats && booking.seats.length > 0 ? booking.seats.join(', ') : 'Reserved'}
                </p>
              </div>

              {/* Total Fare */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Total Fare
                </span>
                <p className="text-sm sm:text-base font-black text-[#102B4E] mt-0.5">
                  ₹{typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : booking.total_amount}
                </p>
              </div>

              {/* Payment Status */}
              <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Payment Status
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{booking.payment_status || 'PAID (CONFIRMED)'}</span>
                </span>
              </div>

            </div>

            {/* Total Fare Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#E8F1FF] rounded-2xl border border-blue-200 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0756B8] text-white flex items-center justify-center font-bold">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-[#0756B8] uppercase tracking-wider block">
                    Total Fare Paid
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-[#102B4E]">
                    ₹{typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : booking.total_amount}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  Includes all municipal transit tolls & GST
                </p>
                <p className="text-[11px] text-slate-500">
                  Payment mode: Verified Electronic Checkout
                </p>
              </div>
            </div>

            {/* Passenger Manifest Table (if multiple passengers) */}
            {booking.passengers && booking.passengers.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-[#102B4E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#0756B8]" />
                  <span>Passenger Manifest</span>
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {booking.passengers.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#E8F1FF] text-[#0756B8] font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{p.passenger_name}</p>
                          <p className="text-[10px] text-slate-500">
                            Gender: {p.passenger_gender || 'Not specified'} • Age: {p.passenger_age || 'Adult'}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-[#0756B8] bg-[#E8F1FF] px-2.5 py-1 rounded-lg border border-blue-200">
                        Seat {p.seat_number || booking.seats?.[idx] || 'Assigned'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code and Conductor Verification Seal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <QRCodeDisplay
                    value={booking.booking_reference || booking.qr_verification_code || `MBC-PASS:${booking.booking_reference}`}
                    size={96}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Conductor Verification QR Code</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Scan by Mangaluru City Bus Conductor upon boarding.
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    Pass Reference: {booking.booking_reference}
                  </p>
                  <Link
                    to={`/verify-ticket/${booking.booking_reference}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0756B8] hover:underline no-print pt-1"
                  >
                    <span>Conductor Inspection Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-800">Bus Assigned: {booking.vehicle_number || 'KA-19-F-1204'}</p>
                <p className="text-[11px]">Operator: {booking.operator || 'DKBOA Mangaluru'}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Check className="w-3 h-3" />
                  Valid for Single City Transit
                </span>
              </div>
            </div>

            {/* Automatic SMS & Email Notification Delivery Status Card */}
            <div className="mt-6 pt-6 border-t border-slate-200 no-print">
              <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#0756B8] flex items-center justify-center text-xs font-bold">
                      🔔
                    </span>
                    <h4 className="text-xs font-black text-[#102B4E] uppercase tracking-wider">
                      Booking Notifications Status
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendNotifications}
                    disabled={resending}
                    className="text-xs font-bold text-[#0756B8] hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>{resending ? 'Resending...' : 'Resend Notifications'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* SMS Delivery Status */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-[#0756B8]" />
                        <span>SMS to Mobile</span>
                      </span>
                      <p className="font-bold text-slate-900 font-mono text-xs">
                        {booking.passenger_phone || 'No mobile registered'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {booking.sms_status === 'SENT' ? '✓ Delivered via SMS Provider' :
                         booking.sms_status === 'TEST_MODE_SENT' ? '✓ Simulated in Test Mode' :
                         booking.sms_status === 'FAILED' ? `Failed: ${booking.sms_error || 'Delivery issue'}` :
                         'Notification queued'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      booking.sms_status === 'SENT' || booking.sms_status === 'TEST_MODE_SENT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : booking.sms_status === 'FAILED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {booking.sms_status === 'TEST_MODE_SENT' ? 'TEST SENT' : (booking.sms_status || 'PENDING')}
                    </span>
                  </div>

                  {/* Email Delivery Status */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#0756B8]" />
                        <span>Email to Gmail</span>
                      </span>
                      <p className="font-bold text-slate-900 text-xs truncate max-w-[180px]">
                        {booking.passenger_email || booking.user_email || 'No email registered'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {booking.email_status === 'SENT' ? '✓ Sent to Inbox' :
                         booking.email_status === 'TEST_MODE_SENT' ? '✓ Simulated in Test Mode' :
                         booking.email_status === 'FAILED' ? `Failed: ${booking.email_error || 'Delivery issue'}` :
                         'Notification queued'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      booking.email_status === 'SENT' || booking.email_status === 'TEST_MODE_SENT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : booking.email_status === 'FAILED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {booking.email_status === 'TEST_MODE_SENT' ? 'TEST SENT' : (booking.email_status || 'PENDING')}
                    </span>
                  </div>
                </div>

                {resendMessage && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#0756B8] font-bold flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{resendMessage}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. THREE ACTION BUTTONS                                      */}
        {/* ============================================================ */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 no-print">
          
          {/* Button 1: View My Booking */}
          <Link
            to="/my-bookings"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-[#102B4E] font-black text-xs sm:text-sm border border-slate-300 shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Calendar className="w-4 h-4 text-[#0756B8]" />
            <span>View My Booking</span>
          </Link>

          {/* Button 2: Download Ticket */}
          <button
            type="button"
            onClick={handleDownloadTicket}
            className="px-6 py-3.5 rounded-2xl bg-[#0756B8] hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Ticket</span>
          </button>

          {/* Button 3: Back to Home */}
          <Link
            to="/"
            className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

        </div>

        {/* ============================================================ */}
        {/* 4. THANK YOU MESSAGE BANNER                                  */}
        {/* ============================================================ */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 rounded-3xl p-6 sm:p-8 border border-blue-200 text-center space-y-2.5 shadow-sm no-print">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0756B8] animate-bounce">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl shadow-inner animate-pulse" title="Mangaluru City Bus">
              🚌
            </div>
          </div>
          <h3 className="text-base sm:text-xl font-black text-[#102B4E]">
            Thank you for travelling with Mangaluru Bus Connect!
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-xl mx-auto leading-relaxed">
            We appreciate your trust. We wish you a comfortable and safe journey.
          </p>
        </div>

      </div>
    </div>
  );
}
