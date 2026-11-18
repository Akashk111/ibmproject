import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Bus, MapPin, Users, Plus, Edit, Trash2, CheckCircle2, 
  AlertTriangle, Clock, RefreshCw, Search, ChevronRight, X, Download, 
  Upload, FileText, Ticket, Compass, Car, CreditCard, IndianRupee, ArrowDownCircle, CheckCircle 
} from 'lucide-react';
import { adminService, stopService, routeService, bookingService, paymentService } from '../api/services';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'stops', 'routes', 'bookings', 'payments', 'csv', 'users'
  const [dashboardData, setDashboardData] = useState(null);
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [paymentsData, setPaymentsData] = useState({ payments: [], revenue_summary: {}, bus_wise_revenue: [] });
  const [paymentSearch, setPaymentSearch] = useState('');
  const [refundingOrderId, setRefundingOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Modal / Form states
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [stopForm, setStopForm] = useState({ name: '', code: '', location_description: '', latitude: '', longitude: '', is_active: true });

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeForm, setRouteForm] = useState({ route_code: '', route_name: '', operator: 'DKBOA Mangaluru', origin_stop_id: '', destination_stop_id: '', verification_status: 'DEMO DATA' });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedRouteForService, setSelectedRouteForService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ departure_time: '08:00', estimated_duration_minutes: 30, fare: 20, verification_status: 'VERIFIED' });

  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  const [stopSearch, setStopSearch] = useState('');
  const [routeSearch, setRouteSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, stopsRes, routesRes, usersRes, bookingsRes, payRes] = await Promise.all([
        adminService.getDashboard(),
        stopService.getAll('', false),
        routeService.getAll(),
        adminService.getUsers(),
        adminService.getBookings().catch(() => ({ bookings: [] })),
        adminService.getPayments().catch(() => ({ payments: [], revenue_summary: {}, bus_wise_revenue: [] }))
      ]);
      setDashboardData(dashRes);
      setStops(stopsRes.stops || []);
      setRoutes(routesRes.routes || []);
      setUsers(usersRes.users || []);
      setBookings(bookingsRes.bookings || []);
      setPaymentsData(payRes || { payments: [], revenue_summary: {}, bus_wise_revenue: [] });
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setMsg({ text: 'Failed to load admin data: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefundPayment = async (orderId) => {
    const reason = window.prompt(`Enter refund reason for Paytm Order ${orderId}:`, 'Customer requested cancellation');
    if (!reason) return;

    try {
      setRefundingOrderId(orderId);
      const res = await paymentService.refund(orderId, reason);
      showNotification(res.message || 'Payment refunded successfully via Paytm Gateway');
      loadData();
    } catch (err) {
      showNotification(err.message || 'Refund failed', 'error');
    } finally {
      setRefundingOrderId(null);
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
      setStopForm({ name: '', code: '', location_description: '', latitude: '', longitude: '', is_active: true });
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
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await routeService.delete(id);
      showNotification('Route deleted');
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Service Actions
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!selectedRouteForService) return;
    try {
      await routeService.addService(selectedRouteForService.id, serviceForm);
      showNotification('Timetable trip added successfully');
      setShowServiceModal(false);
      setServiceForm({ departure_time: '08:00', estimated_duration_minutes: 30, fare: 20, verification_status: 'VERIFIED' });
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this scheduled departure?')) return;
    try {
      await adminService.deleteService(id);
      showNotification('Trip service deleted');
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

  // Cancel Booking action
  const handleCancelBooking = async (bookingId, bookingRef) => {
    if (!window.confirm(`Cancel reservation ${bookingRef}? Seats will be released.`)) return;
    try {
      await bookingService.cancel(bookingId);
      showNotification(`Booking ${bookingRef} cancelled`);
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // CSV Export Actions
  const handleExportStopsCsv = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5001/api/admin/export/stops', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mangaluru_bus_stops.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('Stops CSV exported successfully');
      })
      .catch(err => showNotification('Export failed: ' + err.message, 'error'));
  };

  const handleExportRoutesCsv = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5001/api/admin/export/routes', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mangaluru_bus_routes.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('Routes CSV exported successfully');
      })
      .catch(err => showNotification('Export failed: ' + err.message, 'error'));
  };

  // CSV Import Action
  const handleImportStopsCsv = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) {
      showNotification('Please enter or paste CSV content', 'error');
      return;
    }
    try {
      setImporting(true);
      const res = await adminService.importStops(csvText);
      showNotification(res.message || 'Stops imported successfully');
      setCsvText('');
      loadData();
    } catch (err) {
      showNotification(err.message || 'CSV Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  const filteredStops = stops.filter(s =>
    s.name.toLowerCase().includes(stopSearch.toLowerCase()) ||
    (s.location_description && s.location_description.toLowerCase().includes(stopSearch.toLowerCase()))
  );

  const filteredRoutes = routes.filter(r =>
    r.route_code.toLowerCase().includes(routeSearch.toLowerCase()) ||
    r.route_name.toLowerCase().includes(routeSearch.toLowerCase()) ||
    r.operator.toLowerCase().includes(routeSearch.toLowerCase())
  );

  const filteredBookings = bookings.filter(b =>
    b.booking_reference.toLowerCase().includes(bookingSearch.toLowerCase()) ||
    (b.user_name && b.user_name.toLowerCase().includes(bookingSearch.toLowerCase())) ||
    (b.departure_stop_name && b.departure_stop_name.toLowerCase().includes(bookingSearch.toLowerCase()))
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
            Manage Mangaluru bus stops, route sequences, timetable departures, advance seat reservations, and CSV datasets.
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
          { key: 'bookings', label: `Seat Bookings (${bookings.length})` },
          { key: 'payments', label: `Payments & Revenue (₹${paymentsData.revenue_summary?.total_revenue || 0})` },
          { key: 'csv', label: 'CSV Data Import/Export' },
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Bus Stops</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardData.stats.total_stops}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">{dashboardData.stats.active_stops} Active</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Bus Routes</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardData.stats.total_routes}</div>
              <span className="text-[11px] text-brand-600 font-semibold">{dashboardData.stats.active_routes} Active</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Fleet Buses</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardData.stats.total_vehicles || 6}</div>
              <span className="text-[11px] text-blue-600 font-semibold">32 Seats / Bus</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Seat Bookings</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardData.stats.total_bookings || bookings.length}</div>
              <span className="text-[11px] text-purple-600 font-semibold">Confirmed & Active</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Landmarks</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardData.stats.total_places || 14}</div>
              <span className="text-[11px] text-amber-600 font-semibold">Curated Places</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Registered Users</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardData.stats.total_users}</div>
              <span className="text-[11px] text-slate-500">Commuters</span>
            </div>
          </div>

          {/* Quick Shortcuts Banner */}
          <div className="bg-gradient-to-r from-navy-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">Fast Administration</span>
              <h3 className="text-xl font-bold mt-1">Need to batch update Mangaluru bus stops or routes?</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Use CSV export to backup complete stop datasets or upload updated CSV tables to bulk synchronize route numbers and GPS coordinates.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('csv')}
              className="px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 flex-shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Open CSV Tools</span>
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: STOPS */}
      {activeTab === 'stops' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                value={stopSearch}
                onChange={(e) => setStopSearch(e.target.value)}
                placeholder="Search stops by name or description..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <button
              onClick={() => {
                setEditingStop(null);
                setStopForm({ name: '', code: '', location_description: '', latitude: '', longitude: '', is_active: true });
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
                  <th className="py-3 px-4">Name & Code</th>
                  <th className="py-3 px-4">Location Description</th>
                  <th className="py-3 px-4">Coordinates (Lat, Lng)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStops.map((stop) => (
                  <tr key={stop.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">#{stop.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{stop.name}</div>
                      <span className="text-[10px] font-mono text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                        {stop.code || 'STOP'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{stop.location_description}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {stop.latitude?.toFixed(4)}, {stop.longitude?.toFixed(4)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        stop.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {stop.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditingStop(stop);
                          setStopForm({
                            name: stop.name,
                            code: stop.code || '',
                            location_description: stop.location_description || '',
                            latitude: stop.latitude,
                            longitude: stop.longitude,
                            is_active: stop.is_active
                          });
                          setShowStopModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Edit Stop"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStop(stop.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

      {/* TAB 4: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search bookings by reference, passenger, or stop..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <span className="text-xs font-bold text-slate-500">
              Total Bookings: {filteredBookings.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Commuter</th>
                  <th className="py-3 px-4">Journey Route</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{b.booking_reference}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{b.user_name || 'Guest Commuter'}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {b.departure_stop_name} ➔ {b.destination_stop_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.travel_date} at {b.departure_time}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {b.seats && b.seats.length > 0 ? b.seats.join(', ') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600">₹{b.total_amount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.booking_status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {b.booking_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {b.booking_status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCancelBooking(b.id, b.booking_reference)}
                          className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PAYMENTS & REVENUE (Phase 4) */}
      {activeTab === 'payments' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Gross Revenue</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{paymentsData.revenue_summary?.total_revenue?.toFixed(2) || '0.00'}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{paymentsData.revenue_summary?.successful_transactions || 0} Successful Transactions</span>
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Payment Success Rate</span>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-700">
                {paymentsData.payments?.length > 0 
                  ? `${Math.round(((paymentsData.revenue_summary?.successful_transactions || 0) / paymentsData.payments.length) * 100)}%` 
                  : '100%'}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                Paytm Sandbox Gateway
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending / Held</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700">
                {paymentsData.revenue_summary?.pending_transactions || 0}
              </div>
              <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                10-Minute Lock Sessions
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Refunded</span>
                <ArrowDownCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-700">
                ₹{paymentsData.revenue_summary?.total_refunded?.toFixed(2) || '0.00'}
              </div>
              <span className="text-[11px] text-purple-600 font-semibold mt-1 block">
                {paymentsData.revenue_summary?.refunded_transactions || 0} Refunded Bookings
              </span>
            </div>
          </div>

          {/* Bus-Wise Revenue Breakdown */}
          {paymentsData.bus_wise_revenue && paymentsData.bus_wise_revenue.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Bus className="w-4 h-4 text-brand-600" />
                <span>Bus-Wise Revenue Contribution</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentsData.bus_wise_revenue.map((bus, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-black text-slate-900 block">
                        {bus.vehicle_number}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {bus.operator}
                      </span>
                      <span className="text-[10px] text-blue-700 font-bold block mt-1">
                        {bus.bookings_count} tickets issued
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Collected</span>
                      <span className="text-base font-black text-emerald-700">₹{bus.total_revenue?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Ledger Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Paytm Transactions Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time cryptographic audit log of all online booking payments, checksums, and gateway callbacks.
                </p>
              </div>

              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  placeholder="Search by Order ID or Ref..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Bank Ref / Checksum</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentsData.payments
                    ?.filter(p => 
                      p.order_id?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                      p.booking_reference?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                      p.bank_reference?.toLowerCase().includes(paymentSearch.toLowerCase())
                    )
                    .map((p) => {
                      const isSuccess = p.payment_status === 'PAID';
                      const isRefunded = p.payment_status === 'REFUNDED';
                      const isFailed = p.payment_status === 'FAILED';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{p.order_id}</span>
                            <span className="text-[10px] text-slate-400">
                              {p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : 'Recent'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {p.booking_reference || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700">{p.payment_method?.replace('_', ' ') || 'Paytm'}</span>
                            <span className="text-[10px] text-slate-400 block">{p.payment_gateway}</span>
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900">
                            ₹{p.amount?.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              isSuccess 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isRefunded
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : isFailed
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {p.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                            <span>{p.bank_reference || p.transaction_id || 'PENDING_BANK_ACK'}</span>
                            {p.checksum && (
                              <span className="text-emerald-600 block font-sans font-bold text-[9px]">
                                ✓ SHA256 Verified
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isSuccess && (
                              <button
                                onClick={() => handleRefundPayment(p.order_id)}
                                disabled={refundingOrderId === p.order_id}
                                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                              >
                                {refundingOrderId === p.order_id ? 'Refunding...' : 'Refund'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: CSV DATA IMPORT / EXPORT */}
      {activeTab === 'csv' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Export Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-brand-600" />
              <span>Export Transit Datasets (CSV)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Download clean CSV snapshots of all Mangaluru bus stops and routes for offline planning or data auditing.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleExportStopsCsv}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-transform hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Export Bus Stops CSV ({stops.length} Stops)</span>
              </button>

              <button
                onClick={handleExportRoutesCsv}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-transform hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Export Routes CSV ({routes.length} Routes)</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <span>Bulk Import Bus Stops from CSV</span>
            </h3>
            <p className="text-xs text-slate-500">
              Paste CSV rows or enter text below. The system will create new stops or update coordinates if the name matches.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600">
              <span className="font-bold text-slate-700 block mb-1">Expected CSV Header:</span>
              name,code,latitude,longitude,is_active<br />
              Hampankatta,HMPK,12.8698,74.8431,TRUE<br />
              State Bank,STBK,12.8617,74.8378,TRUE
            </div>

            <form onSubmit={handleImportStopsCsv} className="space-y-4">
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
              />

              <button
                type="submit"
                disabled={importing}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-transform hover:scale-105"
              >
                <Upload className="w-4 h-4" />
                <span>{importing ? 'Processing CSV...' : 'Import Bus Stops CSV'}</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 6: USERS */}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stop Code</label>
                <input
                  type="text"
                  value={stopForm.code}
                  onChange={(e) => setStopForm({ ...stopForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. PUMP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white font-mono"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white font-mono"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white font-mono"
                  />
                </div>
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

      {/* MODAL: ADD ROUTE */}
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Route Code</label>
                  <input
                    type="text"
                    required
                    value={routeForm.route_code}
                    onChange={(e) => setRouteForm({ ...routeForm, route_code: e.target.value })}
                    placeholder="e.g. 1A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operator</label>
                  <input
                    type="text"
                    value={routeForm.operator}
                    onChange={(e) => setRouteForm({ ...routeForm, operator: e.target.value })}
                    placeholder="DKBOA Mangaluru"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Route Name</label>
                <input
                  type="text"
                  required
                  value={routeForm.route_name}
                  onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                  placeholder="e.g. State Bank to Surathkal (NITK)"
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
                    <option value="">Select origin</option>
                    {stops.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                  <select
                    required
                    value={routeForm.destination_stop_id}
                    onChange={(e) => setRouteForm({ ...routeForm, destination_stop_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  >
                    <option value="">Select destination</option>
                    {stops.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
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
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TIMETABLE SERVICE */}
      {showServiceModal && selectedRouteForService && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add Scheduled Departure</h3>
                <p className="text-xs text-slate-500">Route {selectedRouteForService.route_code} • {selectedRouteForService.route_name}</p>
              </div>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Time (24h)</label>
                <input
                  type="text"
                  required
                  placeholder="08:30"
                  value={serviceForm.departure_time}
                  onChange={(e) => setServiceForm({ ...serviceForm, departure_time: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
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
