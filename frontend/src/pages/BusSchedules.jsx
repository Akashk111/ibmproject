import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, Clock, Users, Bus, ArrowRight, Search, ShieldCheck, 
  MapPin, CheckCircle, AlertCircle, Info, Sparkles 
} from 'lucide-react';
import { scheduleService, stopService } from '../api/services';

export default function BusSchedules() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [stops, setStops] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dateShortcut, setDateShortcut] = useState('today');
  const [originStopId, setOriginStopId] = useState('');
  const [destinationStopId, setDestinationStopId] = useState('');
  const [passengersCount, setPassengersCount] = useState(1);
  const [timeFilter, setTimeFilter] = useState('ALL');

  useEffect(() => {
    loadStops();
    fetchSchedules(todayStr);
  }, []);

  const loadStops = async () => {
    try {
      const data = await stopService.getAll();
      setStops(data.stops || []);
    } catch (err) {
      console.error('Failed to load stops:', err);
    }
  };

  const fetchSchedules = async (date) => {
    try {
      setLoading(true);
      const res = await scheduleService.search(
        originStopId || null,
        destinationStopId || null,
        date || selectedDate,
        null
      );
      setSchedules(res.schedules || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateShortcut = (type) => {
    setDateShortcut(type);
    const d = new Date();
    if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    const dStr = d.toISOString().split('T')[0];
    setSelectedDate(dStr);
    fetchSchedules(dStr);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSchedules(selectedDate);
  };

  const filteredSchedules = schedules.filter((s) => {
    if (timeFilter === 'ALL') return true;
    const hour = parseInt(s.departure_time.split(':')[0], 10);
    if (timeFilter === 'MORNING') return hour >= 6 && hour < 12;
    if (timeFilter === 'AFTERNOON') return hour >= 12 && hour < 17;
    if (timeFilter === 'EVENING') return hour >= 17 && hour < 22;
    return true;
  });

  const handleSelectSeats = (scheduleId) => {
    navigate(`/book-seats/${scheduleId}?date=${selectedDate}&passengers=${passengersCount}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5" />
            Timetable & Advance Seat Booking
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Mangaluru Bus Schedules & Seat Reservation
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">
            Choose your travel date, view upcoming departures, check seat availability, and reserve your seats online.
          </p>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 mb-10">
          <form onSubmit={handleSearchSubmit} className="space-y-6">
            
            {/* Date Shortcuts */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Travel Date:
                </span>
                <button
                  type="button"
                  onClick={() => handleDateShortcut('today')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    dateShortcut === 'today'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDateShortcut('tomorrow')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    dateShortcut === 'tomorrow'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tomorrow
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setDateShortcut('custom');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Inputs: From, To, Passengers */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Boarding Terminal (From)
                </label>
                <select
                  value={originStopId}
                  onChange={(e) => setOriginStopId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Terminals / Any Origin</option>
                  {stops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'STOP'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Destination Terminal (To)
                </label>
                <select
                  value={destinationStopId}
                  onChange={(e) => setDestinationStopId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Terminals / Any Destination</option>
                  {stops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'STOP'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Passengers
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <select
                    value={passengersCount}
                    onChange={(e) => setPassengersCount(parseInt(e.target.value, 10))}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Passenger' : 'Passengers'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Schedules</span>
                </button>
              </div>
            </div>

            {/* Time Slot Tabs */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs font-bold text-slate-500 mr-2">Time Slot:</span>
              {[
                { id: 'ALL', label: 'All Departures' },
                { id: 'MORNING', label: 'Morning (06:00 - 12:00)' },
                { id: 'AFTERNOON', label: 'Afternoon (12:00 - 17:00)' },
                { id: 'EVENING', label: 'Evening (17:00 - 22:00)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    timeFilter === t.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

          </form>
        </div>

        {/* Schedule Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Available Bus Departures ({filteredSchedules.length})
            </h2>
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>Date: {selectedDate}</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-6 h-36 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
              <Bus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No schedules found</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                No matching departures for this route and date. Try selecting another date or viewing all terminals.
              </p>
              <button
                onClick={() => { setOriginStopId(''); setDestinationStopId(''); setTimeFilter('ALL'); fetchSchedules(selectedDate); }}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSchedules.map((sched) => (
                <div
                  key={sched.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                >
                  {/* Left: Bus & Route Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-blue-800 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md">
                      <Bus className="w-6 h-6" />
                      <span className="text-[10px] font-black tracking-tight mt-0.5">
                        {sched.route_code || 'BUS'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                          {sched.vehicle_type || 'Coastal City Bus'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {sched.vehicle_number}
                        </span>
                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          DEMO SEAT RESERVATION
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        {sched.route_name || `${sched.departure_stop_name} to ${sched.destination_stop_name}`}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Operator: <span className="font-semibold text-slate-700">{sched.operator}</span>
                      </p>
                    </div>
                  </div>

                  {/* Middle: Departure -> Duration -> Arrival */}
                  <div className="flex items-center gap-5 sm:gap-8 bg-slate-50/80 px-5 py-3 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Departure</p>
                      <p className="text-base sm:text-lg font-black text-slate-900">{sched.departure_time}</p>
                      <p className="text-xs font-semibold text-slate-600 truncate max-w-[110px]">
                        {sched.departure_stop_name}
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 mb-1">
                        {sched.estimated_duration_minutes} mins
                      </span>
                      <div className="w-16 sm:w-20 h-0.5 bg-slate-300 relative flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-brand-500 absolute -top-[3px]" />
                      </div>
                      <span className="text-[9px] font-semibold text-emerald-600 mt-1">Direct</span>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Arrival</p>
                      <p className="text-base sm:text-lg font-black text-slate-900">{sched.arrival_time}</p>
                      <p className="text-xs font-semibold text-slate-600 truncate max-w-[110px]">
                        {sched.destination_stop_name}
                      </p>
                    </div>
                  </div>

                  {/* Right: Seats & Booking Action */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <div className="text-xl font-black text-slate-900">
                        ₹{sched.fare}
                        <span className="text-xs font-semibold text-slate-400 ml-1">/seat</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${sched.available_seats > 5 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-xs font-bold text-slate-700">
                          {sched.available_seats} of {sched.total_seats} seats left
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectSeats(sched.id)}
                      className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all hover:scale-105 flex-shrink-0"
                    >
                      <span>Select Seats</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
