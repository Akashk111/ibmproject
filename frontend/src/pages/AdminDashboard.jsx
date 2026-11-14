import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Bus, MapPin, Users, Plus, Edit, Trash2, CheckCircle2, 
  AlertTriangle, Clock, RefreshCw, Search, ChevronRight, X 
} from 'lucide-react';
import { adminService, stopService, routeService } from '../api/services';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'stops', 'routes', 'users'
  const [dashboardData, setDashboardData] = useState(null);
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Modal / Form states
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [stopForm, setStopForm] = useState({ name: '', location_description: '', latitude: '', longitude: '', is_active: true });

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeForm, setRouteForm] = useState({ route_code: '', route_name: '', operator: 'DKBOA Mangaluru', origin_stop_id: '', destination_stop_id: '', verification_status: 'DEMO DATA' });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedRouteForService, setSelectedRouteForService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ departure_time: '08:00', estimated_duration_minutes: 30, fare: 20, verification_status: 'VERIFIED' });

  const [stopSearch, setStopSearch] = useState('');
  const [routeSearch, setRouteSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, stopsRes, routesRes, usersRes] = await Promise.all([
        adminService.getDashboard(),
        stopService.getAll('', false),
        routeService.getAll(),
        adminService.getUsers()
      ]);
      setDashboardData(dashRes);
      setStops(stopsRes.stops || []);
      setRoutes(routesRes.routes || []);
      setUsers(usersRes.users || []);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setMsg({ text: 'Failed to load admin data: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  // Stop Actions
  const handleSaveStop = async (e) => {
    e.preventDefault();
    try {
      if (editingStop) {
        await stopService.update(editingStop.id, stopForm);
        showNotification('Bus stop updated successfully');
      } else {
        await stopService.create(stopForm);
        showNotification('Bus stop created successfully');
      }
      setShowStopModal(false);
      setEditingStop(null);
      setStopForm({ name: '', location_description: '', latitude: '', longitude: '', is_active: true });
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteStop = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bus stop? Routes referencing it may be affected.')) return;
    try {
      await stopService.delete(id);
      showNotification('Bus stop deleted');
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Route Actions
  const handleSaveRoute = async (e) => {
    e.preventDefault();
    try {
      await routeService.create(routeForm);
      showNotification('Bus route created successfully');
      setShowRouteModal(false);
      setRouteForm({ route_code: '', route_name: '', operator: 'DKBOA Mangaluru', origin_stop_id: '', destination_stop_id: '', verification_status: 'DEMO DATA' });
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Delete this bus route and all its stops/services?')) return;
    try {
      await routeService.delete(id);
      showNotification('Route deleted');
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Service Actions
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!selectedRouteForService) return;
    try {
      await routeService.addService(selectedRouteForService.id, serviceForm);
      showNotification('Timetable departure service added');
      setShowServiceModal(false);
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleToggleVerification = async (serviceId) => {
    try {
      await adminService.toggleServiceVerification(serviceId);
      showNotification('Service verification status updated');
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Delete this scheduled departure?')) return;
    try {
      await adminService.deleteService(serviceId);
      showNotification('Timetable service deleted');
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const filteredStops = stops.filter(s =>
    s.name.toLowerCase().includes(stopSearch.toLowerCase()) ||
    s.location_description.toLowerCase().includes(stopSearch.toLowerCase())
  );

  const filteredRoutes = routes.filter(r =>
    r.route_code.toLowerCase().includes(routeSearch.toLowerCase()) ||
    r.route_name.toLowerCase().includes(routeSearch.toLowerCase()) ||
    r.operator.toLowerCase().includes(routeSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-navy-900 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Admin Transportation Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Mangaluru bus stops, route sequences, timetable services, and verification flags.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4 text-brand-600" />
          <span>Refresh Data</span>
        </button>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
          msg.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          {msg.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { key: 'overview', label: 'Overview & Stats' },
          { key: 'stops', label: `Bus Stops (${stops.length})` },
          { key: 'routes', label: `Routes & Services (${routes.length})` },
          { key: 'users', label: `Users (${users.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-8 animate-fadeIn">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Bus Stops</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardData.stats.total_stops}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">{dashboardData.stats.active_stops} Active</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Bus Routes</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardData.stats.total_routes}</div>
              <span className="text-[11px] text-brand-600 font-semibold">{dashboardData.stats.active_routes} Active</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Timetable Services</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardData.stats.total_services}</div>
              <span className="text-[11px] text-slate-500">Scheduled departures</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Registered Users</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardData.stats.total_users}</div>
              <span className="text-[11px] text-slate-500">Commuters</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Data Verification Ratio */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Timetable Verification Status</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700">Verified Timetable Records</span>
                    <span>{dashboardData.stats.verified_routes_count} Routes</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${(dashboardData.stats.verified_routes_count / (dashboardData.stats.total_routes || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-700">Demonstration Model Records</span>
                    <span>{dashboardData.stats.demo_routes_count} Routes</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-amber-500" 
                      style={{ width: `${(dashboardData.stats.demo_routes_count / (dashboardData.stats.total_routes || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                You can toggle demonstration status to "VERIFIED" when official timetable notifications are confirmed by the Dakshina Kannada RTO or DKBOA.
              </p>
            </div>

            {/* Recent Searches Activity */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Recent Commuter Searches</h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {dashboardData.recent_searches?.map((s) => (
                  <div key={s.id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {s.source_stop_name} ➔ {s.destination_stop_name}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(s.searched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: BUS STOPS MANAGEMENT */}
      {activeTab === 'stops' && (
        <div className="space-y-5 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                value={stopSearch}
                onChange={(e) => setStopSearch(e.target.value)}
                placeholder="Search stops..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <button
              onClick={() => {
                setEditingStop(null);
                setStopForm({ name: '', location_description: '', latitude: '', longitude: '', is_active: true });
                setShowStopModal(true);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Bus Stop</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Stop ID</th>
                  <th className="py-3 px-4">Stop Name</th>
                  <th className="py-3 px-4">Description / Landmark</th>
                  <th className="py-3 px-4">Latitude, Longitude</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStops.map((stop) => (
                  <tr key={stop.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">#{stop.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{stop.name}</td>
                    <td className="py-3 px-4 text-slate-600">{stop.location_description}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{stop.latitude}, {stop.longitude}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        stop.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {stop.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingStop(stop);
                            setStopForm({
                              name: stop.name,
                              location_description: stop.location_description,
                              latitude: stop.latitude,
                              longitude: stop.longitude,
                              is_active: stop.is_active
                            });
                            setShowStopModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStop(stop.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: ROUTES & SERVICES */}
      {activeTab === 'routes' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
                placeholder="Search routes by code or name..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <button
              onClick={() => setShowRouteModal(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Bus Route</span>
            </button>
          </div>

          <div className="space-y-4">
            {filteredRoutes.map((route) => (
              <div key={route.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center">
                      {route.route_code}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{route.route_name}</h3>
                      <p className="text-xs text-slate-500">
                        {route.origin_stop_name} ➔ {route.destination_stop_name} • {route.operator}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      route.verification_status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {route.verification_status}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedRouteForService(route);
                        setShowServiceModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Departure Trip</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Route"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Timetable Services List */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Active Scheduled Departures ({route.services?.length || 0}):
                  </span>
                  
                  {route.services && route.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {route.services.map((srv) => (
                        <div
                          key={srv.id}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-center gap-2"
                        >
                          <Clock className="w-3.5 h-3.5 text-brand-600" />
                          <span className="font-extrabold text-slate-900">{srv.departure_time}</span>
                          <span className="text-slate-400">({srv.estimated_duration_minutes}m)</span>
                          {srv.fare && <span className="font-semibold text-emerald-700">₹{srv.fare}</span>}

                          <button
                            onClick={() => handleToggleVerification(srv.id)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              srv.verification_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                            title="Click to toggle Verified / Demo Data"
                          >
                            {srv.verification_status === 'VERIFIED' ? 'Verified' : 'Demo'}
                          </button>

                          <button
                            onClick={() => handleDeleteService(srv.id)}
                            className="text-slate-400 hover:text-rose-600 ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No scheduled departures configured for this route yet.</p>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 4: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">#{u.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'admin' ? 'bg-navy-900 text-amber-400' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADD / EDIT STOP */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStop ? 'Edit Bus Stop' : 'Add New Bus Stop'}
              </h3>
              <button onClick={() => setShowStopModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStop} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stop Name</label>
                <input
                  type="text"
                  required
                  value={stopForm.name}
                  onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })}
                  placeholder="e.g. Pumpwell Circle"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Landmark / Location Description</label>
                <input
                  type="text"
                  value={stopForm.location_description}
                  onChange={(e) => setStopForm({ ...stopForm, location_description: e.target.value })}
                  placeholder="e.g. NH-66 Intersection, Mahaveera Circle"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={stopForm.latitude}
                    onChange={(e) => setStopForm({ ...stopForm, latitude: e.target.value })}
                    placeholder="12.8615"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={stopForm.longitude}
                    onChange={(e) => setStopForm({ ...stopForm, longitude: e.target.value })}
                    placeholder="74.8724"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="stopActive"
                  checked={stopForm.is_active}
                  onChange={(e) => setStopForm({ ...stopForm, is_active: e.target.checked })}
                  className="rounded text-brand-600"
                />
                <label htmlFor="stopActive" className="text-xs font-semibold text-slate-700">Active Stop in Transit Graph</label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowStopModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                >
                  Save Stop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ROUTE */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Create New Bus Route</h3>
              <button onClick={() => setShowRouteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Route Code</label>
                  <input
                    type="text"
                    required
                    value={routeForm.route_code}
                    onChange={(e) => setRouteForm({ ...routeForm, route_code: e.target.value })}
                    placeholder="e.g. 15B"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white uppercase font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Route Name</label>
                  <input
                    type="text"
                    required
                    value={routeForm.route_name}
                    onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                    placeholder="e.g. State Bank to Ullal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operator</label>
                <input
                  type="text"
                  required
                  value={routeForm.operator}
                  onChange={(e) => setRouteForm({ ...routeForm, operator: e.target.value })}
                  placeholder="e.g. DKBOA Mangaluru or KSRTC"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Origin Stop</label>
                  <select
                    required
                    value={routeForm.origin_stop_id}
                    onChange={(e) => setRouteForm({ ...routeForm, origin_stop_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  >
                    <option value="">Select Origin</option>
                    {stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Stop</label>
                  <select
                    required
                    value={routeForm.destination_stop_id}
                    onChange={(e) => setRouteForm({ ...routeForm, destination_stop_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  >
                    <option value="">Select Destination</option>
                    {stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Status</label>
                <select
                  value={routeForm.verification_status}
                  onChange={(e) => setRouteForm({ ...routeForm, verification_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                >
                  <option value="DEMO DATA">DEMO DATA (Demonstration Record)</option>
                  <option value="VERIFIED">VERIFIED (Official Timetable)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRouteModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                >
                  Create Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SERVICE / DEPARTURE TRIP */}
      {showServiceModal && selectedRouteForService && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add Scheduled Departure</h3>
                <p className="text-xs text-slate-500">Route {selectedRouteForService.route_code} ({selectedRouteForService.route_name})</p>
              </div>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Time (24h HH:MM)</label>
                <input
                  type="time"
                  required
                  value={serviceForm.departure_time}
                  onChange={(e) => setServiceForm({ ...serviceForm, departure_time: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={serviceForm.estimated_duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, estimated_duration_minutes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fare (₹ INR)</label>
                  <input
                    type="number"
                    step="any"
                    value={serviceForm.fare}
                    onChange={(e) => setServiceForm({ ...serviceForm, fare: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={serviceForm.verification_status}
                  onChange={(e) => setServiceForm({ ...serviceForm, verification_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                >
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="DEMO DATA">DEMO DATA</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
