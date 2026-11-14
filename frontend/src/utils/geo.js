/**
 * Geolocation and Haversine distance utilities for Mangaluru Bus Connect
 */

// Haversine straight-line distance in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance human-readably
export function formatDistance(km) {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

// Walking duration estimate based on standard 4.8 km/h (80 meters / min) walking speed
export function getWalkingEstimate(km) {
  const minutes = Math.max(1, Math.round((km * 1000) / 80));
  return `${minutes} min walk`;
}

// Browser Geolocation API wrapper
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your web browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'Failed to obtain your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please allow location access in your browser settings to find nearby stops.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable from your device GPS.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try again.';
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

// Find nearest bus stops from a given coordinate
export function findNearestStops(coords, stopsList, limit = 5) {
  if (!coords || !stopsList || stopsList.length === 0) return [];

  const calculated = stopsList.map((stop) => {
    const distKm = calculateDistanceKm(
      coords.latitude,
      coords.longitude,
      stop.latitude,
      stop.longitude
    );
    return {
      ...stop,
      distanceKm: distKm,
      formattedDistance: formatDistance(distKm),
      walkingTime: getWalkingEstimate(distKm),
    };
  });

  calculated.sort((a, b) => a.distanceKm - b.distanceKm);
  return calculated.slice(0, limit);
}
