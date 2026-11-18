import React, { useState } from 'react';
import { MapPin, Navigation, Bus, ArrowRight, Sparkles, Clock, IndianRupee, ShieldCheck } from 'lucide-react';

// Authentic Coastal Karnataka & Dakshina Kannada Geography
// Mapped accurately along Arabian Sea coastline (North-South) and Eastward into Bantwal & Puttur
const DESTINATIONS = [
  { id: 14, name: 'Kundapura', district: 'Udupi', x: 210, y: 55, type: 'coastal', fare: 75, duration: '2h 15m', tag: 'Coastal Port & Beach', nh: 'NH-66' },
  { id: 11, name: 'Udupi', district: 'Udupi', x: 235, y: 130, type: 'temple', fare: 65, duration: '1h 30m', tag: 'Sri Krishna Temple', nh: 'NH-66' },
  { id: 12, name: 'Manipal', district: 'Udupi', x: 290, y: 145, type: 'hub', fare: 95, duration: '1h 40m', tag: 'University Town', nh: 'State Hwy 37' },
  { id: 16, name: 'Kaup', district: 'Udupi', x: 245, y: 195, type: 'coastal', fare: 50, duration: '1h 10m', tag: 'Lighthouse Beach', nh: 'NH-66' },
  { id: 17, name: 'Mulki', district: 'Dakshina Kannada', x: 255, y: 255, type: 'coastal', fare: 40, duration: '55 mins', tag: 'Surfing & Temple Hub', nh: 'NH-66' },
  { id: 13, name: 'Surathkal', district: 'Dakshina Kannada', x: 265, y: 310, type: 'coastal', fare: 35, duration: '40 mins', tag: 'NITK & Beach Lighthouse', nh: 'NH-66' },
  { id: 1, name: 'Mangaluru', district: 'Dakshina Kannada', x: 285, y: 385, type: 'central', fare: null, duration: 'Central Hub', tag: 'State Bank & Bejai Terminals', nh: 'NH-66 / NH-75' },
  { id: 18, name: 'Bantwal', district: 'Dakshina Kannada', x: 420, y: 375, type: 'inland', fare: 30, duration: '45 mins', tag: 'B.C. Road Junction', nh: 'NH-73' },
  { id: 15, name: 'Puttur', district: 'Dakshina Kannada', x: 520, y: 440, type: 'inland', fare: 55, duration: '1h 20m', tag: 'Mahalingeshwara Temple', nh: 'SH-88' },
  { id: 9, name: 'Kasaragod', district: 'Kerala Border', x: 305, y: 530, type: 'border', fare: 60, duration: '1h 25m', tag: 'Bekal Fort & Coast', nh: 'NH-66' },
];

// Actual database verified routes and highway corridors connecting these 10 destinations
const ROUTE_CORRIDORS = [
  // NH-66 Coastal North (KA-04, KA-02, 1A)
  { from: 'Kundapura', to: 'Udupi', path: 'M 210 55 Q 220 90 235 130', code: 'KA-04', name: 'NH-66 Kundapura Express' },
  { from: 'Udupi', to: 'Manipal', path: 'M 235 130 L 290 145', code: 'KA-02', name: 'Udupi-Manipal City Link' },
  { from: 'Udupi', to: 'Kaup', path: 'M 235 130 Q 240 160 245 195', code: 'KA-04', name: 'NH-66 Coastal Corridor' },
  { from: 'Kaup', to: 'Mulki', path: 'M 245 195 Q 250 225 255 255', code: 'KA-04', name: 'NH-66 Coastal Line' },
  { from: 'Mulki', to: 'Surathkal', path: 'M 255 255 Q 260 280 265 310', code: 'KA-04', name: 'NH-66 Surathkal Link' },
  { from: 'Surathkal', to: 'Mangaluru', path: 'M 265 310 Q 275 350 285 385', code: '1A', name: 'DKBOA Surathkal 1A' },

  // Dakshina Kannada Eastbound Arterials (KA-06)
  { from: 'Mangaluru', to: 'Bantwal', path: 'M 285 385 Q 350 375 420 375', code: 'KA-06', name: 'NH-73 B.C. Road Line' },
  { from: 'Bantwal', to: 'Puttur', path: 'M 420 375 Q 470 405 520 440', code: 'KA-06', name: 'Puttur Express Corridor' },

  // NH-66 South Coastal Corridor (KA-05)
  { from: 'Mangaluru', to: 'Kasaragod', path: 'M 285 385 Q 295 460 305 530', code: 'KA-05', name: 'Talapady Coastal Express' }
];

export default function RouteVisualization({ onSelectDestination }) {
  const [activeCity, setActiveCity] = useState(DESTINATIONS[6]); // Default to Mangaluru

  const handleCityClick = (city) => {
    setActiveCity(city);
    if (onSelectDestination) {
      onSelectDestination(city);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-[#060f1e] via-[#091a30] to-[#071426] text-white relative overflow-hidden border-b border-slate-800">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[28rem] h-[28rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-extrabold uppercase tracking-widest mb-4">
            <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Coastal Karnataka Highway Network</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Discover Your Next Destination
          </h2>
          
          <p className="mt-3.5 text-slate-300 text-sm sm:text-base font-medium">
            Verified city & express bus routes operating across Dakshina Kannada, Udupi and border coastal hubs.
          </p>
        </div>

        {/* Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Visual SVG Map (7 cols) */}
          <div className="lg:col-span-7 bg-[#0b172a]/85 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-4 sm:p-6 shadow-2xl relative">
            
            {/* Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-400/40" />
                  <span className="font-bold">Central Terminal (Kudla)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Coastal Stop</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Inland Stop</span>
                </span>
              </div>
              <span className="text-[11px] font-bold text-cyan-400">
                Click any stop to select
              </span>
            </div>

            {/* SVG Visual Canvas */}
            <div className="relative w-full aspect-[4/3.4] mt-3 select-none">
              <svg viewBox="0 0 680 580" className="w-full h-full drop-shadow-md">
                
                <defs>
                  {/* Subtle coastal shoreline water overlay */}
                  <linearGradient id="coastalSea" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#082f49" stopOpacity="0.05" />
                  </linearGradient>

                  <filter id="corridorGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Arabian Sea Coastline Contour */}
                <path
                  d="M 120 0 Q 170 180 200 320 T 240 580 L 0 580 L 0 0 Z"
                  fill="url(#coastalSea)"
                  className="opacity-60"
                />
                <text x="35" y="280" fill="#38bdf8" fillOpacity="0.16" fontSize="24" fontWeight="bold" letterSpacing="4">
                  ARABIAN SEA
                </text>
                <text x="440" y="220" fill="#94a3b8" fillOpacity="0.12" fontSize="20" fontWeight="bold" letterSpacing="2">
                  WESTERN GHATS
                </text>

                {/* Connecting Corridor Paths */}
                {ROUTE_CORRIDORS.map((rc, idx) => {
                  const isHighlighted = activeCity && (activeCity.name === rc.from || activeCity.name === rc.to);
                  return (
                    <g key={idx}>
                      {/* Base Track */}
                      <path
                        d={rc.path}
                        fill="none"
                        stroke={isHighlighted ? '#38bdf8' : '#1e3a8a'}
                        strokeWidth={isHighlighted ? '4.5' : '3'}
                        strokeOpacity={isHighlighted ? '0.9' : '0.45'}
                        strokeLinecap="round"
                        filter={isHighlighted ? 'url(#corridorGlow)' : undefined}
                      />
                      {/* Animated traveling dash pulse */}
                      <path
                        d={rc.path}
                        fill="none"
                        stroke={isHighlighted ? '#67e8f9' : '#38bdf8'}
                        strokeWidth={isHighlighted ? '3.5' : '2'}
                        strokeDasharray="6, 12"
                        className="animate-routePulse"
                        strokeLinecap="round"
                        strokeOpacity={isHighlighted ? '1' : '0.75'}
                      />
                    </g>
                  );
                })}

                {/* The 10 Authentic Destination Nodes */}
                {DESTINATIONS.map((city) => {
                  const isSelected = activeCity?.name === city.name;
                  const isMangaluru = city.name === 'Mangaluru';

                  let pinColor = '#38bdf8'; // cyan for coastal
                  if (isMangaluru) pinColor = '#3b82f6';
                  else if (city.type === 'inland') pinColor = '#10b981';
                  else if (city.type === 'temple') pinColor = '#f59e0b';
                  else if (city.type === 'border') pinColor = '#ec4899';

                  return (
                    <g
                      key={city.name}
                      transform={`translate(${city.x}, ${city.y})`}
                      className="cursor-pointer group"
                      onClick={() => handleCityClick(city)}
                    >
                      {/* Pulsating outer beacon */}
                      {(isSelected || isMangaluru) && (
                        <circle
                          r={isMangaluru ? 22 : 16}
                          fill={pinColor}
                          fillOpacity="0.25"
                          className="animate-ping"
                        />
                      )}

                      {/* Halo ring */}
                      <circle
                        r={isMangaluru ? 14 : isSelected ? 11 : 8}
                        fill="#0b172a"
                        stroke={pinColor}
                        strokeWidth={isSelected || isMangaluru ? 3 : 2}
                        className="transition-all duration-200 group-hover:scale-125"
                      />

                      {/* Inner dot */}
                      <circle
                        r={isMangaluru ? 6 : isSelected ? 5 : 4}
                        fill={pinColor}
                        className="group-hover:fill-white transition-colors"
                      />

                      {/* City Text Label */}
                      <text
                        x={city.x > 350 ? 14 : 14}
                        y={4}
                        textAnchor="start"
                        fill={isSelected ? '#38bdf8' : isMangaluru ? '#ffffff' : '#cbd5e1'}
                        fontSize={isMangaluru ? 14 : isSelected ? 12 : 11}
                        fontWeight={isMangaluru || isSelected ? '800' : '600'}
                        className="transition-all select-none group-hover:fill-cyan-300"
                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
                      >
                        {city.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Right Information & Pre-Fill Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {activeCity ? (
              <div className="bg-[#0b172a]/95 backdrop-blur-xl border border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                    {activeCity.tag}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {activeCity.district} • {activeCity.nh}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-white">{activeCity.name}</h3>
                    {activeCity.name === 'Mangaluru' && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                        HQ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-medium">
                    Operating via private city buses (DKBOA) & KSRTC express routes from State Bank & Central Station.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <div className="p-3 bg-slate-900/70 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Starting Fare</span>
                    <span className="text-lg font-black text-emerald-400">
                      {activeCity.fare ? `₹${activeCity.fare}` : 'City Anchor'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/70 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Duration</span>
                    <span className="text-lg font-black text-cyan-300">{activeCity.duration}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCityClick(activeCity)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
                >
                  <span>Select {activeCity.name} In Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            {/* Coastal Karnataka Commuter Tips */}
            <div className="p-5 rounded-3xl bg-[#0b172a]/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Dakshina Kannada Transit Highlights</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">1A:</span>
                  <span>State Bank to Surathkal (NITK) via Ladyhill, Urwa & Kottara Chowki (High Frequency).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">KA-04:</span>
                  <span>Mangaluru to Udupi & Kundapura via Mulki and Kaup along the NH-66 scenic coast.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">KA-06:</span>
                  <span>Express corridor connecting Mangaluru to Bantwal B.C. Road and Puttur.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
