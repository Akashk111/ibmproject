import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import { Crosshair, Navigation, Clock, ShieldCheck, Bus } from 'lucide-react';
import L from 'leaflet';

// Custom Pin generator
const createCustomIcon = (bgColor, label, isPulse = false) => {
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: ${bgColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; font-family: Inter, sans-serif;">
          ${label}
        </div>
        ${isPulse ? '<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; border: 2px solid ' + bgColor + '; opacity: 0.7; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// User Current Location Icon
const userLocationIcon = L.divIcon({
  className: 'custom-user-gps-pin',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="background-color: #2563eb; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(37, 99, 235, 0.8);"></div>
      <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: rgba(37, 99, 235, 0.25); animation: pulse 2s infinite;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Tracked Bus Icon with Direction Heading
const createBusVehicleIcon = (bus) => {
  const isDemo = bus.source_type === 'DEMO';
  const isLive = bus.source_type === 'LIVE';
  const color = isLive ? '#10b981' : isDemo ? '#d97706' : '#64748b';

  return L.divIcon({
    className: 'custom-vehicle-bus-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: ${color}; width: 34px; height: 34px; border-radius: 10px; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
        </div>
        <div style="position: absolute; -top: 6px; width: 14px; height: 14px; transform: rotate(${bus.heading || 0}deg); display: flex; align-items: center; justify-content: center;">
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 8px solid ${color};"></div>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

const startIcon = createCustomIcon('#10b981', 'S', true);      // Green for Start
const destIcon = createCustomIcon('#ef4444', 'D', true);        // Red for Destination
const transferIcon = createCustomIcon('#f59e0b', 'T', true);    // Amber for Transfer
const waypointIcon = createCustomIcon('#3b82f6', '•');         // Blue for intermediate stops

// Component to dynamically fit map bounds
function MapBoundsUpdater({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (e) {
        console.warn('Could not fit map bounds:', e);
      }
    }
  }, [points, map]);
  return null;
}

// Locate Me Trigger Component
function LocateMeButton({ userLocation }) {
  const map = useMap();
  const handleCenter = () => {
    if (userLocation) {
      map.flyTo([userLocation.latitude, userLocation.longitude], 15, { duration: 1.2 });
    }
  };

  if (!userLocation) return null;

  return (
    <button
      type="button"
      onClick={handleCenter}
      className="absolute bottom-5 right-5 z-[1000] p-3 rounded-2xl bg-white hover:bg-brand-50 text-brand-600 shadow-xl border border-slate-200 transition-all hover:scale-110 active:scale-95 flex items-center gap-2 text-xs font-bold pointer-events-auto"
      title="Center on My Location"
    >
      <Crosshair className="w-4 h-4 text-brand-600" />
      <span className="hidden sm:inline">Center My Location</span>
    </button>
  );
}

export default function LeafletMap({ 
  journey = null, 
  allStops = [], 
  selectedRoute = null, 
  userLocation = null,
  trackedBuses = [],
  selectedBus = null,
  onStopSelect = null,
  height = "h-[420px] sm:h-[520px] lg:h-[600px]"
}) {
  const mangaluruCenter = [12.8700, 74.8500]; // Mangaluru Central City coordinate

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
    ...(transferStop ? [[transferStop.latitude, transferStop.longitude]] : []),
    ...(userLocation ? [[userLocation.latitude, userLocation.longitude]] : []),
    ...(selectedBus ? [[selectedBus.latitude, selectedBus.longitude]] : [])
  ];

  return (
    <div className={`relative w-full ${height} rounded-3xl overflow-hidden border border-slate-200 shadow-xl`}>
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs text-slate-700 max-w-[210px] pointer-events-auto">
        <h5 className="font-extrabold text-slate-900 mb-2 uppercase tracking-wider text-[10px]">
          Transit Map Legend
        </h5>
        <div className="space-y-1.5">
          {userLocation && (
            <div className="flex items-center gap-2 font-medium text-brand-700">
              <span className="w-3 h-3 rounded-full bg-blue-600 border border-white inline-block"></span>
              <span>Your Location</span>
            </div>
          )}
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
          {trackedBuses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-600 inline-block"></span>
              <span>Tracked City Bus</span>
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
        <LocateMeButton userLocation={userLocation} />

        {/* User Current Location Marker */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={userLocation.accuracy || 150}
              pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.15, color: '#2563eb', weight: 1.5 }}
            />
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userLocationIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <span className="font-bold text-brand-700 block uppercase">Your Location</span>
                  <span className="text-slate-600">Accurate within ~{Math.round(userLocation.accuracy || 20)}m</span>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Polylines */}
        {segment1Points.length > 1 && (
          <Polyline
            positions={segment1Points}
            color="#2563eb"
            weight={5}
            opacity={0.88}
          />
        )}

        {segment2Points.length > 1 && (
          <Polyline
            positions={segment2Points}
            color="#d97706"
            weight={5}
            opacity={0.88}
            dashArray="6, 8"
          />
        )}

        {/* Start Stop Marker */}
        {startStop && (
          <Marker position={[startStop.latitude, startStop.longitude]} icon={startIcon}>
            <Popup>
              <div className="text-xs p-1">
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
              <div className="text-xs p-1">
                <span className="font-bold text-amber-700 block uppercase">Transfer Junction</span>
                <span className="font-extrabold text-sm text-slate-900 block">{transferStop.name || transferStop.stop_name}</span>
                <p className="text-slate-500 mt-0.5">Change bus here (~{journey?.transfer_wait_minutes || 5} mins wait)</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Stop Marker */}
        {destStop && (
          <Marker position={[destStop.latitude, destStop.longitude]} icon={destIcon}>
            <Popup>
              <div className="text-xs p-1">
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
              <div className="text-xs p-1">
                <span className="text-slate-400 uppercase text-[10px] block">Intermediate Stop</span>
                <span className="font-bold text-slate-800 text-sm">{wp.name || wp.stop_name}</span>
                {wp.location_description && (
                  <p className="text-slate-500 mt-0.5">{wp.location_description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Live / Demo Tracked Buses */}
        {trackedBuses.map((bus) => (
          <Marker
            key={bus.id}
            position={[bus.latitude, bus.longitude]}
            icon={createBusVehicleIcon(bus)}
          >
            <Popup>
              <div className="text-xs p-1 space-y-1">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                  <span className="font-extrabold text-sm text-slate-900">{bus.vehicle_id}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    bus.source_type === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {bus.source_type}
                  </span>
                </div>
                <p className="font-bold text-brand-700">Route {bus.route_code}: {bus.route_name}</p>
                <div className="text-slate-600 space-y-0.5 text-[11px]">
                  <p>Next Stop: <strong className="text-slate-800">{bus.next_stop_name || 'In transit'}</strong> (ETA: ~{bus.eta_minutes}m)</p>
                  <p>Current Speed: <strong className="text-slate-800">{bus.speed} km/h</strong></p>
                  {bus.is_demo && (
                    <p className="text-amber-700 italic pt-1 border-t border-slate-100 text-[10px]">
                      Simulated demo vehicle position.
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Default View: All Mangaluru Stops */}
        {allActivePoints.length === 0 && allStops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.latitude, stop.longitude]}
            icon={waypointIcon}
            eventHandlers={{
              click: () => onStopSelect && onStopSelect(stop)
            }}
          >
            <Popup>
              <div className="text-xs p-1">
                <span className="font-extrabold text-slate-900 text-sm block">{stop.name}</span>
                <p className="text-slate-500 mt-0.5">{stop.location_description}</p>
                {onStopSelect && (
                  <button
                    onClick={() => onStopSelect(stop)}
                    className="mt-2 w-full py-1 bg-brand-600 text-white rounded text-[11px] font-bold"
                  >
                    Select as Starting Point
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}
