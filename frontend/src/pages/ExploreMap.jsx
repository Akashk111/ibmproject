import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Crosshair, Navigation, Footprints, Bus, Compass, Layers, Info, XCircle, ShieldCheck } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import DemoDataNotice from '../components/DemoDataNotice';
import { stopService, routeService, trackingService } from '../api/services';
import { getCurrentPosition, findNearestStops } from '../utils/geo';

export default function ExploreMap() {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [trackedBuses, setTrackedBuses] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestStops, setNearestStops] = useState([]);
  const [isWatching, setIsWatching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStop, setSelectedStop] = useState(null);

  const watchIdRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadMapData() {
      try {
        const [stopsRes, routesRes, busesRes] = await Promise.all([
          stopService.getAll(),
          routeService.getAll(),
          trackingService.getBuses()
        ]);
        setStops(stopsRes.stops || []);
        setRoutes(routesRes.routes || []);
        setTrackedBuses(busesRes.buses || []);
      } catch (err) {
        console.error('Failed to load map data:', err);
      }
    }
    loadMapData();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Update nearby stops whenever user location updates
  const updateNearbyStops = (coords, currentStops = stops) => {
    if (currentStops && currentStops.length > 0) {
      const nearest = findNearestStops(coords, currentStops, 5);
      setNearestStops(nearest);
      if (!selectedStop && nearest.length > 0) {
        setSelectedStop(nearest[0]);
      }
    }
  };

  // Continuous GPS watch
  const handleStartWatching = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 15),
          heading: pos.coords.heading,
          speed: pos.coords.speed
        };
        setUserLocation(coords);
        setIsWatching(true);
        setLocating(false);
        setLocationError(null);
        updateNearbyStops(coords, stops);
      },
      (err) => {
        setLocating(false);
        setIsWatching(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (err.code === 1) {
          setLocationError('Location permission denied. Please allow location access in your browser settings.');
        } else {
          setLocationError('GPS signal unavailable or timed out.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 2000 }
    );
    watchIdRef.current = watchId;
  };

  const handleStopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  };

  const handlePlanFromStop = (stop) => {
    navigate('/plan', {
      state: {
        initialSource: stop.name,
        sourceStopId: stop.id
      }
    });
  };

  const filteredStops = stops.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
            Geographic Explorer
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-600" />
            <span>Interactive Mangaluru Transit Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Explore verified bus stops, route networks, and nearby connections with live browser geolocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isWatching ? (
            <button
              type="button"
              onClick={handleStartWatching}
              disabled={locating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0756B8] hover:bg-blue-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all self-start sm:self-auto cursor-pointer"
            >
              <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Acquiring Phone GPS...' : 'Use My Current Location'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopWatching}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all self-start sm:self-auto cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Stop Sharing Location</span>
            </button>
          )}
        </div>
      </div>

      {locationError && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between font-medium">
          <span>{locationError}</span>
          <button onClick={() => setLocationError(null)} className="text-amber-800 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Telemetry and Distinction Notice */}
      <div className="bg-[#F4F7FB] p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#0756B8] flex-shrink-0" />
          <span>
            <strong className="text-[#102B4E]">Distinction:</strong> Blue Marker is your live Phone GPS. Amber/Green pins are verified bus routes and fleet buses.
          </span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{userLocation.latitude.toFixed(5)}° N, {userLocation.longitude.toFixed(5)}° E (±{userLocation.accuracy}m)</span>
          </div>
        )}
      </div>

      <DemoDataNotice compact />

      {/* Main Map Container with Floating Search & Route Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive Map Column */}
        <div className="lg:col-span-8 relative">
          <LeafletMap
            allStops={stops}
            nearbyStops={nearestStops}
            selectedRoute={selectedRoute}
            userLocation={userLocation}
            trackedBuses={trackedBuses}
            onStopSelect={(st) => setSelectedStop(st)}
            onPlanFromStop={handlePlanFromStop}
            height="h-[520px] sm:h-[620px] lg:h-[680px]"
          />
        </div>

        {/* Sidebar: Stop Finder, Route Selector & Nearby Hubs */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Nearby Stops (When located) */}
          {userLocation && nearestStops.length > 0 && (
            <div className="bg-emerald-50/80 p-5 rounded-3xl border border-emerald-200 shadow-sm space-y-3 animate-fadeIn">
              <h3 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-2">
                <Footprints className="w-4 h-4 text-emerald-600" />
                Nearest Stops to Your GPS Location
              </h3>
              <div className="space-y-2">
                {nearestStops.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStop(st)}
                    className="p-3 bg-white hover:bg-emerald-100/60 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{st.name}</span>
                      <span className="text-[11px] text-slate-500">{st.formattedDistance} • {st.walkingTime}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanFromStop(st);
                      }}
                      className="text-xs font-bold text-brand-600 hover:text-brand-800"
                    >
                      Plan ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route Overlay Selector */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              Highlight Route Network Line
            </h3>
            <select
              value={selectedRoute?.id || ''}
              onChange={(e) => {
                const r = routes.find(x => String(x.id) === e.target.value);
                setSelectedRoute(r || null);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
            >
              <option value="">Show All Stops (No Route Filter)</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  Route {r.route_code}: {r.route_name}
                </option>
              ))}
            </select>
            {selectedRoute && (
              <div className="text-xs text-slate-500 space-y-1 pt-1">
                <p>Operator: <strong className="text-slate-800">{selectedRoute.operator}</strong></p>
                <p>Terminals: <strong className="text-slate-800">{selectedRoute.origin_stop_name} ➔ {selectedRoute.destination_stop_name}</strong></p>
                <p>Stops on line: <strong className="text-slate-800">{selectedRoute.stops?.length || 0} stops</strong></p>
              </div>
            )}
          </div>

          {/* Search Stops Directory */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bus stops by name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {filteredStops.map((stop) => (
                <div
                  key={stop.id}
                  onClick={() => setSelectedStop(stop)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedStop?.id === stop.id
                      ? 'bg-brand-50 border-brand-500 font-bold text-brand-900'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'
                  }`}
                >
                  <div>
                    <span className="block">{stop.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate block max-w-[180px]">
                      {stop.location_description}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanFromStop(stop);
                    }}
                    className="text-xs text-brand-600 hover:text-brand-800 font-bold"
                  >
                    Trip ➔
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Stop Action Card */}
          {selectedStop && (
            <div className="bg-gradient-to-br from-brand-900 to-navy-950 text-white p-5 rounded-3xl shadow-lg space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-300 flex-shrink-0" />
                <h4 className="font-extrabold text-sm">{selectedStop.name}</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                {selectedStop.location_description}
              </p>
              <div className="text-[11px] text-slate-400 font-mono">
                GPS: {selectedStop.latitude.toFixed(4)}, {selectedStop.longitude.toFixed(4)}
              </div>
              <button
                type="button"
                onClick={() => handlePlanFromStop(selectedStop)}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Plan Journeys From This Stop
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
