import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, Bus, Calendar, Clock, MapPin, User, Download, 
  Printer, ArrowRight, ShieldCheck, QrCode, AlertCircle 
} from 'lucide-react';
import { bookingService } from '../api/services';

export default function BookingConfirmation() {
  const { bookingRef } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      console.error('Failed to load booking:', err);
      setError('Booking details could not be found. Please check your reference code.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600">Retrieving digital boarding pass...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Booking Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">{error}</p>
          <button
            onClick={() => navigate('/schedules')}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
          >
            Back to Schedules
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
            Seat Reservation Confirmed
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
            Your Boarding Pass Is Ready!
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Present this digital ticket or reference code when boarding the bus.
          </p>
        </div>

        {/* Digital Boarding Pass Ticket Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl mb-8">
          
          {/* Top Navy Header Banner */}
          <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-xs">
                  MBC
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">MANGALURU BUS CONNECT</h3>
                  <p className="text-[10px] text-brand-300 font-semibold tracking-wider uppercase">City Transit Boarding Pass</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Booking Ref</p>
                <p className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider">
                  {booking.booking_reference}
                </p>
              </div>
            </div>

            {/* Terminal to Terminal Route Display */}
            <div className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">From (Boarding)</p>
                <p className="text-xl sm:text-2xl font-black text-white">{booking.departure_stop_name}</p>
                <p className="text-xs font-semibold text-brand-300 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {booking.departure_time}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <Bus className="w-6 h-6 text-brand-400 mb-1" />
                <div className="w-20 sm:w-28 h-0.5 bg-brand-400/50" />
                <span className="text-[10px] text-slate-300 font-bold mt-1">
                  Route {booking.route_code || '1A'}
                </span>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">To (Dropping)</p>
                <p className="text-xl sm:text-2xl font-black text-white">{booking.destination_stop_name}</p>
                <p className="text-xs font-semibold text-slate-300 mt-0.5">
                  Arrival ~{booking.arrival_time || 'On-Schedule'}
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Perforation / Punch Line */}
          <div className="relative flex items-center justify-between bg-white px-2 py-1">
            <div className="w-5 h-5 rounded-full bg-slate-50 -ml-4 border border-slate-200" />
            <div className="w-full border-t-2 border-dashed border-slate-200 my-2" />
            <div className="w-5 h-5 rounded-full bg-slate-50 -mr-4 border border-slate-200" />
          </div>

          {/* Ticket Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Grid of details: Date, Vehicle, Seats, Amount */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Travel Date</p>
                <p className="text-xs sm:text-sm font-extrabold text-slate-800">{booking.travel_date}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Bus Number</p>
                <p className="text-xs sm:text-sm font-extrabold text-slate-800">{booking.vehicle_number || 'KA-19-F-1204'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Seats Reserved</p>
                <p className="text-xs sm:text-sm font-black text-blue-700">
                  {booking.seats ? booking.seats.join(', ') : 'Assigned'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Paid</p>
                <p className="text-xs sm:text-sm font-black text-emerald-600">₹{booking.total_amount}</p>
              </div>
            </div>

            {/* Passengers List */}
            {booking.passengers && booking.passengers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Passenger(s) Manifest
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {booking.passengers.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{p.passenger_name}</span>
                        <span className="text-slate-400 text-[10px]">({p.passenger_gender})</span>
                      </div>
                      <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Seat {p.seat_number || booking.seats?.[idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security barcode and verification seal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Scan at Bus Entrance</p>
                  <p className="text-[10px] text-slate-400 font-mono">{booking.booking_reference}</p>
                  <span className="inline-block text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 border border-amber-200">
                    {booking.booking_source || 'DEMO BOOKING'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Ticket</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons Below Pass */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/my-bookings"
            className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 shadow-sm transition-all"
          >
            View My Bookings
          </Link>
          <Link
            to="/schedules"
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Book Another Journey</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
