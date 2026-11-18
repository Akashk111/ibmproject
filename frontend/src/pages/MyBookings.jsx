import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Ticket, Search, Bus, Calendar, Clock, MapPin, XCircle, 
  CheckCircle, AlertTriangle, ArrowRight, Eye, ShieldCheck 
} from 'lucide-react';
import { bookingService } from '../api/services';

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchRef, setSearchRef] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [tabFilter, setTabFilter] = useState('ALL'); // 'ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async (ref = '') => {
    try {
      setLoading(true);
      const data = await bookingService.getMyBookings(ref);
      setBookings(data || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadBookings(searchRef);
  };

  const handleCancelBooking = async (bookingId, bookingRef) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel booking ${bookingRef}? Your reserved seats will be released for other commuters.`
    );
    if (!confirmed) return;

    try {
      setCancellingId(bookingId);
      const res = await bookingService.cancel(bookingId);
      setStatusMessage(res.message || 'Booking cancelled successfully.');
      // Refresh bookings
      loadBookings(searchRef);
    } catch (err) {
      console.error('Cancellation failed:', err);
      alert(err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Ticket className="w-3.5 h-3.5" />
              Commuter Portal
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              My Bus Reservations
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              View your digital tickets, manage upcoming journeys, and cancel reservations.
            </p>
          </div>

          <Link
            to="/schedules"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 self-start sm:self-auto transition-transform hover:scale-105"
          >
            <span>Book New Ticket</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Search by Reference Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Booking Reference (e.g. MBC-MGL-XXXXXX)"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-2xl transition-colors shadow-sm"
            >
              Search
            </button>
            {searchRef && (
              <button
                type="button"
                onClick={() => { setSearchRef(''); loadBookings(''); }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs sm:text-sm rounded-2xl"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Phase 4 Status Filter Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setTabFilter('ALL')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              tabFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('UPCOMING')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              tabFilter === 'UPCOMING' ? 'bg-white text-blue-700 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Upcoming ({bookings.filter(b => b.booking_status !== 'CANCELLED').length})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('COMPLETED')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              tabFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('CANCELLED')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              tabFilter === 'CANCELLED' ? 'bg-white text-rose-700 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Cancelled ({bookings.filter(b => b.booking_status === 'CANCELLED').length})
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-6 h-36 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
            <Ticket className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No reservations found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
              You haven't made any seat reservations yet. Search bus schedules and book your seats in advance.
            </p>
            <Link
              to="/schedules"
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs"
            >
              Browse Bus Schedules
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {bookings
              .filter(b => {
                if (tabFilter === 'CANCELLED') return b.booking_status === 'CANCELLED';
                if (tabFilter === 'UPCOMING') return b.booking_status !== 'CANCELLED';
                return true;
              })
              .map((b) => {
                const isCancelled = b.booking_status === 'CANCELLED';
                return (
                  <div
                    key={b.id}
                    className={`bg-white rounded-3xl p-6 border transition-all duration-300 shadow-md hover:shadow-xl ${
                      isCancelled ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-slate-200/90'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      
                      {/* Left: Info */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {b.booking_reference}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              isCancelled
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {b.booking_status}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {b.payment_status || (isCancelled ? 'REFUNDED' : 'PAID (Paytm)')}
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                          {b.departure_stop_name} ➔ {b.destination_stop_name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-brand-600" />
                            {b.travel_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-brand-600" />
                            Dep: {b.departure_time}
                          </span>
                          {b.expected_arrival_time && (
                            <span className="flex items-center gap-1 text-emerald-700 font-bold">
                              ETA: {b.expected_arrival_time}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Bus className="w-3.5 h-3.5 text-brand-600" />
                            Route {b.route_code || '1A'} ({b.vehicle_number || 'KA-19'})
                          </span>
                          {b.distance_km && (
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {b.distance_km} KM
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Seats & Amount */}
                      <div className="flex items-center gap-6 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400">Seats</p>
                          <p className="text-sm font-black text-blue-700">
                            {b.seats && b.seats.length > 0 ? b.seats.join(', ') : 'Assigned'}
                          </p>
                        </div>
                        <div className="w-px h-6 bg-slate-200" />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400">Amount</p>
                          <p className="text-sm font-black text-emerald-600">₹{b.total_amount}</p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <button
                          onClick={() => navigate(`/booking-confirmation/${b.booking_reference}`)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pass</span>
                        </button>

                        <button
                          onClick={() => navigate(`/verify-ticket/${b.booking_reference}`)}
                          className="px-3 py-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs flex items-center gap-1 transition-colors"
                          title="Conductor QR Verification Check"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Verify</span>
                        </button>

                        {!isCancelled && (
                          <button
                            onClick={() => handleCancelBooking(b.id, b.booking_reference)}
                            disabled={cancellingId === b.id}
                            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{cancellingId === b.id ? 'Refunding...' : 'Cancel & Refund'}</span>
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
          </div>
        )}

      </div>
    </div>
  );
}
