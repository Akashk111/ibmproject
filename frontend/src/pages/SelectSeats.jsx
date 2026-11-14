import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Bus, User, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, 
  AlertTriangle, CreditCard, Sparkles, Clock, Calendar, MapPin, XCircle 
} from 'lucide-react';
import { scheduleService, bookingService } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function SelectSeats() {
  const { scheduleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const travelDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialPassengerCount = parseInt(searchParams.get('passengers') || '1', 10);

  const [schedule, setSchedule] = useState(null);
  const [seatsData, setSeatsData] = useState([]);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState([]);
  const [passengers, setPassengers] = useState([
    { passenger_name: user ? user.name : '', passenger_contact: '', passenger_gender: 'MALE' }
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSeatLayout();
  }, [scheduleId, travelDate]);

  const loadSeatLayout = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      // Fetch schedule info
      const sched = await scheduleService.getById(scheduleId);
      setSchedule(sched);

      // Fetch seat status
      const res = await scheduleService.getSeats(scheduleId, travelDate);
      setSeatsData(res.seats || []);
    } catch (err) {
      console.error('Failed to load seat layout:', err);
      setErrorMessage('Failed to load bus seat layout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'OCCUPIED') return;

    const isSelected = selectedSeatNumbers.includes(seat.seat_number);

    if (isSelected) {
      const updated = selectedSeatNumbers.filter((n) => n !== seat.seat_number);
      setSelectedSeatNumbers(updated);
      // Adjust passengers array
      setPassengers((prev) => prev.slice(0, Math.max(1, updated.length)));
    } else {
      if (selectedSeatNumbers.length >= 6) {
        alert('You can select a maximum of 6 seats per reservation.');
        return;
      }
      const updated = [...selectedSeatNumbers, seat.seat_number];
      setSelectedSeatNumbers(updated);

      // Expand passengers list if needed
      if (updated.length > passengers.length) {
        setPassengers((prev) => [
          ...prev,
          { passenger_name: '', passenger_contact: '', passenger_gender: 'MALE' }
        ]);
      }
    }
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (selectedSeatNumbers.length === 0) {
      setErrorMessage('Please select at least one bus seat.');
      return;
    }

    // Validate passenger names
    for (let i = 0; i < selectedSeatNumbers.length; i++) {
      if (!passengers[i] || !passengers[i].passenger_name.trim()) {
        setErrorMessage(`Please enter the name of passenger for Seat ${selectedSeatNumbers[i]}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const payload = {
        schedule_id: parseInt(scheduleId, 10),
        travel_date: travelDate,
        seat_numbers: selectedSeatNumbers,
        passengers: selectedSeatNumbers.map((seatNum, idx) => ({
          passenger_name: passengers[idx]?.passenger_name || `Passenger ${idx + 1}`,
          passenger_contact: passengers[idx]?.passenger_contact || '',
          passenger_gender: passengers[idx]?.passenger_gender || 'MALE',
          seat_number: seatNum
        }))
      };

      const res = await bookingService.create(payload);
      if (res.booking && res.booking.booking_reference) {
        navigate(`/booking-confirmation/${res.booking.booking_reference}`);
      }
    } catch (err) {
      console.error('Reservation failed:', err);
      // Double booking conflict or validation error
      setErrorMessage(
        err.message || 'Seat reservation failed. Another commuter may have just reserved one of your chosen seats. Please refresh and select again.'
      );
      // Reload layout to show updated occupied seats
      loadSeatLayout();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600">Loading bus seating layout...</p>
        </div>
      </div>
    );
  }

  const farePerSeat = schedule ? schedule.fare : 35.0;
  const totalAmount = farePerSeat * (selectedSeatNumbers.length || 0);

  // Group seats by row (rows 1 to 8)
  const rows = [];
  for (let r = 1; r <= 8; r++) {
    const rowSeats = seatsData.filter((s) => s.row_number === r);
    // Find columns L1 (A), L2 (B), R1 (C), R2 (D)
    const l1 = rowSeats.find((s) => s.column_position === 'L1') || { seat_number: `${r}A`, status: 'AVAILABLE' };
    const l2 = rowSeats.find((s) => s.column_position === 'L2') || { seat_number: `${r}B`, status: 'AVAILABLE' };
    const r1 = rowSeats.find((s) => s.column_position === 'R1') || { seat_number: `${r}C`, status: 'AVAILABLE' };
    const r2 = rowSeats.find((s) => s.column_position === 'R2') || { seat_number: `${r}D`, status: 'AVAILABLE' };
    rows.push({ rowNumber: r, l1, l2, r1, r2 });
  }

  const getSeatStyle = (seat) => {
    const isSelected = selectedSeatNumbers.includes(seat.seat_number);
    if (isSelected) {
      return 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/30 scale-105';
    }
    if (seat.status === 'OCCUPIED') {
      return 'bg-slate-300 text-slate-500 border-slate-300 cursor-not-allowed opacity-60';
    }
    // Available
    return 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Schedules</span>
          </button>

          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            DEMO SEAT RESERVATION SYSTEM
          </span>
        </div>

        {/* Schedule Summary Banner */}
        {schedule && (
          <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-extrabold uppercase">
                  Route {schedule.route_code || '1A'}
                </span>
                <span className="text-xs text-slate-300">
                  {schedule.vehicle_name} ({schedule.vehicle_number})
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {schedule.departure_stop_name} ➔ {schedule.destination_stop_name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Operated by {schedule.operator} • {schedule.vehicle_type}
              </p>
            </div>

            <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
              <div>
                <p className="text-[10px] font-bold text-slate-300 uppercase">Travel Date</p>
                <p className="text-sm font-extrabold text-white flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-300" />
                  {travelDate}
                </p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-[10px] font-bold text-slate-300 uppercase">Departure</p>
                <p className="text-sm font-extrabold text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-300" />
                  {schedule.departure_time}
                </p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-[10px] font-bold text-slate-300 uppercase">Fare / Seat</p>
                <p className="text-sm font-black text-amber-300">₹{schedule.fare}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Reservation Notice</p>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main Grid: Seat Layout (Left) + Passenger Form (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Seat Layout (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Select Your Seats</h2>
                <p className="text-xs text-slate-500">Click to pick seats (2x2 City Bus Layout)</p>
              </div>

              {/* Color Legend */}
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-400" />
                  <span className="text-slate-600">Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded bg-blue-600" />
                  <span className="text-slate-600">Selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded bg-slate-300" />
                  <span className="text-slate-600">Occupied</span>
                </div>
              </div>
            </div>

            {/* Realistic Bus Cabin Container */}
            <div className="max-w-md mx-auto bg-slate-100/80 rounded-3xl p-6 border-2 border-slate-300 relative shadow-inner">
              
              {/* Front of Bus Header (Driver & Door) */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b-2 border-dashed border-slate-300">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200 text-slate-600 text-xs font-bold">
                  <span>Front Door 🚪</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold shadow-sm">
                  <span>Driver 👨‍✈️</span>
                </div>
              </div>

              {/* Windshield indicator */}
              <div className="w-full text-center mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  ▲ FRONT OF BUS ▲
                </span>
              </div>

              {/* Rows 1 to 8 */}
              <div className="space-y-3.5">
                {rows.map(({ rowNumber, l1, l2, r1, r2 }) => (
                  <div key={rowNumber} className="flex items-center justify-between gap-3">
                    
                    {/* Left Pair (A & B) */}
                    <div className="flex items-center gap-2">
                      {/* Window L1 */}
                      <button
                        type="button"
                        onClick={() => handleSeatClick(l1)}
                        className={`w-11 h-11 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center ${getSeatStyle(l1)}`}
                      >
                        <span>{l1.seat_number}</span>
                        <span className="text-[8px] font-normal opacity-70">Win</span>
                      </button>

                      {/* Aisle L2 */}
                      <button
                        type="button"
                        onClick={() => handleSeatClick(l2)}
                        className={`w-11 h-11 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center ${getSeatStyle(l2)}`}
                      >
                        <span>{l2.seat_number}</span>
                        <span className="text-[8px] font-normal opacity-70">Ais</span>
                      </button>
                    </div>

                    {/* Center Gangway / Aisle Walkway */}
                    <div className="w-8 flex items-center justify-center text-slate-300 font-mono text-xs select-none">
                      {rowNumber}
                    </div>

                    {/* Right Pair (C & D) */}
                    <div className="flex items-center gap-2">
                      {/* Aisle R1 */}
                      <button
                        type="button"
                        onClick={() => handleSeatClick(r1)}
                        className={`w-11 h-11 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center ${getSeatStyle(r1)}`}
                      >
                        <span>{r1.seat_number}</span>
                        <span className="text-[8px] font-normal opacity-70">Ais</span>
                      </button>

                      {/* Window R2 */}
                      <button
                        type="button"
                        onClick={() => handleSeatClick(r2)}
                        className={`w-11 h-11 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center ${getSeatStyle(r2)}`}
                      >
                        <span>{r2.seat_number}</span>
                        <span className="text-[8px] font-normal opacity-70">Win</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Rear of bus */}
              <div className="w-full text-center mt-6 pt-4 border-t-2 border-dashed border-slate-300">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  ▼ REAR OF BUS ▼
                </span>
              </div>

            </div>

          </div>

          {/* Passenger Details & Booking Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Passenger Information Form */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
              <h2 className="text-lg font-black text-slate-900 mb-1">
                Passenger Details
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Enter details for each reserved seat
              </p>

              {selectedSeatNumbers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">Please select a seat from the bus diagram</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSeatNumbers.map((seatNum, idx) => (
                    <div key={seatNum} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          Seat {seatNum}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          Passenger {idx + 1}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <input
                          type="text"
                          required
                          placeholder="Full Name (e.g. Ramesh Shenoy)"
                          value={passengers[idx]?.passenger_name || ''}
                          onChange={(e) => handlePassengerChange(idx, 'passenger_name', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="tel"
                            placeholder="Mobile (Optional)"
                            value={passengers[idx]?.passenger_contact || ''}
                            onChange={(e) => handlePassengerChange(idx, 'passenger_contact', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                          />

                          <select
                            value={passengers[idx]?.passenger_gender || 'MALE'}
                            onChange={(e) => handlePassengerChange(idx, 'passenger_gender', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fare Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
              <h3 className="text-base font-black text-slate-900 mb-4">Fare Breakdown</h3>
              
              <div className="space-y-2.5 text-xs font-semibold text-slate-600 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span>Base Fare ({selectedSeatNumbers.length || 0} seats × ₹{farePerSeat})</span>
                  <span className="font-bold text-slate-800">₹{totalAmount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Service Charges & GST</span>
                  <span className="text-emerald-600 font-bold">FREE (Demo)</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-4">
                <span className="text-sm font-black text-slate-900">Total Payable</span>
                <span className="text-2xl font-black text-brand-600">₹{totalAmount}</span>
              </div>

              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={submitting || selectedSeatNumbers.length === 0}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  submitting || selectedSeatNumbers.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/30 hover:scale-[1.02]'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Reserving Seats...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Book ({selectedSeatNumbers.length} Seats)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-3">
                Instant confirmation • No payment gateway required for demo
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
