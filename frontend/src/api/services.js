import { apiRequest } from './client';

export const authService = {
  login: (email, password) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  getMe: () => apiRequest('/api/auth/me'),

  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
};

export const stopService = {
  getAll: (query = '', activeOnly = true) =>
    apiRequest(`/api/stops?query=${encodeURIComponent(query)}&active_only=${activeOnly}`),

  searchPlaces: (q) =>
    apiRequest(`/api/stops/search?q=${encodeURIComponent(q)}`),

  getNearby: (lat, lng, limit = 5) =>
    apiRequest(`/api/stops/nearby?lat=${lat}&lng=${lng}&limit=${limit}`),

  getById: (id) => apiRequest(`/api/stops/${id}`),

  create: (data) =>
    apiRequest('/api/stops', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiRequest(`/api/stops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiRequest(`/api/stops/${id}`, {
      method: 'DELETE',
    }),
};

export const routeService = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.origin) searchParams.append('origin', params.origin);
    if (params.destination) searchParams.append('destination', params.destination);
    return apiRequest(`/api/routes?${searchParams.toString()}`);
  },

  getById: (id) => apiRequest(`/api/routes/${id}`),

  create: (data) =>
    apiRequest('/api/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiRequest(`/api/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiRequest(`/api/routes/${id}`, {
      method: 'DELETE',
    }),

  addStop: (routeId, data) =>
    apiRequest(`/api/routes/${routeId}/stops`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addService: (routeId, data) =>
    apiRequest(`/api/routes/${routeId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const journeyService = {
  search: (sourceStopId, destinationStopId, departureTime = null, dayOfWeek = null) =>
    apiRequest('/api/journey/search', {
      method: 'POST',
      body: JSON.stringify({
        source_stop_id: sourceStopId,
        destination_stop_id: destinationStopId,
        departure_time: departureTime,
        day_of_week: dayOfWeek,
      }),
    }),

  getStats: () => apiRequest('/api/journey/stats'),
};

export const trackingService = {
  getBuses: (routeId = '', status = '') => {
    const params = new URLSearchParams();
    if (routeId) params.append('route_id', routeId);
    if (status) params.append('status', status);
    return apiRequest(`/api/tracking/buses?${params.toString()}`);
  },

  getBusDetail: (id) => apiRequest(`/api/tracking/buses/${id}`),

  getRouteBuses: (routeId) => apiRequest(`/api/tracking/routes/${routeId}`),

  simulateStep: () =>
    apiRequest('/api/tracking/simulate-step', {
      method: 'POST',
    }),

  recordGpsLocation: (data, deviceKey) =>
    apiRequest('/api/tracking/location', {
      method: 'POST',
      headers: deviceKey ? { 'X-Device-Key': deviceKey } : {},
      body: JSON.stringify(data),
    }),
};

export const userService = {
  getFavorites: () => apiRequest('/api/user/favorites'),
  addFavorite: (sourceStopId, destinationStopId) =>
    apiRequest('/api/user/favorites', {
      method: 'POST',
      body: JSON.stringify({
        source_stop_id: sourceStopId,
        destination_stop_id: destinationStopId,
      }),
    }),
  removeFavorite: (id) =>
    apiRequest(`/api/user/favorites/${id}`, {
      method: 'DELETE',
    }),
  getHistory: () => apiRequest('/api/user/history'),
  clearHistory: () => apiRequest('/api/user/history/clear', { method: 'DELETE' }),
};

export const adminService = {
  getDashboard: () => apiRequest('/api/admin/dashboard'),
  getUsers: () => apiRequest('/api/admin/users'),
  toggleServiceVerification: (serviceId, status = null) =>
    apiRequest(`/api/admin/services/${serviceId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verification_status: status }),
    }),
  deleteService: (serviceId) =>
    apiRequest(`/api/admin/services/${serviceId}`, {
      method: 'DELETE',
    }),
};
