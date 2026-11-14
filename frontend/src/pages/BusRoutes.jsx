import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bus, Search, MapPin, ChevronRight, Filter, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import DemoDataNotice from '../components/DemoDataNotice';
import { routeService, stopService } from '../api/services';

export default function BusRoutes() {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [routesRes, stopsRes] = await Promise.all([
          routeService.getAll(),
          stopService.getAll()
        ]);
        setRoutes(routesRes.routes || []);
        setStops(stopsRes.stops || []);
        if (routesRes.routes && routesRes.routes.length > 0) {
          setSelectedRoute(routesRes.routes[0]);
        }
      } catch (err) {
        console.error('Error loading routes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredRoutes = routes.filter((r) => {
    const matchesQuery =
      searchQuery === '' ||
      r.route_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.operator.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOrigin =
      originFilter === '' || String(r.origin_stop_id) === originFilter;

    const matchesDest =
      destFilter === '' || String(r.destination_stop_id) === destFilter;

    return matchesQuery && matchesOrigin && matchesDest;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
          Transit Directory
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Mangaluru City Bus Routes
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore complete routes, sequence of bus stops, operating timings, and private & KSRTC operators across Mangaluru.
        </p>
      </div>

      <DemoDataNotice />

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Query search */}
          <div className="sm:col-span-5 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search route code (e.g. 1A, 15, 27) or name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>

          {/* Origin stop filter */}
          <div className="sm:col-span-3">
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Starting Stop</option>
              {stops.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Destination stop filter */}
          <div className="sm:col-span-3">
            <select
              value={destFilter}
              onChange={(e) => setDestFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Destination Stop</option>
              {stops.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          <div className="sm:col-span-1">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setOriginFilter('');
                setDestFilter('');
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Reset
            </button>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm">Loading bus routes database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Route List Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Showing {filteredRoutes.length} of {routes.length} Registered Routes
            </div>

            {filteredRoutes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-brand-600 ring-2 ring-brand-500/20 shadow-md'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                        {route.route_code}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">
                          {route.route_name}
                        </h3>
                        <p className="text-xs text-slate-500">{route.operator}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        route.verification_status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {route.verification_status}
                    </span>
                  </div>

                  {/* Route terminals */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium text-emerald-700">From: {route.origin_stop_name}</span>
                    <span className="text-slate-400">➔</span>
                    <span className="font-medium text-rose-700">To: {route.destination_stop_name}</span>
                  </div>

                  {/* Stops preview */}
                  {route.stops && route.stops.length > 0 && (
                    <div className="mt-2 text-[11px] text-slate-500 truncate">
                      <span className="font-semibold text-slate-700">{route.stops.length} stops: </span>
                      {route.stops.map(s => s.stop_name).join(' • ')}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400">
                      {route.services?.length || 0} Scheduled departures daily
                    </span>
                    <span className="font-bold text-brand-600 flex items-center gap-1">
                      <span>View Map & Schedule</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredRoutes.length === 0 && (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
                No bus routes found matching your search filters.
              </div>
            )}
          </div>

          {/* Route Details & Sequential Map Preview Column */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-5">
            {selectedRoute ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-5">
                
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-brand-100 text-brand-800 inline-block mb-1">
                      Route {selectedRoute.route_code} Details
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {selectedRoute.route_name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Operated by {selectedRoute.operator} • Data source: {selectedRoute.data_source}
                    </p>
                  </div>
                </div>

                {/* Map */}
                <div className="w-full">
                  <LeafletMap selectedRoute={selectedRoute} height="h-[280px]" />
                </div>

                {/* Stops in sequence */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Sequential Stops Timeline ({selectedRoute.stops?.length || 0} Stops)
                  </h4>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {selectedRoute.stops?.map((st, idx) => (
                      <div
                        key={st.id}
                        className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                            {st.stop_sequence}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-900 block">{st.stop_name}</span>
                            <span className="text-[11px] text-slate-400">{st.location_description}</span>
                          </div>
                        </div>
                        <span className="text-slate-500 font-medium">
                          +{st.arrival_offset_minutes} mins
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduled Departures */}
                {selectedRoute.services && selectedRoute.services.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      Daily Departure Timetable from Origin
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRoute.services.map((srv) => (
                        <span
                          key={srv.id}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-50 text-brand-800 border border-brand-200"
                        >
                          {srv.departure_time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2">
                  <Link
                    to="/plan"
                    state={{
                      initialSource: selectedRoute.origin_stop_name,
                      initialDest: selectedRoute.destination_stop_name
                    }}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-center text-sm block shadow-sm transition-all"
                  >
                    Plan Journey on this Route
                  </Link>
                </div>

              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                Select a bus route to view its sequential timeline and interactive map.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
