import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Bus, User, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, 
  AlertTriangle, CreditCard, Sparkles, Clock, Calendar, MapPin, XCircle, 
  Smartphone, Wallet, Landmark, Lock, CheckCircle, RefreshCw 
} from 'lucide-react';
import { scheduleService, bookingService, paymentService } from '../api/services';
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
    { passenger_name: user ? user.name : 'Ramesh Rao', passenger_contact: '', passenger_gender: 'MALE' }
  ]);
  const [contactPhone, setContactPhone] = useState('9876543210');
  const [contactEmail, setContactEmail] = useState(user?.email || 'passenger@gmail.com');

  useEffect(() => {
    if (user?.email) {
      setContactEmail(user.email);
    }
    if (user?.name && passengers[0]?.passenger_name === '') {
      setPassengers([{ passenger_name: user.name, passenger_contact: '', passenger_gender: 'MALE' }]);
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState('PAYTM_UPI');
  const [paytmModalOpen, setPaytmModalOpen] = useState(false);
  const [paytmOrderData, setPaytmOrderData] = useState(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(600); // 10 minutes

  // Paytm Sandbox interactive inputs
  const [sandboxUpiVpa, setSandboxUpiVpa] = useState('passenger@paytm');
  const [sandboxUpiPin, setSandboxUpiPin] = useState('123456');
  const [sandboxOtp, setSandboxOtp] = useState('489871');
  const [sandboxBank, setSandboxBank] = useState('State Bank of India');
  const [sandboxCardNum, setSandboxCardNum] = useState('4111 1111 1111 1111');
  const [sandboxCardExpiry, setSandboxCardExpiry] = useState('12/28');
  const [sandboxCardCvv, setSandboxCardCvv] = useState('123');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSeatLayout();
  }, [scheduleId, travelDate]);

  // 10-minute hold countdown timer
  useEffect(() => {
    let timer = null;
    if (paytmModalOpen && holdSecondsLeft > 0) {
      timer = setInterval(() => {
        setHoldSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleCancelPayment('Hold expired after 10 minutes');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [paytmModalOpen, holdSecondsLeft]);

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
    if (seat.status === 'OCCUPIED' || seat.status === 'HELD') return;

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

  const handleInitiatePaytmPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    if (selectedSeatNumbers.length === 0) {
      setErrorMessage('Please select at least one bus seat from the diagram.');
      return;
    }

    // Auto-fill passenger names if blank
    const updatedPassengers = [...passengers];
    for (let i = 0; i < selectedSeatNumbers.length; i++) {
      if (!updatedPassengers[i] || !updatedPassengers[i].passenger_name?.trim()) {
        const fallbackName = user?.name ? (i === 0 ? user.name : `Passenger ${i + 1}`) : `Passenger ${i + 1}`;
        updatedPassengers[i] = {
          ...(updatedPassengers[i] || {}),
          passenger_name: fallbackName,
          passenger_contact: contactPhone.trim(),
          passenger_gender: updatedPassengers[i]?.passenger_gender || 'MALE',
          seat_number: selectedSeatNumbers[i]
        };
      }
    }
    setPassengers(updatedPassengers);

    // Validate mobile number and email address for automatic SMS & Email confirmation
    const cleanPhone = (contactPhone || '').replace(/[\s\-\(\)]/g, '');
    const isPhoneValid = /^(?:(?:\+|0{0,2})91[\s\-]?)?[6789]\d{9}$/.test(cleanPhone) || /^\+?[1-9]\d{9,14}$/.test(cleanPhone);
    if (!contactPhone.trim() || !isPhoneValid) {
      setErrorMessage('Please enter a valid 10-digit mobile number above to receive your SMS booking confirmation.');
      const phoneInput = document.getElementById('contact-phone-input');
      if (phoneInput) phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const isEmailValid = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(contactEmail.trim());
    if (!contactEmail.trim() || !isEmailValid) {
      setErrorMessage('Please enter a valid email address above to receive your confirmation email and digital ticket.');
      const emailInput = document.getElementById('contact-email-input');
      if (emailInput) emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const payload = {
        schedule_id: parseInt(scheduleId, 10),
        travel_date: travelDate,
        seat_numbers: selectedSeatNumbers,
        passenger_phone: contactPhone.trim(),
        passenger_email: contactEmail.trim(),
        passengers: selectedSeatNumbers.map((seatNum, idx) => ({
          passenger_name: updatedPassengers[idx]?.passenger_name || `Passenger ${idx + 1}`,
          passenger_contact: contactPhone.trim(),
          passenger_gender: updatedPassengers[idx]?.passenger_gender || 'MALE',
          seat_number: seatNum
        })),
        amount: totalAmount,
        payment_method: paymentMethod
      };

      const res = await paymentService.initiate(payload);
      if (res.success && res.order_id) {
        setPaytmOrderData(res);
        setHoldSecondsLeft(res.hold_minutes ? res.hold_minutes * 60 : 600);
        setPaytmModalOpen(true);
      } else {
        throw new Error(res.error || 'Failed to initiate Paytm payment session.');
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      setErrorMessage(
        err.message || 'Seat reservation lock failed. Seat might be occupied or held by another commuter. Please refresh.'
      );
      loadSeatLayout();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulatePaytmSuccess = async () => {
    if (!paytmOrderData) return;
    try {
      setProcessingPayment(true);
      setErrorMessage('');

      const callbackPayload = {
        ORDERID: paytmOrderData.order_id,
        MID: paytmOrderData.mid,
        TXNAMOUNT: paytmOrderData.amount.toFixed(2),
        CURRENCY: 'INR',
        STATUS: 'TXN_SUCCESS',
        RESPCODE: '01',
        RESPMSG: 'Txn Successful - Verified by Paytm Sandbox Gateway',
        PAYMENTMODE: paymentMethod,
        CHECKSUMHASH: paytmOrderData.checksum,
        BANKNAME: sandboxBank || 'Paytm Payments Bank / State Bank of India',
        BANKTXNID: `BANK_MGL_${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      };

      const res = await paymentService.callback(callbackPayload);
      if (res.success && res.booking_reference) {
        setPaytmModalOpen(false);
        navigate(`/booking-confirmation/${res.booking_reference}`);
      } else {
        throw new Error(res.error || res.message || 'Payment verification failed.');
      }
    } catch (err) {
      console.error('Paytm callback error:', err);
      setErrorMessage(err.message || 'Payment verification failed.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSimulatePendingPayment = async () => {
    if (!paytmOrderData) return;
    try {
      setProcessingPayment(true);
      setErrorMessage('');

      const callbackPayload = {
        ORDERID: paytmOrderData.order_id,
        MID: paytmOrderData.mid,
        TXNAMOUNT: paytmOrderData.amount.toFixed(2),
        CURRENCY: 'INR',
        STATUS: 'PENDING',
        RESPCODE: '02',
        RESPMSG: 'Payment Pending - Awaiting Bank Acknowledgment',
        PAYMENTMODE: paymentMethod,
        CHECKSUMHASH: paytmOrderData.checksum,
        BANKNAME: sandboxBank || 'State Bank of India'
      };

      const res = await paymentService.callback(callbackPayload);
      if (res.booking_reference) {
        setPaytmModalOpen(false);
        navigate(`/booking-confirmation/${res.booking_reference}`);
      }
    } catch (err) {
      console.error('Paytm pending simulation error:', err);
      setErrorMessage(err.message || 'Payment simulation error.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelPayment = async (reason = 'Cancelled by user') => {
    if (paytmOrderData?.order_id) {
      try {
        await paymentService.callback({
          ORDERID: paytmOrderData.order_id,
          STATUS: 'TXN_FAILURE',
          RESPCODE: '227',
          RESPMSG: reason
        });
      } catch (err) {
        console.warn('Failed to notify backend of cancelled payment:', err);
      }
    }
    setPaytmModalOpen(false);
    setPaytmOrderData(null);
    setErrorMessage(reason === 'Hold expired after 10 minutes' ? 'Seat reservation hold expired. Please select your seats again.' : `Payment cancelled: ${reason}. Your temporary seat hold has been released.`);
    loadSeatLayout();
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
    if (seat.status === 'HELD') {
      return 'bg-amber-100 text-amber-800 border-amber-400 cursor-not-allowed shadow-sm font-semibold opacity-90';
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
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-400" />
                  <span className="text-slate-600">Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded bg-blue-600" />
                  <span className="text-slate-600">Selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400" />
                  <span className="text-amber-800">Held (10m)</span>
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
                Enter passenger information and notification details
              </p>

              {/* Primary Contact for SMS & Email Notifications */}
              {selectedSeatNumbers.length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-[#E8F1FF]/60 border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#0756B8] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      📱
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-[#102B4E]">
                        SMS & Email Notification Details
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Automatic SMS confirmation & digital boarding pass will be dispatched upon payment
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-700 block mb-1">
                        Passenger Mobile Number (for SMS Confirmation) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="contact-phone-input"
                        type="tel"
                        required
                        placeholder="e.g. 9876543210 or +91 98765 43210"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0756B8] bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-700 block mb-1">
                        Passenger Email Address (for Ticket & Receipt) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="contact-email-input"
                        type="email"
                        required
                        placeholder="e.g. passenger@gmail.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0756B8] bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

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

            {/* Payment Method Selector Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
              <h3 className="text-base font-black text-slate-900 mb-2 flex items-center justify-between">
                <span>Select Payment Gateway</span>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Paytm Sandbox
                </span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Choose your preferred payment method. Seats will be held for 10 minutes during checkout.
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PAYTM_UPI')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'PAYTM_UPI'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    {paymentMethod === 'PAYTM_UPI' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">Paytm UPI</span>
                    <span className="text-[10px] text-slate-500">Instant UPI transfer</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('PAYTM_WALLET')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'PAYTM_WALLET'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Wallet className="w-4 h-4 text-cyan-600" />
                    {paymentMethod === 'PAYTM_WALLET' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">Paytm Wallet</span>
                    <span className="text-[10px] text-slate-500">Direct wallet balance</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NET_BANKING')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'NET_BANKING'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Landmark className="w-4 h-4 text-emerald-600" />
                    {paymentMethod === 'NET_BANKING' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">Net Banking</span>
                    <span className="text-[10px] text-slate-500">All major Indian banks</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARDS')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'CARDS'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    {paymentMethod === 'CARDS' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">Debit / Credit</span>
                    <span className="text-[10px] text-slate-500">Visa, RuPay, MC</span>
                  </div>
                </button>
              </div>

              {/* Fare Summary Card */}
              <div className="space-y-2.5 text-xs font-semibold text-slate-600 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span>Base Fare ({selectedSeatNumbers.length || 0} seats × ₹{farePerSeat})</span>
                  <span className="font-bold text-slate-800">₹{totalAmount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Paytm Gateway Charges & GST</span>
                  <span className="text-emerald-600 font-bold">₹0.00 (Sandbox)</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Total Payable</span>
                  <span className="text-2xl font-black text-brand-600">₹{totalAmount}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    10-min Temporary Hold
                  </span>
                </div>
              </div>

              {/* Inline Reservation & Payment Error Notice */}
              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-black text-rose-900">Payment Notice</p>
                    <p className="mt-0.5 font-medium leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleInitiatePaytmPayment}
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
                    <span>Locking Seats & Opening Paytm...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay with Paytm (₹{totalAmount})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center mt-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted • Paytm Checksum Verified</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Paytm Sandbox Checkout Modal */}
      {paytmModalOpen && paytmOrderData && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp my-8">
            
            {/* Paytm Header */}
            <div className="bg-[#002970] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#00b9f5] px-2.5 py-1 rounded-lg text-white font-black text-xs tracking-wider">
                  paytm
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-white">Paytm Payment Gateway</h3>
                  <p className="text-[10px] text-blue-200 font-medium">Sandbox Environment • Secure Simulator</p>
                </div>
              </div>

              {/* Live 10-Minute Lock Countdown */}
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-amber-300 border border-white/10">
                <Clock className="w-3.5 h-3.5" />
                <span>{Math.floor(holdSecondsLeft / 60)}:{(holdSecondsLeft % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            {/* Order Details Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Order ID</span>
                  <span className="font-mono font-bold text-slate-900">{paytmOrderData.order_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Merchant ID (MID)</span>
                  <span className="font-mono font-bold text-slate-900">{paytmOrderData.mid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Seats Locked</span>
                  <span className="font-bold text-blue-700">{selectedSeatNumbers.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Payment Mode</span>
                  <span className="font-bold text-slate-800">{paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-black text-slate-900">Total Payable</span>
                  <span className="font-black text-emerald-600 text-lg">₹{paytmOrderData.amount?.toFixed(2)}</span>
                </div>
              </div>

              {/* Interactive Test Credentials for Selected Payment Method */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#102B4E] uppercase tracking-wider text-[10px]">
                    Paytm Sandbox Test Credentials
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0756B8] font-bold text-[10px]">
                    {paymentMethod.replace('_', ' ')}
                  </span>
                </div>

                {paymentMethod === 'PAYTM_UPI' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Virtual Payment Address (VPA / UPI ID)</label>
                      <input
                        type="text"
                        value={sandboxUpiVpa}
                        onChange={(e) => setSandboxUpiVpa(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">UPI MPIN (Test: 123456)</label>
                      <input
                        type="password"
                        maxLength="6"
                        value={sandboxUpiPin}
                        onChange={(e) => setSandboxUpiPin(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-800 tracking-widest"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'PAYTM_WALLET' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Paytm Linked Mobile</span>
                        <span className="font-mono font-bold text-slate-900">{contactPhone || '9876543210'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">Wallet Balance</span>
                        <span className="font-bold text-emerald-600">₹2,500.00</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Paytm Sandbox Test OTP (Default: 489871)</label>
                      <input
                        type="text"
                        maxLength="6"
                        value={sandboxOtp}
                        onChange={(e) => setSandboxOtp(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-800 tracking-widest"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'NET_BANKING' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Select Bank for Net Banking</label>
                    <select
                      value={sandboxBank}
                      onChange={(e) => setSandboxBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800"
                    >
                      <option value="State Bank of India">State Bank of India (Retail Sandbox)</option>
                      <option value="Canara Bank">Canara Bank (Mangaluru Net Banking)</option>
                      <option value="Karnataka Bank">Karnataka Bank Ltd (Mangaluru Commuter)</option>
                      <option value="HDFC Bank">HDFC Bank Ltd</option>
                      <option value="ICICI Bank">ICICI Bank Ltd</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'CARDS' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Test Card Number</label>
                      <input
                        type="text"
                        value={sandboxCardNum}
                        onChange={(e) => setSandboxCardNum(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Expiry</label>
                        <input
                          type="text"
                          value={sandboxCardExpiry}
                          onChange={(e) => setSandboxCardExpiry(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">CVV</label>
                        <input
                          type="password"
                          maxLength="3"
                          value={sandboxCardCvv}
                          onChange={(e) => setSandboxCardCvv(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Checksum Security Badge */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cryptographic Paytm Checksum Verified</p>
                  <p className="text-[10px] text-blue-700 font-mono break-all mt-0.5">
                    Hash: {paytmOrderData.checksum ? `${paytmOrderData.checksum.slice(0, 32)}...` : 'SHA256_ACTIVE'}
                  </p>
                </div>
              </div>

              {/* Simulation Notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Paytm Sandbox Simulation Mode</p>
                  <p className="text-[10px] text-amber-700">
                    No actual bank account or credit card will be debited. Completing payment verifies transaction checksum with Flask backend and redirects directly to your 3D Thank You page.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {/* 1. Complete Payment (Success) */}
                <button
                  type="button"
                  onClick={handleSimulatePaytmSuccess}
                  disabled={processingPayment}
                  className="w-full py-3.5 rounded-xl bg-[#00b9f5] hover:bg-[#009fd4] text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying with Paytm Server...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Pay ₹{paytmOrderData.amount?.toFixed(2)} with Paytm (Confirm Success)</span>
                    </>
                  )}
                </button>

                {/* 2 & 3. Error and Pending Simulation Options */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCancelPayment('Bank declined payment - Insufficient funds (Simulated)')}
                    disabled={processingPayment}
                    className="py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Simulate Bank Decline
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulatePendingPayment}
                    disabled={processingPayment}
                    className="py-2.5 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Simulate Pending Verification
                  </button>
                </div>

                {/* 4. Cancel & Release */}
                <button
                  type="button"
                  onClick={() => handleCancelPayment('Cancelled by commuter')}
                  disabled={processingPayment}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel & Release Seat Hold
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
