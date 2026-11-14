import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bus, MapPin, Navigation, Clock, ShieldCheck, ArrowRight, 
  Sparkles, CheckCircle2, ChevronRight, Radio, Compass, Map, 
  Layers, Footprints, ShieldAlert 
} from 'lucide-react';
import Bus3DScene from '../components/Bus3DScene';
import SearchCard from '../components/SearchCard';
import DemoDataNotice from '../components/DemoDataNotice';
import { journeyService } from '../api/services';

// Local images
import cityBusImg1 from '../assets/images/city-bus-1.jpg';
import cityBusImg2 from '../assets/images/city-bus-2.jpg';
import coastalBusImg from '../assets/images/coastal-transit.jpg';
import electricBusImg from '../assets/images/electric-bus.jpg';
import coastImg from '../assets/images/mangaluru-coast.jpg';

const POPULAR_DESTINATIONS = [
  {
    name: 'State Bank City Terminal',
    tag: 'Transit Hub',
    desc: 'The central nerve center for private city buses connecting all corners of Mangaluru.',
    routes: 'Routes 1A, 15, 27, 42',
    image: cityBusImg1,
    source: 'State Bank'
  },
  {
    name: 'Hampankatta & Central',
    tag: 'Commercial Center',
    desc: 'Old Bus Stand area, commercial banks, City Centre Mall and Mangaluru Central Railway (MAQ).',
    routes: 'Routes 1A, 15, 19, 27',
    image: cityBusImg2,
    source: 'Hampankatta'
  },
  {
    name: 'Kadri Park & Manjunatha Temple',
    tag: 'Culture & Greenery',
    desc: 'Historic 10th-century temple and the largest green urban park in Dakshina Kannada.',
    routes: 'Routes 15, 19',
    image: electricBusImg,
    source: 'Kadri'
  },
  {
    name: 'Surathkal (NITK Campus)',
    tag: 'Education & Coastal',
    desc: 'National Institute of Technology Karnataka, Sadashiva Temple and Surathkal Beach.',
    routes: 'Route 1A & express lines',
    image: coastalBusImg,
    source: 'Surathkal'
  },
  {
    name: 'Pumpwell (Mahaveera Circle)',
    tag: 'Highway Gateway',
    desc: 'Major intersection connecting National Highway 66 to Bengaluru, Udupi, and Kasaragod.',
    routes: 'Routes 27, 42',
    image: cityBusImg1,
    source: 'Pumpwell'
  },
  {
    name: 'Ullal & Summer Sands Beach',
    tag: 'Heritage & Coastline',
    desc: 'Rani Abbakka historic memorial, Sayyid Madani Dargah and serene Arabian Sea resort shores.',
    routes: 'Route 42 Suburban Line',
    image: coastImg,
    source: 'Ullal'
  }
];

const POPULAR_STOPS_LIST = [
  { name: 'State Bank', desc: 'City Bus Terminal, Car Street' },
  { name: 'Hampankatta', desc: 'Central Commercial Hub, City Centre' },
  { name: 'Kankanady', desc: 'Fr Muller Hospital, Flower Market' },
  { name: 'Kadri', desc: 'Manjunatha Temple, Kadri Park' },
  { name: 'Lalbagh', desc: 'Mangaluru City Corporation (MCC)' },
  { name: 'Bejai', desc: 'KSRTC Inter-city Bus Stand' },
  { name: 'Pumpwell', desc: 'Mahaveera Circle, NH-66 Gateway' },
  { name: 'Urwa Market', desc: 'Urwa Stores, Residential District' },
  { name: 'Surathkal', desc: 'NITK Campus, Lighthouse Road' },
  { name: 'Mangaluru Central', desc: 'Central Railway Station (MAQ)' },
  { name: 'Mangaluru Junction', desc: 'Junction Railway Station (MAJN)' },
  { name: 'Ullal', desc: 'Rani Abbakka Circle, Beach' },
];

export default function Home() {
  const [stats, setStats] = useState({
    total_stops: 16,
    total_routes: 9,
    total_services: 125,
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await journeyService.getStats();
        if (res) setStats(res);
      } catch (err) {
        console.warn('Using default statistics');
      }
    }
    loadStats();
  }, []);

  const handlePlanTrip = (stopName) => {
    navigate('/plan', {
      state: {
        initialSource: 'State Bank',
        initialDest: stopName
      }
    });
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 bg-[#f4f7fb]">
      
      {/* 3D FUTURISTIC HERO SECTION */}
      <section className="relative overflow-hidden min-h-[680px] lg:min-h-[760px] flex items-center justify-center pt-20 pb-28 text-white bg-[#071426]">
        
        {/* Interactive Three.js 3D Bus Scene with Fallback */}
        <Bus3DScene />

        {/* Ambient Radial Vignette for Content Focus */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#071426] via-[#071426]/60 to-transparent pointer-events-none"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4">
          
          <div className="text-center max-w-4xl mx-auto space-y-4 mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-xl">
              <Sparkles className="w-3.5 h-3.5 text-brand-300 animate-spin" />
              <span>Next-Generation Kudla Transit Portal</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight sm:leading-none text-white drop-shadow-2xl">
              DISCOVER MANGALURU. <br />
              <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-amber-200 bg-clip-text text-transparent">
                TRAVEL WITHOUT LIMITS.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-md">
              Your intelligent city bus companion. Discover routes, track journeys and explore Mangaluru with confidence.
            </p>

            {/* Quick Action Navigation Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <Link
                to="/tracking"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-extrabold backdrop-blur-md border border-emerald-500/30 transition-all hover:scale-105"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Live Bus Tracking</span>
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-xs font-extrabold backdrop-blur-md border border-blue-500/30 transition-all hover:scale-105"
              >
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>Explore Interactive Map</span>
              </Link>
            </div>
          </div>

          {/* Floating Search Card with Automatic Place Search & Location */}
          <div className="max-w-4xl mx-auto relative z-30">
            <SearchCard />
          </div>

          <div className="mt-8 max-w-4xl mx-auto">
            <DemoDataNotice />
          </div>

        </div>
      </section>

      {/* STATISTICS METRICS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-16 relative z-30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100">
          
          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-3xl sm:text-4xl font-black text-brand-600 mb-1">
              {stats.total_stops}+
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">Verified Bus Stops</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Real GPS coordinates</p>
          </div>

          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-3xl sm:text-4xl font-black text-brand-600 mb-1">
              {stats.total_routes}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">Active Bus Lines</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Direct & connecting paths</p>
          </div>

          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-3xl sm:text-4xl font-black text-brand-600 mb-1">
              {stats.total_services}+
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">Daily Departures</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Published timetables</p>
          </div>

          <div className="text-center p-3">
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 mb-1">
              100%
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">Honest Estimations</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Zero fake tracking</p>
          </div>

        </div>
      </section>

      {/* DEDICATED LIVE TRACKING & INTERACTIVE MAP CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Live Tracking Feature */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 text-white group h-72 flex flex-col justify-between p-7 bg-navy-900">
            <img
              src={cityBusImg1}
              alt="Mangaluru City Bus Telematics"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.3]"
            />
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/90 text-white flex items-center gap-1.5 uppercase tracking-wider shadow">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Live Fleet Tracking
              </span>
              <span className="text-xs text-slate-300 font-mono">Telematics v2.0</span>
            </div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Live Bus Movement & Telematics
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                Follow real vehicle positions, vehicle speed, heading, and arrival ETAs across Mangaluru routes.
              </p>
              <Link
                to="/tracking"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white pt-2 group-hover:translate-x-1 transition-all"
              >
                <span>Open Live Tracking Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Interactive Map Feature */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 text-white group h-72 flex flex-col justify-between p-7 bg-navy-900">
            <img
              src={coastalBusImg}
              alt="Coastal highway transit map"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.3]"
            />
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-brand-500/90 text-white flex items-center gap-1.5 uppercase tracking-wider shadow">
                <Compass className="w-3.5 h-3.5" />
                Explore City Map
              </span>
              <span className="text-xs text-slate-300 font-mono">OpenStreetMap</span>
            </div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Locate Nearest Stops Near You
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                Use your device GPS to locate nearby bus stops, calculate walking durations, and inspect route paths.
              </p>
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-200 hover:text-white pt-2 group-hover:translate-x-1 transition-all"
              >
                <span>Launch Interactive Map</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* POPULAR MANGALURU DESTINATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
              Kudla Key Destinations
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Popular Mangaluru Corridors
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Major passenger destinations commuted across Mangaluru's urban network.
            </p>
          </div>
          <Link
            to="/routes"
            className="mt-4 sm:mt-0 text-sm font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 group"
          >
            <span>Explore all bus lines</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_DESTINATIONS.map((dest) => (
            <div
              key={dest.name}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-2xl hover:border-brand-300 transition-all group flex flex-col justify-between"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <span className="absolute top-3.5 left-3.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-white/95 text-slate-900 shadow">
                  {dest.tag}
                </span>
                <h3 className="absolute bottom-3.5 left-3.5 text-lg font-black text-white">
                  {dest.name}
                </h3>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {dest.desc}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold truncate max-w-[170px]">
                    {dest.routes}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlanTrip(dest.source)}
                    className="font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                  >
                    <span>Plan Trip</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR BUS STOPS DIRECTORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
                Stop Directory
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Key Bus Stops in Mangaluru
              </h3>
            </div>
            <Link
              to="/map"
              className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>View stops on full interactive map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {POPULAR_STOPS_LIST.map((st) => (
              <div
                key={st.name}
                onClick={() => handlePlanTrip(st.name)}
                className="p-3 bg-slate-50 hover:bg-brand-50 rounded-2xl border border-slate-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900 group-hover:text-brand-700">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>{st.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-100/70 py-16 sm:py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
              Step-by-step
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How Mangaluru Bus Connect Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Our graph-based routing algorithm evaluates all direct lines and valid 1-transfer connections to find your fastest journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Automatic Place Search
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click "USE MY CURRENT LOCATION" or type any Mangaluru stop, landmark, or street name.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Select Destination
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pick your destination, desired departure time, and travel day.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Discover Best Bus Routes
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our algorithm discovers direct routes and 1-transfer options ranked by earliest arrival time.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Follow Step-by-Step Directions
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                View boarding stops, transfer junctions, map routes, and accurate waiting durations.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* WHY CHOOSE MANGALURU BUS CONNECT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
                Kudla Commuter Trust
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Built to Solve Mangaluru’s Transportation Puzzles
              </h2>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed">
              Mangaluru features dozens of private and KSRTC bus operators. While buses run frequently, route numbers and transfer points can be baffling for newcomers, college students, and tourists.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Automated Location & Place Search</h4>
                  <p className="text-xs text-slate-500">Search by bus stop, shopping mall, hospital, college, or beach. The app maps non-stop places to their nearest boarding stop.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Direct & 1-Transfer Graph Search</h4>
                  <p className="text-xs text-slate-500">Evaluates network connections to find convenient transfer junctions (State Bank, Hampankatta, Lalbagh) with minimum 5-minute connection buffers.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Truth in Telematics</h4>
                  <p className="text-xs text-slate-500">We never fake GPS live tracking. We clearly distinguish published schedules, peak-hour rush warnings, and hardware-authenticated live tracking feeds.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/plan"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold shadow-lg hover:shadow-xl transition-all"
              >
                <span>Start Planning Your Journey</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-50 to-blue-50 p-6 sm:p-8 rounded-3xl border border-brand-100 shadow-inner space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-brand-200/60">
              <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Real Mangaluru Transit Graph</h4>
                <p className="text-xs text-slate-500">Powered by time-dependent Dijkstra shortest-path algorithms</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm space-y-3 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Verified Sample Transfer</span>
                <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">1 Transfer</span>
              </div>
              <p className="font-black text-slate-900 text-sm">Kadri Park ➔ Surathkal (NITK)</p>
              <div className="pl-3 border-l-2 border-brand-500 space-y-1.5 text-slate-600 text-[11px]">
                <p>1. Board Route 15 at Kadri (08:00 AM)</p>
                <p>2. Alight at Lalbagh (08:12 AM)</p>
                <p>3. Wait 8 mins, change to Route 1A (08:20 AM)</p>
                <p>4. Reach Surathkal Beach at 09:00 AM</p>
              </div>
              <div className="pt-2 flex justify-between items-center text-slate-500 border-t border-slate-100 text-[11px]">
                <span>Total Travel: <strong>60 mins</strong></span>
                <span className="font-extrabold text-slate-900">Fare: ₹45</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed italic text-center">
              "Your City. Your Route. Your Journey. Navigating Kudla with ease."
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
