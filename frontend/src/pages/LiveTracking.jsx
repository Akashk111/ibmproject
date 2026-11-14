import React, { useState, useEffect, useRef } from 'react';
import { 
  Bus, Radio, Navigation, Clock, ShieldCheck, AlertTriangle, 
  RefreshCw, Search, Play, Pause, ChevronRight, MapPin, Gauge 
} from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import DemoDataNotice from '../components/DemoDataNotice';
import { trackingService, routeService, stopService } from '../api/services';
import cityBusImg from '../assets/images/city-bus-1.jpg';

export default function LiveTracking() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [autoSimulate, setAutoSimulate] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const timerRef = useRef(null);

  const fetchBuses = async () => {
    try {
      const res = await trackingService.getBuses();
      setBuses(res.buses || []);
      setLastUpdated(new Date());

      // If a bus was selected, keep selected reference updated
      if (selectedBus) {
        const updated = res.buses.find(b => b.id === selectedBus.id);
        if (updated) setSelectedBus(updated);
      }
    } catch (err) {
      console.error('Failed to load tracked buses:', err);
    }
  };

  const handleSimulateStep = async () => {
    try {
      await trackingService.simulateStep();
      await fetchBuses();
    } catch (err) {
      console.error('Failed to execute simulation step:', err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [routesRes, stopsRes, busesRes] = await Promise.all([
          routeService.getAll(),
          stopService.getAll(),
          trackingService.getBuses()
        ]);
        setRoutes(routesRes.routes || []);
        setStops(stopsRes.stops || []);
        setBuses(busesRes.buses || []);
        if (busesRes.buses && busesRes.buses.length > 0) {
          setSelectedBus(busesRes.buses[0]);
          const r = routesRes.routes.find(x => x.id === busesRes.buses[0].route_id);
          setSelectedRoute(r || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Auto-simulation interval: advances simulated buses smoothly every 6 seconds
  useEffect(() => {
    if (autoSimulate) {
      timerRef.current = setInterval(() => {
        handleSimulateStep();
      }, 6000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoSimulate, selectedBus]);

  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    const r = routes.find(x => x.id === bus.route_id);
    setSelectedRoute(r || null);
  };

  const filteredBuses = buses.filter(b => {
    const matchQ =
      searchQuery === '' ||
      b.vehicle_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.route_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.route_name && b.route_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchS = statusFilter === '' || b.source_type === statusFilter;
    return matchQ && matchS;
  });

  const hasDemoBuses = buses.some(b => b.source_type === 'DEMO');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Live Bus Tracking Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time bus positions, vehicle speeds, arrival ETAs, and transit route segments.
          </p>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAutoSimulate(!autoSimulate)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
              autoSimulate
                ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {autoSimulate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoSimulate ? 'Pause Motion' : 'Auto Motion'}</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateStep}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
            <span>Step Advance</span>
          </button>
        </div>
      </div>

      {/* Mandatory Transparent Tracking Banner */}
      {hasDemoBuses && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl text-xs flex items-start gap-3 shadow-sm animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-amber-950 uppercase tracking-wider">
              DEMO TRACKING — Simulated vehicle location. This is not a real bus.
            </h4>
            <p className="text-amber-900/90 leading-relaxed font-medium">
              Vehicles tagged with <strong>DEMO</strong> are computer-simulated along predefined Mangaluru route coordinates to demonstrate vehicle movement and dispatch APIs. When physical GPS transponders are authorized via device ingestion endpoints, the status automatically switches to <strong>LIVE</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Main 2-Column Interface: Map on Left (Desktop), Information Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive Map Column */}
        <div className="lg:col-span-7 relative">
          <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-xl">
            <LeafletMap
              allStops={stops}
              selectedRoute={selectedRoute}
              trackedBuses={buses}
              selectedBus={selectedBus}
              height="h-[480px] sm:h-[580px] lg:h-[660px]"
            />

            {/* Map sub-bar with selected bus summary */}
            {selectedBus && (
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                  <span className="font-bold text-slate-900">
                    Following: {selectedBus.vehicle_id} ({selectedBus.vehicle_name})
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-brand-700 font-semibold">Route {selectedBus.route_code}</span>
                </div>
                <div className="text-slate-500 font-medium">
                  Speed: <strong className="text-slate-900">{selectedBus.speed} km/h</strong> • Heading: <strong className="text-slate-900">{selectedBus.heading}°</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Information Panel Column */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Hero Feature Card with Bus Photo */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 text-white h-40">
            <img 
              src={cityBusImg} 
              alt="Mangaluru City Bus Transit" 
              className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
            />
            <div className="relative z-10 p-5 flex flex-col justify-between h-full">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/90 text-white w-max uppercase tracking-wider">
                Mangaluru Telematics
              </span>
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  Active Fleet Dispatch
                </h3>
                <p className="text-xs text-slate-300">
                  {buses.length} Vehicles tracked • Last refresh: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vehicle ID or route..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <div className="sm:col-span-5">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="LIVE">LIVE (Real GPS)</option>
                  <option value="DEMO">DEMO (Simulated)</option>
                  <option value="STALE">STALE (&gt;120s)</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tracked Vehicles List */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredBuses.map((bus) => {
              const isSelected = selectedBus?.id === bus.id;
              const isLive = bus.source_type === 'LIVE';
              const isDemo = bus.source_type === 'DEMO';

              return (
                <div
                  key={bus.id}
                  onClick={() => handleSelectBus(bus)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-brand-600 ring-2 ring-brand-500/20 shadow-md'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Top Bar: Vehicle ID & Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-navy-900 text-white font-extrabold text-xs flex items-center justify-center">
                        {bus.route_code}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{bus.vehicle_id}</h4>
                        <p className="text-[11px] text-slate-500">{bus.vehicle_name}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isLive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isDemo
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {bus.source_type}
                    </span>
                  </div>

                  {/* Route & Destination */}
                  <p className="text-xs font-semibold text-slate-700 truncate mb-3">
                    Route: {bus.route_name}
                  </p>

                  {/* Telematics stats */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px] border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Next Stop</span>
                      <strong className="text-slate-800 font-bold truncate block">{bus.next_stop_name || 'In transit'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Arrival ETA</span>
                      <strong className="text-brand-700 font-bold">~{bus.eta_minutes} mins</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Speed</span>
                      <strong className="text-slate-800 font-bold">{bus.speed} km/h</strong>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>GPS Age: {bus.age_seconds}s ago</span>
                    <span className="font-bold text-brand-600 flex items-center gap-1">
                      <span>Follow on Map</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredBuses.length === 0 && (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                No tracked buses matching your search filter.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
