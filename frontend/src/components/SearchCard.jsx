import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ArrowUpDown, MapPin, Clock, Calendar, AlertCircle, 
  Crosshair, Footprints, X, Loader2, Building2, CheckCircle2 
} from 'lucide-react';
import { stopService } from '../api/services';
import { getCurrentPosition } from '../utils/geo';

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
  // Source states
  const [sourceInput, setSourceInput] = useState(initialSource);
  const [selectedSource, setSelectedSource] = useState(null);
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceCursor, setSourceCursor] = useState(-1);

  // Dest states
  const [destInput, setDestInput] = useState(initialDest);
  const [selectedDest, setSelectedDest] = useState(null);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destLoading, setDestLoading] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [destCursor, setDestCursor] = useState(-1);

  // Geolocation states
  const [locating, setLocating] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [geoNotice, setGeoNotice] = useState(null);

  // Departure Time & Travel Date
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
  const sourceDebounceRef = useRef(null);
  const destDebounceRef = useRef(null);

  // Initial load
  useEffect(() => {
    async function initStops() {
      if (initialSource) {
        try {
          const res = await stopService.searchPlaces(initialSource);
          const match = res.results?.find(r => r.name.toLowerCase() === initialSource.toLowerCase());
          if (match) setSelectedSource(match);
        } catch (e) {}
      }
      if (initialDest) {
        try {
          const res = await stopService.searchPlaces(initialDest);
          const match = res.results?.find(r => r.name.toLowerCase() === initialDest.toLowerCase());
          if (match) setSelectedDest(match);
        } catch (e) {}
      }
    }
    initStops();
  }, [initialSource, initialDest]);

  // Click outside to dismiss dropdowns
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

  // Intelligent place search with fallback to Nominatim
  const searchPlacesDebounced = async (query, setSuggestions, setLoadingState) => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      setLoadingState(false);
      return;
    }

    setLoadingState(true);
    try {
      // 1. Backend database verified stops & landmarks
      const backendRes = await stopService.searchPlaces(query);
      let results = backendRes.results || [];

      // 2. If fewer than 2 results and query is at least 3 chars, query Nominatim bounded to Mangaluru
      if (results.length < 2 && query.trim().length >= 3) {
        try {
          // Bounding box for Mangaluru: [74.75, 12.75, 75.00, 13.05]
          const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Mangalore')}&format=json&viewbox=74.75,13.05,75.00,12.75&bounded=1&limit=4`;
          const nomRes = await fetch(nomUrl, {
            headers: { 'Accept': 'application/json' }
          }).then(r => r.json());

          if (nomRes && Array.isArray(nomRes)) {
            const nomItems = nomRes.map(item => ({
              id: `nom_${item.place_id}`,
              name: item.display_name.split(',')[0],
              location_description: item.display_name,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              type: 'EXTERNAL_PLACE',
              is_external: true
            }));
            results = [...results, ...nomItems];
          }
        } catch (nomErr) {
          // Ignore external geocoding failures gracefully
        }
      }

      setSuggestions(results);
    } catch (err) {
      console.error('Place search error:', err);
    } finally {
      setLoadingState(false);
    }
  };

  const handleSourceChange = (val) => {
    setSourceInput(val);
    setSelectedSource(null);
    setSourceOpen(true);
    setSourceCursor(-1);
    setError('');

    if (sourceDebounceRef.current) clearTimeout(sourceDebounceRef.current);
    sourceDebounceRef.current = setTimeout(() => {
      searchPlacesDebounced(val, setSourceSuggestions, setSourceLoading);
    }, 280);
  };

  const handleDestChange = (val) => {
    setDestInput(val);
    setSelectedDest(null);
    setDestOpen(true);
    setDestCursor(-1);
    setError('');

    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
    destDebounceRef.current = setTimeout(() => {
      searchPlacesDebounced(val, setDestSuggestions, setDestLoading);
    }, 280);
  };

  const selectSourceItem = async (item) => {
    // If external place without matched stop, fetch nearby verified stop
    let finalItem = item;
    if (item.type === 'EXTERNAL_PLACE' || !item.matched_stop_id) {
      try {
        const nearby = await stopService.getNearby(item.latitude, item.longitude, 1);
        if (nearby.nearest_stops && nearby.nearest_stops.length > 0) {
          const closest = nearby.nearest_stops[0];
          finalItem = {
            ...item,
            matched_stop_id: closest.id,
            matched_stop_name: closest.name,
            matched_stop_dist: closest.formatted_distance,
            matched_stop_walk: closest.walking_time_label
          };
          setGeoNotice({
            msg: `Matched "${item.name}" to nearest bus stop: ${closest.name} (${closest.walking_time_label})`
          });
        }
      } catch (e) {}
    }

    setSelectedSource(finalItem);
    setSourceInput(finalItem.name);
    setSourceOpen(false);
  };

  const selectDestItem = async (item) => {
    let finalItem = item;
    if (item.type === 'EXTERNAL_PLACE' || !item.matched_stop_id) {
      try {
        const nearby = await stopService.getNearby(item.latitude, item.longitude, 1);
        if (nearby.nearest_stops && nearby.nearest_stops.length > 0) {
          const closest = nearby.nearest_stops[0];
          finalItem = {
            ...item,
            matched_stop_id: closest.id,
            matched_stop_name: closest.name,
            matched_stop_dist: closest.formatted_distance,
            matched_stop_walk: closest.walking_time_label
          };
        }
      } catch (e) {}
    }

    setSelectedDest(finalItem);
    setDestInput(finalItem.name);
    setDestOpen(false);
  };

  // Keyboard navigation for dropdowns
  const handleKeyDownSource = (e) => {
    if (!sourceOpen || sourceSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSourceCursor(prev => (prev < sourceSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSourceCursor(prev => (prev > 0 ? prev - 1 : sourceSuggestions.length - 1));
    } else if (e.key === 'Enter' && sourceCursor >= 0) {
      e.preventDefault();
      selectSourceItem(sourceSuggestions[sourceCursor]);
    } else if (e.key === 'Escape') {
      setSourceOpen(false);
    }
  };

  const handleKeyDownDest = (e) => {
    if (!destOpen || destSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestCursor(prev => (prev < destSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestCursor(prev => (prev > 0 ? prev - 1 : destSuggestions.length - 1));
    } else if (e.key === 'Enter' && destCursor >= 0) {
      e.preventDefault();
      selectDestItem(destSuggestions[destCursor]);
    } else if (e.key === 'Escape') {
      setDestOpen(false);
    }
  };

  // Geolocation trigger
  const handleUseMyLocation = async () => {
    setLocating(true);
    setError('');
    setGeoNotice(null);

    try {
      const coords = await getCurrentPosition();
      setUserCoords(coords);

      // Call backend `/api/stops/nearby`
      const nearbyRes = await stopService.getNearby(coords.latitude, coords.longitude, 4);
      const stops = nearbyRes.nearest_stops || [];
      setNearbyStops(stops);

      if (stops.length > 0) {
        const closest = stops[0];
        const sourceItem = {
          id: closest.id,
          name: closest.name,
          location_description: closest.location_description,
          latitude: closest.latitude,
          longitude: closest.longitude,
          matched_stop_id: closest.id,
          matched_stop_name: closest.name,
          type: 'BUS_STOP'
        };
        setSelectedSource(sourceItem);
        setSourceInput(closest.name);
        setGeoNotice({
          msg: `GPS located: "${closest.name}" is your closest stop (~${closest.formatted_distance}, ${closest.walking_time_label}). Selected as starting point!`
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  const handleSwap = () => {
    const tempInput = sourceInput;
    const tempSelected = selectedSource;
    setSourceInput(destInput);
    setSelectedSource(selectedDest);
    setDestInput(tempInput);
    setSelectedDest(tempSelected);
    setError('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setError('');

    const sourceStopId = selectedSource?.matched_stop_id || selectedSource?.id;
    const destStopId = selectedDest?.matched_stop_id || selectedDest?.id;

    if (!sourceStopId) {
      setError('Please choose a valid starting bus stop or landmark from the suggestions.');
      return;
    }
    if (!destStopId) {
      setError('Please choose a valid destination bus stop or landmark from the suggestions.');
      return;
    }
    if (sourceStopId === destStopId) {
      setError('Starting point and destination cannot be the same bus stop.');
      return;
    }

    const payload = {
      sourceId: sourceStopId,
      destId: destStopId,
      sourceName: selectedSource.matched_stop_name || selectedSource.name,
      destName: selectedDest.matched_stop_name || selectedDest.name,
      departureTime,
      dayOfWeek,
      userLocation: userCoords
    };

    if (onSearch) {
      onSearch(payload);
    } else {
      navigate('/journey-results', { state: payload });
    }
  };

  return (
    <div className={`bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 ${compact ? 'p-4 sm:p-6' : 'p-6 sm:p-8'} relative`}>
      
      {/* Geolocation Status Banner */}
      {geoNotice && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{geoNotice.msg}</span>
          </div>
          <button onClick={() => setGeoNotice(null)} className="text-emerald-700 hover:text-emerald-950 p-1">
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

      {/* Geolocation Quick Trigger Button */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 shadow-sm transition-all hover:scale-105 active:scale-95"
        >
          <Crosshair className={`w-3.5 h-3.5 text-brand-600 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'Detecting GPS location...' : 'USE MY CURRENT LOCATION'}</span>
        </button>

        {nearbyStops.length > 1 && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-700">Nearby stops:</span>
            {nearbyStops.slice(1, 3).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedSource(st);
                  setSourceInput(st.name);
                }}
                className="underline hover:text-brand-600 font-medium"
              >
                {st.name} ({st.formatted_distance})
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSearchSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Source Place / Stop Search */}
          <div className="md:col-span-5 relative" ref={sourceRef}>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                From (Stop or Landmark)
              </span>
              {selectedSource && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Verified Stop
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={sourceInput}
                onChange={(e) => handleSourceChange(e.target.value)}
                onFocus={() => {
                  setSourceOpen(true);
                  if (sourceSuggestions.length === 0) {
                    searchPlacesDebounced(sourceInput || '', setSourceSuggestions, setSourceLoading);
                  }
                }}
                onKeyDown={handleKeyDownSource}
                placeholder="Type 'Kan', 'Ham', or landmark..."
                className="w-full pl-10 pr-9 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900"
              />
              <MapPin className="w-5 h-5 text-emerald-600 absolute left-3 top-3.5" />
              
              {sourceLoading ? (
                <Loader2 className="w-4 h-4 text-brand-600 animate-spin absolute right-3 top-4" />
              ) : sourceInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSourceInput('');
                    setSelectedSource(null);
                    setSourceSuggestions([]);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-3.5"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Source Autocomplete Dropdown */}
            {sourceOpen && (
              <ul className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl py-1.5 text-xs divide-y divide-slate-100">
                {sourceSuggestions.length > 0 ? (
                  sourceSuggestions.map((item, idx) => (
                    <li
                      key={item.id || idx}
                      onClick={() => selectSourceItem(item)}
                      onMouseEnter={() => setSourceCursor(idx)}
                      className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                        sourceCursor === idx ? 'bg-brand-50 text-brand-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.type === 'BUS_STOP' ? (
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                            BUS
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-brand-700 flex items-center justify-center font-bold text-[10px]">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <span className="block font-bold text-slate-900">{item.name}</span>
                          <span className="text-[11px] text-slate-500 font-normal truncate block max-w-[200px]">
                            {item.location_description}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.type === 'BUS_STOP' ? 'Stop' : 'Landmark'}
                      </span>
                    </li>
                  ))
                ) : !sourceLoading ? (
                  <li className="px-4 py-4 text-center text-slate-400">
                    No matching stop or landmark found in Mangaluru.
                  </li>
                ) : null}
              </ul>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center -my-2 md:my-0">
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 rounded-full bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition-all shadow-sm hover:scale-110 active:scale-95"
              title="Swap From and To locations"
              aria-label="Swap locations"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* Destination Place / Stop Search */}
          <div className="md:col-span-5 relative" ref={destRef}>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                To (Stop or Landmark)
              </span>
              {selectedDest && (
                <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                  Verified Stop
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={destInput}
                onChange={(e) => handleDestChange(e.target.value)}
                onFocus={() => {
                  setDestOpen(true);
                  if (destSuggestions.length === 0) {
                    searchPlacesDebounced(destInput || '', setDestSuggestions, setDestLoading);
                  }
                }}
                onKeyDown={handleKeyDownDest}
                placeholder="Type 'Sta', 'Kad', or landmark..."
                className="w-full pl-10 pr-9 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900"
              />
              <MapPin className="w-5 h-5 text-rose-600 absolute left-3 top-3.5" />

              {destLoading ? (
                <Loader2 className="w-4 h-4 text-brand-600 animate-spin absolute right-3 top-4" />
              ) : destInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setDestInput('');
                    setSelectedDest(null);
                    setDestSuggestions([]);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-3.5"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Destination Autocomplete Dropdown */}
            {destOpen && (
              <ul className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl py-1.5 text-xs divide-y divide-slate-100">
                {destSuggestions.length > 0 ? (
                  destSuggestions.map((item, idx) => (
                    <li
                      key={item.id || idx}
                      onClick={() => selectDestItem(item)}
                      onMouseEnter={() => setDestCursor(idx)}
                      className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                        destCursor === idx ? 'bg-brand-50 text-brand-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.type === 'BUS_STOP' ? (
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                            BUS
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-brand-700 flex items-center justify-center font-bold text-[10px]">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <span className="block font-bold text-slate-900">{item.name}</span>
                          <span className="text-[11px] text-slate-500 font-normal truncate block max-w-[200px]">
                            {item.location_description}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.type === 'BUS_STOP' ? 'Stop' : 'Landmark'}
                      </span>
                    </li>
                  ))
                ) : !destLoading ? (
                  <li className="px-4 py-4 text-center text-slate-400">
                    No matching stop or landmark found in Mangaluru.
                  </li>
                ) : null}
              </ul>
            )}
          </div>

        </div>

        {/* Departure Time & Travel Day */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 mt-5 pt-4 border-t border-slate-100 items-center">
          
          <div className="md:col-span-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="w-full">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Departure Time
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
              />
            </div>
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="w-full">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Day of Travel
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
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

      {/* Popular Stops Chips */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wider mr-1">
          Popular Mangaluru Hubs:
        </span>
        <div className="inline-flex flex-wrap gap-1.5">
          {POPULAR_STOPS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={async () => {
                const res = await stopService.searchPlaces(st);
                if (res.results && res.results.length > 0) {
                  if (!selectedSource) {
                    selectSourceItem(res.results[0]);
                  } else {
                    selectDestItem(res.results[0]);
                  }
                }
              }}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 transition-colors border border-slate-200 font-semibold"
            >
              + {st}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
