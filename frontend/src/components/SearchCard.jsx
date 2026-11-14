import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, MapPin, Clock, Calendar, AlertCircle, Crosshair, Navigation, Footprints, X } from 'lucide-react';
import { stopService } from '../api/services';
import { getCurrentPosition, findNearestStops } from '../utils/geo';

const POPULAR_STOPS = [
  'Hampankatta',
  'State Bank',
  'Kankanady',
  'Pumpwell',
  'Kadri',
  'Bejai',
  'Lalbagh',
  'Urwa Market',
  'Mangaluru Central',
  'Surathkal'
];

export default function SearchCard({ initialSource = '', initialDest = '', onSearch = null, compact = false }) {
  const [stops, setStops] = useState([]);
  const [sourceInput, setSourceInput] = useState(initialSource);
  const [destInput, setDestInput] = useState(initialDest);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedDest, setSelectedDest] = useState(null);

  const [sourceOpen, setSourceOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);

  // Geolocation states
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [geoNotice, setGeoNotice] = useState(null);

  // Time & Day
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const [departureTime, setDepartureTime] = useState(`${currentHours}:${currentMinutes}`);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [dayOfWeek, setDayOfWeek] = useState(days[now.getDay()]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const sourceRef = useRef(null);
  const destRef = useRef(null);

  useEffect(() => {
    async function fetchStops() {
      try {
        const res = await stopService.getAll();
        setStops(res.stops || []);

        if (initialSource) {
          const s = res.stops.find(x => x.name.toLowerCase() === initialSource.toLowerCase());
          if (s) {
            setSelectedSource(s);
            setSourceInput(s.name);
          }
        }
        if (initialDest) {
          const d = res.stops.find(x => x.name.toLowerCase() === initialDest.toLowerCase());
          if (d) {
            setSelectedDest(d);
            setDestInput(d.name);
          }
        }
      } catch (err) {
        console.error('Failed to load stops:', err);
      }
    }
    fetchStops();
  }, [initialSource, initialDest]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (sourceRef.current && !sourceRef.current.contains(event.target)) {
        setSourceOpen(false);
      }
      if (destRef.current && !destRef.current.contains(event.target)) {
        setDestOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Geolocation
  const handleUseMyLocation = async () => {
    setLocating(true);
    setError('');
    setGeoNotice(null);

    try {
      const coords = await getCurrentPosition();
      setUserLocation(coords);

      if (stops.length > 0) {
        const nearest = findNearestStops(coords, stops, 4);
        setNearbyStops(nearest);

        if (nearest.length > 0) {
          const closest = nearest[0];
          setSelectedSource(closest);
          setSourceInput(closest.name);
          setGeoNotice({
            stopName: closest.name,
            distance: closest.formattedDistance,
            walk: closest.walkingTime,
          });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  const handleSwap = () => {
    const tempInput = sourceInput;
    const tempStop = selectedSource;
    setSourceInput(destInput);
    setSelectedSource(selectedDest);
    setDestInput(tempInput);
    setSelectedDest(tempStop);
    setError('');
  };

  const filteredSourceStops = stops.filter(s =>
    s.name.toLowerCase().includes(sourceInput.toLowerCase())
  );

  const filteredDestStops = stops.filter(s =>
    s.name.toLowerCase().includes(destInput.toLowerCase())
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setError('');

    let finalSource = selectedSource;
    let finalDest = selectedDest;

    if (!finalSource && sourceInput.trim()) {
      finalSource = stops.find(s => s.name.toLowerCase() === sourceInput.trim().toLowerCase());
    }
    if (!finalDest && destInput.trim()) {
      finalDest = stops.find(s => s.name.toLowerCase() === destInput.trim().toLowerCase());
    }

    if (!finalSource) {
      setError('Please select a valid starting bus stop from the list or click "Use My Location".');
      return;
    }
    if (!finalDest) {
      setError('Please select a valid destination bus stop from the list.');
      return;
    }
    if (finalSource.id === finalDest.id) {
      setError('Starting point and destination cannot be the same bus stop.');
      return;
    }

    if (onSearch) {
      onSearch({
        sourceStop: finalSource,
        destStop: finalDest,
        departureTime,
        dayOfWeek,
        userLocation
      });
    } else {
      navigate('/journey-results', {
        state: {
          sourceId: finalSource.id,
          destId: finalDest.id,
          sourceName: finalSource.name,
          destName: finalDest.name,
          departureTime,
          dayOfWeek,
          userLocation
        }
      });
    }
  };

  const handleSelectQuickStop = (stopName, isSource = false) => {
    const matched = stops.find(s => s.name.toLowerCase() === stopName.toLowerCase());
    if (!matched) return;

    if (isSource || !selectedSource) {
      setSelectedSource(matched);
      setSourceInput(matched.name);
    } else {
      setSelectedDest(matched);
      setDestInput(matched.name);
    }
    setError('');
  };

  return (
    <div className={`bg-white rounded-3xl shadow-2xl border border-slate-100 ${compact ? 'p-4 sm:p-6' : 'p-6 sm:p-8'} relative`}>
      
      {/* Geolocation Notice Banner */}
      {geoNotice && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Nearest stop: <strong className="font-bold">{geoNotice.stopName}</strong> (~{geoNotice.distance}, {geoNotice.walk}) selected as starting point.
            </span>
          </div>
          <button onClick={() => setGeoNotice(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Geolocation Quick Trigger Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 hover:bg-blue-100 text-brand-700 border border-brand-200 shadow-sm transition-all hover:scale-105 active:scale-95"
        >
          <Crosshair className={`w-3.5 h-3.5 text-brand-600 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'Detecting GPS location...' : 'Use My Current Location'}</span>
        </button>

        {nearbyStops.length > 1 && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-medium">Other nearby:</span>
            {nearbyStops.slice(1, 3).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedSource(st);
                  setSourceInput(st.name);
                }}
                className="underline hover:text-brand-600 font-semibold"
              >
                {st.name} ({st.formattedDistance})
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSearchSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Source Stop */}
          <div className="md:col-span-5 relative" ref={sourceRef}>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              From (Starting Stop)
            </label>
            <div className="relative">
              <input
                type="text"
                value={sourceInput}
                onChange={(e) => {
                  setSourceInput(e.target.value);
                  setSelectedSource(null);
                  setSourceOpen(true);
                  setError('');
                }}
                onFocus={() => setSourceOpen(true)}
                placeholder="e.g. Hampankatta or State Bank"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900"
              />
              <MapPin className="w-5 h-5 text-emerald-600 absolute left-3 top-3.5" />
            </div>

            {/* Dropdown suggestions */}
            {sourceOpen && (
              <ul className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl py-1 text-sm">
                {filteredSourceStops.length > 0 ? (
                  filteredSourceStops.map((stop) => (
                    <li
                      key={stop.id}
                      onClick={() => {
                        setSelectedSource(stop);
                        setSourceInput(stop.name);
                        setSourceOpen(false);
                      }}
                      className="px-4 py-2.5 hover:bg-brand-50 hover:text-brand-700 cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800">{stop.name}</span>
                      <span className="text-xs text-slate-400 truncate max-w-[150px]">{stop.location_description}</span>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-xs text-slate-500 text-center">
                    No matching bus stop found
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center -my-2 md:my-0">
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 rounded-full bg-slate-100 hover:bg-brand-100 text-slate-600 hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition-all shadow-sm hover:scale-110 active:scale-95"
              title="Swap From and To locations"
              aria-label="Swap locations"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* Destination Stop */}
          <div className="md:col-span-5 relative" ref={destRef}>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              To (Destination Stop)
            </label>
            <div className="relative">
              <input
                type="text"
                value={destInput}
                onChange={(e) => {
                  setDestInput(e.target.value);
                  setSelectedDest(null);
                  setDestOpen(true);
                  setError('');
                }}
                onFocus={() => setDestOpen(true)}
                placeholder="e.g. Kadri or Surathkal"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900"
              />
              <MapPin className="w-5 h-5 text-rose-600 absolute left-3 top-3.5" />
            </div>

            {/* Dropdown suggestions */}
            {destOpen && (
              <ul className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl py-1 text-sm">
                {filteredDestStops.length > 0 ? (
                  filteredDestStops.map((stop) => (
                    <li
                      key={stop.id}
                      onClick={() => {
                        setSelectedDest(stop);
                        setDestInput(stop.name);
                        setDestOpen(false);
                      }}
                      className="px-4 py-2.5 hover:bg-brand-50 hover:text-brand-700 cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800">{stop.name}</span>
                      <span className="text-xs text-slate-400 truncate max-w-[150px]">{stop.location_description}</span>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-xs text-slate-500 text-center">
                    No matching bus stop found
                  </li>
                )}
              </ul>
            )}
          </div>

        </div>

        {/* Time and Day Selection Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 mt-5 pt-4 border-t border-slate-100 items-center">
          
          <div className="md:col-span-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="w-full">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Departure Time
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
              />
            </div>
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="w-full">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Day of Travel
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
              >
                <option value="Mon">Monday</option>
                <option value="Tue">Tuesday</option>
                <option value="Wed">Wednesday</option>
                <option value="Thu">Thursday</option>
                <option value="Fri">Friday</option>
                <option value="Sat">Saturday</option>
                <option value="Sun">Sunday</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-4 sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 sm:mt-0 py-3.5 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand-600 via-blue-600 to-navy-900 hover:from-brand-700 hover:to-navy-950 shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base active:scale-[0.99]"
            >
              <Search className="w-5 h-5" />
              <span>Search Buses</span>
            </button>
          </div>

        </div>

      </form>

      {/* Commonly Searched Destinations Chips */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wider mr-1">
          Popular Mangaluru Hubs:
        </span>
        <div className="inline-flex flex-wrap gap-1.5">
          {POPULAR_STOPS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleSelectQuickStop(st, false)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 transition-colors border border-slate-200"
            >
              + {st}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
