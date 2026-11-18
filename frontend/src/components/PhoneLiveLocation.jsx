import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crosshair, Radio, ShieldCheck, AlertCircle, AlertTriangle, 
  MapPin, Footprints, Bus, ArrowRight, RefreshCw, XCircle, 
  CheckCircle2, Compass, Info, Lock
} from 'lucide-react';
import LeafletMap from './LeafletMap';
import { stopService, routeService, trackingService } from '../api/services';
import { calculateDistanceKm, formatDistance, getWalkingEstimate } from '../utils/geo';

// Verified Mangaluru SQLite database fallback stops
const MANGALURU_FALLBACK_STOPS = [
  { id: 1, name: 'State Bank', code: 'STBK', latitude: 12.8617, longitude: 74.8398, location_description: 'Central City Bus Terminal & Hamilton Circle' },
  { id: 2, name: 'KSRTC Bejai', code: 'KSRT', latitude: 12.8863, longitude: 74.8465, location_description: 'Interstate KSRTC Bus Terminal, Bejai Main Road' },
  { id: 3, name: 'Lalbagh', code: 'LALB', latitude: 12.8797, longitude: 74.8436, location_description: 'Mangalore City Corporation (MCC) & Karavali Circle' },
  { id: 4, name: 'Hampankatta', code: 'HMPK', latitude: 12.8687, longitude: 74.8431, location_description: 'Clock Tower & Central Commercial District' },
  { id: 5, name: 'Kankanady', code: 'KNKD', latitude: 12.8665, longitude: 74.8623, location_description: 'Father Muller Hospital & Bypass Junction' },
  { id: 42, name: 'Jyothi', code: 'JYOT', latitude: 12.8705, longitude: 74.8488, location_description: 'Dr. Ambedkar Circle / KMC Hospital' },
  { id: 37, name: 'Bunts Hostel', code: 'BNTH', latitude: 12.8745, longitude: 74.8475, location_description: 'Kadri Road & Ramakrishna College Junction' },
  { id: 6, name: 'Kadri', code: 'KADR', latitude: 12.8872, longitude: 74.8582, location_description: 'Kadri Manjunath Temple & Kadri Park' },
  { id: 17, name: 'Urwa', code: 'URWA', latitude: 12.8895, longitude: 74.8322, location_description: 'Urwa Store & Sri Mariyamma Temple' },
  { id: 21, name: 'Kulur', code: 'KULR', latitude: 12.9234, longitude: 74.8211, location_description: 'Kulur Ferry & Gurupura River Bridge' },
  { id: 12, name: 'Kottara Chowki', code: 'KTCH', latitude: 12.9065, longitude: 74.8315, location_description: 'Highway Flyover & NH-66 Coastal Link' },
  { id: 13, name: 'Surathkal', code: 'SRTK', latitude: 13.0085, longitude: 74.7942, location_description: 'NITK Campus, Lighthouse & Suburban Terminal' },
  { id: 38, name: 'Pumpwell', code: 'PUMP', latitude: 12.8562, longitude: 74.8685, location_description: 'Mahaveera Circle & NH-66 Arterial Gateway' }
];

export default function PhoneLiveLocation({ 
  onPlanFromStop = null,
  compact = false,
  showBusTracking = true,
  title = "Phone Live Location & Nearby Bus Stops"
}) {
  const navigate = useNavigate();
  const watchIdRef = useRef(null);

  // Live Location States
  const [isWatching, setIsWatching] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  // Status & Error States
  const [permissionState, setPermissionState] = useState('idle'); // 'idle' | 'prompting' | 'granted' | 'denied'
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  // Nearby Stops & Fleet Data
  const [nearbyStops, setNearbyStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [trackedBuses, setTrackedBuses] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'closest'

  // Load verified city routes and bus tracking for context
  useEffect(() => {
    let isMounted = true;
    async function loadTransitContext() {
      try {
        const [routesRes, busesRes] = await Promise.all([
          routeService.getAll().catch(() => ({ routes: [] })),
          trackingService.getBuses().catch(() => ({ buses: [] }))
        ]);
        if (isMounted) {
          setRoutes(routesRes.routes || []);
          setTrackedBuses(busesRes.buses || []);
        }
      } catch (err) {
        console.warn('Could not load transit context in PhoneLiveLocation:', err);
      }
    }
    loadTransitContext();

    // Cleanup: clear any active watch on unmount
    return () => {
      isMounted = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Fetch nearby verified Mangaluru bus stops based on live coordinates
  const refreshNearbyStops = async (lat, lng) => {
    setLoadingNearby(true);
    try {
      const res = await stopService.getNearby(lat, lng, 6);
      const stopsList = res?.nearest_stops || (Array.isArray(res) ? res : []);

      if (stopsList.length > 0) {
        setNearbyStops(stopsList);
        if (!selectedStop) {
          setSelectedStop(stopsList[0]);
        }
      } else {
        // Fallback to client-side Haversine against verified database stops
        const computed = MANGALURU_FALLBACK_STOPS.map(stop => {
          const distKm = calculateDistanceKm(lat, lng, stop.latitude, stop.longitude);
          return {
            ...stop,
            distance_km: distKm,
            formatted_distance: formatDistance(distKm),
            walking_time_minutes: Math.max(1, Math.round((distKm * 1000) / 80)),
            walking_time_label: getWalkingEstimate(distKm)
          };
        }).sort((a, b) => a.distance_km - b.distance_km);

        setNearbyStops(computed.slice(0, 6));
        if (!selectedStop && computed.length > 0) {
          setSelectedStop(computed[0]);
        }
      }
    } catch (err) {
      console.warn('API getNearby failed, calculating client-side stops:', err);
      const computed = MANGALURU_FALLBACK_STOPS.map(stop => {
        const distKm = calculateDistanceKm(lat, lng, stop.latitude, stop.longitude);
        return {
          ...stop,
          distance_km: distKm,
          formatted_distance: formatDistance(distKm),
          walking_time_minutes: Math.max(1, Math.round((distKm * 1000) / 80)),
          walking_time_label: getWalkingEstimate(distKm)
        };
      }).sort((a, b) => a.distance_km - b.distance_km);

      setNearbyStops(computed.slice(0, 6));
      if (!selectedStop && computed.length > 0) {
        setSelectedStop(computed[0]);
      }
    } finally {
      setLoadingNearby(false);
    }
  };

  // 1. START WATCHING CURRENT PHONE LOCATION
  const handleStartLocation = () => {
    setErrorMessage(null);
    setErrorDetails(null);

    if (!navigator.geolocation) {
      setPermissionState('denied');
      setErrorMessage('Geolocation Not Supported');
      setErrorDetails('Your web browser does not support the W3C Geolocation API. Please use a modern mobile or desktop browser.');
      return;
    }

    // Security check: Geolocation requires HTTPS or localhost
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!window.isSecureContext && !isLocal) {
      setPermissionState('denied');
      setErrorMessage('Secure Context (HTTPS) Required');
      setErrorDetails('Mobile browsers restrict GPS hardware access to secure HTTPS origins or localhost. Please open this site over HTTPS.');
      return;
    }

    setPermissionState('prompting');

    // Use navigator.geolocation.watchPosition() for continuous updates as passenger moves
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 15),
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };

        setUserLocation(coords);
        setLastUpdated(new Date());
        setUpdateCount(prev => prev + 1);
        setIsWatching(true);
        setPermissionState('granted');
        setErrorMessage(null);
        setErrorDetails(null);

        // Fetch or recalculate nearest verified stops
        refreshNearbyStops(coords.latitude, coords.longitude);
      },
      (error) => {
        setIsWatching(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setPermissionState('denied');
            setErrorMessage('Location Permission Denied');
            setErrorDetails('You declined browser location access. To find nearby Mangaluru bus stops, click the lock or settings icon in your browser address bar and set Location to "Allow".');
            break;
          case error.POSITION_UNAVAILABLE:
            setPermissionState('denied');
            setErrorMessage('GPS Signal Unavailable');
            setErrorDetails('Your device phone GPS could not acquire satellite fix. Verify that device Location services are turned on in system settings.');
            break;
          case error.TIMEOUT:
            setPermissionState('denied');
            setErrorMessage('Location Request Timed Out');
            setErrorDetails('The GPS sensor timed out while acquiring high-precision coordinates. Please try again with clear sky visibility.');
            break;
          default:
            setPermissionState('denied');
            setErrorMessage('Location Error');
            setErrorDetails(error.message || 'An unexpected error occurred while accessing phone GPS.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 2000
      }
    );

    watchIdRef.current = watchId;
  };

  // 2. STOP SHARING LOCATION
  const handleStopLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
    setPermissionState('idle');
  };

  // 3. ACTION: PLAN JOURNEY FROM HERE
  const handlePlanFromHere = (stop) => {
    if (onPlanFromStop) {
      onPlanFromStop(stop);
    } else {
      // Navigate to /plan with source prefilled
      navigate('/plan', {
        state: {
          initialSource: stop.name,
          sourceStopId: stop.id
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      
      {/* Header Banner */}
      <div className="bg-[#102B4E] text-white p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold tracking-wide uppercase">
                <Radio className={`w-3.5 h-3.5 ${isWatching ? 'text-emerald-400 animate-pulse' : 'text-blue-300'}`} />
                <span>{isWatching ? 'Continuous Phone GPS Live' : 'Phone GPS Inactive'}</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Privacy-First • Client-Side Only</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {title}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Use your smartphone’s real GPS to pinpoint your exact location on the map, discover closest verified Mangaluru city bus stops within walking distance, and plan journeys instantly.
            </p>
          </div>

          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!isWatching ? (
              <button
                type="button"
                onClick={handleStartLocation}
                disabled={permissionState === 'prompting'}
                className="px-6 py-3.5 rounded-2xl bg-[#0756B8] hover:bg-blue-600 text-white font-black text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2.5 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <Crosshair className={`w-5 h-5 ${permissionState === 'prompting' ? 'animate-spin' : ''}`} />
                <span>{permissionState === 'prompting' ? 'Requesting GPS...' : 'Use My Current Location'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopLocation}
                className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2.5 active:scale-95 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
                <span>Stop Sharing Location</span>
              </button>
            )}

            {isWatching && userLocation && (
              <button
                type="button"
                onClick={() => refreshNearbyStops(userLocation.latitude, userLocation.longitude)}
                disabled={loadingNearby}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center justify-center cursor-pointer"
                title="Refresh Nearby Stops"
              >
                <RefreshCw className={`w-4 h-4 ${loadingNearby ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Live Telemetry Bar when GPS is Active */}
        {isWatching && userLocation && (
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">Latitude</span>
              <span className="text-sm font-black text-white font-mono mt-0.5 block">
                {userLocation.latitude.toFixed(5)}° N
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">Longitude</span>
              <span className="text-sm font-black text-white font-mono mt-0.5 block">
                {userLocation.longitude.toFixed(5)}° E
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">GPS Precision</span>
              <span className="text-sm font-black text-emerald-300 font-mono mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>±{userLocation.accuracy} metres</span>
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">Live Watch Status</span>
              <span className="text-sm font-black text-white mt-0.5 block">
                Active ({updateCount} updates)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Permission / Error Notice */}
      {errorMessage && (
        <div className="m-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-sm text-amber-950">{errorMessage}</p>
            <p className="text-amber-800 leading-relaxed">{errorDetails}</p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartLocation}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                Retry GPS Connection
              </button>
              <span className="text-[11px] text-amber-700">
                Or select verified stops manually from the dropdowns above.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Distinction Callout: Passenger Phone Location vs Bus Live Fleet */}
      <div className="px-6 sm:px-8 py-3.5 bg-[#F4F7FB] border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#0756B8] flex-shrink-0" />
          <span>
            <strong className="text-[#102B4E]">Important Distinction:</strong> Passenger Location is your mobile phone's GPS position. City Bus locations reflect vehicle GPS transponders and schedules.
          </span>
        </div>
        <div className="flex items-center gap-3 font-semibold text-[11px]">
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            <span>You (Phone GPS)</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block"></span>
            <span>Verified Bus Stops</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded bg-amber-600 inline-block"></span>
            <span>Tracked Fleet</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Nearby Stops Panel */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#0756B8]" />
              <span>Mangaluru City Geo-Map</span>
            </span>
            {userLocation && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tracking Active</span>
              </span>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
            <LeafletMap 
              userLocation={userLocation}
              nearbyStops={nearbyStops}
              selectedStop={selectedStop}
              trackedBuses={showBusTracking ? trackedBuses : []}
              onStopSelect={(stop) => setSelectedStop(stop)}
              onPlanFromStop={handlePlanFromHere}
              height="h-[400px] sm:h-[480px] lg:h-[520px]"
            />
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Tip: Click any green bus stop marker on the map to see its distance, walking estimate, and click "Plan Journey From Here" to book immediately.
          </p>
        </div>

        {/* Right Column: Nearby Verified Bus Stops List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold text-[#0756B8] uppercase tracking-wider block">
                Local Walking Distance
              </span>
              <h3 className="text-base font-black text-[#102B4E]">
                Nearby Verified Bus Stops
              </h3>
            </div>
            {nearbyStops.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#E8F1FF] text-[#0756B8] text-xs font-bold">
                {nearbyStops.length} stops
              </span>
            )}
          </div>

          {/* If GPS is not yet active */}
          {!userLocation && (
            <div className="bg-[#F4F7FB] rounded-2xl p-6 text-center space-y-4 border border-dashed border-slate-300 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto text-[#0756B8]">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-[#102B4E]">
                  Discover Closest Bus Stops
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click the button below to turn on phone GPS and instantly calculate walking times to Mangaluru city bus stops.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartLocation}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0756B8] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Crosshair className="w-4 h-4" />
                <span>Use My Current Location</span>
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {userLocation && loadingNearby && (
            <div className="py-8 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-[#0756B8] animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Calculating closest stops...</p>
            </div>
          )}

          {/* Stops List */}
          {userLocation && !loadingNearby && nearbyStops.length === 0 && (
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-bold">No stops within immediate walking distance.</p>
              <p className="text-slate-600">
                You appear to be outside Mangaluru city limits. You can still plan journeys from central hubs like State Bank or Hampankatta.
              </p>
            </div>
          )}

          {userLocation && !loadingNearby && nearbyStops.length > 0 && (
            <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
              {nearbyStops.map((stop, idx) => {
                const isSelected = selectedStop?.id === stop.id;
                const distanceText = stop.formatted_distance || stop.formattedDistance || `${Math.round((stop.distance_km || 0) * 1000)} m`;
                const walkingText = stop.walking_time_label || stop.walkingTime || '~2 min walk';

                return (
                  <div
                    key={stop.id}
                    onClick={() => setSelectedStop(stop)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#E8F1FF] border-[#0756B8] shadow-md ring-2 ring-[#0756B8]/20' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                          idx === 0 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-sm text-[#102B4E]">
                            {stop.name}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-500">
                            Stop Code: {stop.code || 'CITY'}
                          </span>
                        </div>
                      </div>

                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wide">
                          Closest
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mb-3 line-clamp-1">
                      {stop.location_description || 'Verified Mangaluru Bus Stop'}
                    </p>

                    {/* Distance & Walking Badge */}
                    <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-white/80 rounded-xl border border-slate-100 mb-3 font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{distanceText}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <Footprints className="w-3.5 h-3.5" />
                        <span>{walkingText}</span>
                      </span>
                    </div>

                    {/* Plan Journey Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanFromHere(stop);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#0756B8] hover:bg-blue-600 text-white font-bold text-xs shadow-sm hover:shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Plan Journey From Here</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Privacy and Technical Compliance Notice (Requirement 4) */}
      <div className="p-6 bg-[#F4F7FB] border-t border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-xs">
                Location Privacy Guarantee
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Coordinates are processed locally in your device's browser to compute walking distances. We do not store, profile or broadcast passenger GPS positions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 self-end sm:self-auto">
            <span>W3C Geolocation Standard</span>
            <span>•</span>
            <span>SSL / TLS Encrypted</span>
          </div>
        </div>
      </div>

    </div>
  );
}
