import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom SVG Icons
const createCustomIcon = (bgColor, label, isPulse = false) => {
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: ${bgColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; font-family: Inter, sans-serif;">
          ${label}
        </div>
        ${isPulse ? '<div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; border: 2px solid ' + bgColor + '; opacity: 0.7; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const startIcon = createCustomIcon('#10b981', 'S', true);      // Green for Start
const destIcon = createCustomIcon('#ef4444', 'D', true);        // Red for Destination
const transferIcon = createCustomIcon('#f59e0b', 'T', true);    // Amber for Transfer
const waypointIcon = createCustomIcon('#3b82f6', '•');         // Blue for intermediate stops

// Component to dynamically fit map bounds to the active route points
function MapBoundsUpdater({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (e) {
        console.warn('Could not fit map bounds:', e);
      }
    }
  }, [points, map]);
  return null;
}

export default function LeafletMap({ journey = null, allStops = [], selectedRoute = null }) {
  const mangaluruCenter = [12.8700, 74.8500]; // Mangaluru Central City coordinate

  // Extract points for selected journey or route
  let segment1Points = [];
  let segment2Points = [];
  let startStop = null;
  let destStop = null;
  let transferStop = null;
  let waypoints = [];

  if (journey && journey.segments) {
    // Segment 1
    const seg1 = journey.segments[0];
    if (seg1 && seg1.stops) {
      segment1Points = seg1.stops.map(s => [s.latitude, s.longitude]);
      startStop = seg1.from_stop;
      if (journey.segments.length === 1) {
        destStop = seg1.to_stop;
        waypoints = seg1.stops.slice(1, -1);
      } else {
        transferStop = seg1.to_stop;
        waypoints = seg1.stops.slice(1, -1);
      }
    }

    // Segment 2 (Transfer)
    if (journey.segments.length > 1) {
      const seg2 = journey.segments[1];
      if (seg2 && seg2.stops) {
        segment2Points = seg2.stops.map(s => [s.latitude, s.longitude]);
        destStop = seg2.to_stop;
        waypoints = [...waypoints, ...seg2.stops.slice(1, -1)];
      }
    }
  } else if (selectedRoute && selectedRoute.stops) {
    // Bus route view
    const sorted = [...selectedRoute.stops].sort((a, b) => a.stop_sequence - b.stop_sequence);
    segment1Points = sorted.map(s => [s.latitude, s.longitude]);
    if (sorted.length > 0) {
      startStop = sorted[0];
      destStop = sorted[sorted.length - 1];
      waypoints = sorted.slice(1, -1);
    }
  }

  const allActivePoints = [
    ...segment1Points,
    ...segment2Points,
    ...(startStop ? [[startStop.latitude, startStop.longitude]] : []),
    ...(destStop ? [[destStop.latitude, destStop.longitude]] : []),
    ...(transferStop ? [[transferStop.latitude, transferStop.longitude]] : [])
  ];

  return (
    <div className="relative w-full h-[380px] sm:h-[480px] lg:h-[560px] rounded-2xl overflow-hidden border border-slate-200 shadow-md">
      
      {/* Map Legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md border border-slate-200 text-xs text-slate-700 max-w-[200px] pointer-events-auto">
        <h5 className="font-bold text-slate-900 mb-1.5 uppercase tracking-wider text-[10px]">
          Map Legend
        </h5>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white font-bold text-[8px] flex items-center justify-center">S</span>
            <span>Boarding Stop</span>
          </div>
          {transferStop && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white font-bold text-[8px] flex items-center justify-center">T</span>
              <span>Bus Transfer Stop</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white font-bold text-[8px] flex items-center justify-center">D</span>
            <span>Destination Stop</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-blue-600 inline-block"></span>
            <span>Bus Segment 1</span>
          </div>
          {segment2Points.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-amber-600 inline-block"></span>
              <span>Bus Segment 2</span>
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={mangaluruCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater points={allActivePoints.length > 0 ? allActivePoints : null} />

        {/* Polylines */}
        {segment1Points.length > 1 && (
          <Polyline
            positions={segment1Points}
            color="#2563eb"
            weight={5}
            opacity={0.85}
            dashArray={null}
          />
        )}

        {segment2Points.length > 1 && (
          <Polyline
            positions={segment2Points}
            color="#d97706"
            weight={5}
            opacity={0.85}
            dashArray="6, 8"
          />
        )}

        {/* Start Stop Marker */}
        {startStop && (
          <Marker position={[startStop.latitude, startStop.longitude]} icon={startIcon}>
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-emerald-700 block uppercase">Boarding Point</span>
                <span className="font-extrabold text-sm text-slate-900 block">{startStop.name || startStop.stop_name}</span>
                <p className="text-slate-500 mt-0.5">{startStop.location_description || 'Origin Stop'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Transfer Stop Marker */}
        {transferStop && (
          <Marker position={[transferStop.latitude, transferStop.longitude]} icon={transferIcon}>
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-amber-700 block uppercase">Transfer Junction</span>
                <span className="font-extrabold text-sm text-slate-900 block">{transferStop.name || transferStop.stop_name}</span>
                <p className="text-slate-500 mt-0.5">Change bus here (~{journey.transfer_wait_minutes} mins wait)</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Stop Marker */}
        {destStop && (
          <Marker position={[destStop.latitude, destStop.longitude]} icon={destIcon}>
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-rose-700 block uppercase">Destination Point</span>
                <span className="font-extrabold text-sm text-slate-900 block">{destStop.name || destStop.stop_name}</span>
                <p className="text-slate-500 mt-0.5">{destStop.location_description || 'Dropping Stop'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Waypoints / Intermediate Stops */}
        {waypoints.map((wp, idx) => (
          <Marker
            key={idx}
            position={[wp.latitude, wp.longitude]}
            icon={waypointIcon}
          >
            <Popup>
              <div className="text-xs">
                <span className="text-slate-500 block">Intermediate Stop</span>
                <span className="font-bold text-slate-800 text-sm">{wp.name || wp.stop_name}</span>
                {wp.location_description && (
                  <p className="text-slate-500 mt-0.5">{wp.location_description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* When no journey is selected, show general Mangaluru stops */}
        {allActivePoints.length === 0 && allStops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.latitude, stop.longitude]}
            icon={waypointIcon}
          >
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-slate-900 text-sm block">{stop.name}</span>
                <p className="text-slate-500 mt-0.5">{stop.location_description}</p>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}
