import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, MapPin, Navigation, Clock, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import SearchCard from '../components/SearchCard';
import DemoDataNotice from '../components/DemoDataNotice';
import { journeyService } from '../api/services';

const DESTINATIONS = [
  {
    name: 'State Bank',
    tag: 'Transit Hub',
    desc: 'The central nerve center for private city buses connecting all corners of Mangaluru.',
    routes: 'Routes 1A, 15, 27, 42'
  },
  {
    name: 'Hampankatta',
    tag: 'Commercial Center',
    desc: 'Old Bus Stand area, vibrant markets, commercial banks and shopping malls.',
    routes: 'All major transit lines'
  },
  {
    name: 'Kadri Park & Temple',
    tag: 'Culture & Greenery',
    desc: 'Historic 10th-century Manjunatha Temple and the largest urban park in Mangaluru.',
    routes: 'Routes 15, 19'
  },
  {
    name: 'Surathkal (NITK)',
    tag: 'Education & Coastal',
    desc: 'National Institute of Technology Karnataka campus, lighthouse and pristine beaches.',
    routes: 'Route 1A & express buses'
  },
  {
    name: 'Pumpwell (Mahaveera Circle)',
    tag: 'Highway Gateway',
    desc: 'Strategic intersection for buses heading towards Kerala, Bengaluru and Udupi.',
    routes: 'Routes 27, 42'
  },
  {
    name: 'Kankanady',
    tag: 'Healthcare & Market',
    desc: 'Fr Muller Hospital, vibrant flower markets, and connectivity to Mangaluru Junction.',
    routes: 'Routes 27, 42'
  }
];

export default function Home() {
  const [stats, setStats] = useState({
    total_stops: 16,
    total_routes: 9,
    total_services: 120,
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await journeyService.getStats();
        if (res) {
          setStats(res);
        }
      } catch (err) {
        console.warn('Using default statistics');
      }
    }
    loadStats();
  }, []);

  const handleQuickDestination = (destName) => {
    navigate('/plan', {
      state: {
        initialSource: 'State Bank',
        initialDest: destName
      }
    });
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-950 to-slate-950 pt-12 pb-24 sm:pt-20 sm:pb-32 text-white">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-700/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Smart City Transit Planner for Kudla</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
              Explore Mangaluru. <br />
              <span className="bg-gradient-to-r from-brand-400 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                Travel Smarter.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
              Find the best bus routes across Mangaluru. Plan your journey, discover direct connections, calculate waiting times, and travel confidently.
            </p>
          </div>

          {/* Interactive Search Card Embedded in Hero */}
          <div className="max-w-4xl mx-auto relative z-20">
            <SearchCard />
          </div>

          <div className="mt-8 max-w-4xl mx-auto">
            <DemoDataNotice />
          </div>

        </div>
      </section>

      {/* Database-Driven Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-16 relative z-30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100">
          
          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-3xl sm:text-4xl font-extrabold text-brand-600 mb-1">
              {stats.total_stops}+
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600">Active Bus Stops</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Verified GPS coordinates</p>
          </div>

          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-3xl sm:text-4xl font-extrabold text-brand-600 mb-1">
              {stats.total_routes}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600">City Bus Routes</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Direct & connecting paths</p>
          </div>

          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-3xl sm:text-4xl font-extrabold text-brand-600 mb-1">
              {stats.total_services}+
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600">Timetable Departures</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Scheduled daily trips</p>
          </div>

          <div className="text-center p-3">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mb-1">
              100%
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600">Honest Estimates</div>
            <p className="text-[11px] text-slate-400 mt-0.5">No fake live tracking</p>
          </div>

        </div>
      </section>

      {/* Popular Mangaluru Destinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
              Discover Kudla
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular City Destinations
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Major hubs frequently commuted by Mangaluru residents and visitors.
            </p>
          </div>
          <Link
            to="/routes"
            className="mt-4 sm:mt-0 text-sm font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 group"
          >
            <span>View all bus routes</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.name}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-brand-300 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">
                    {dest.tag}
                  </span>
                  <MapPin className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {dest.name}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {dest.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium truncate max-w-[170px]">
                  {dest.routes}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickDestination(dest.name)}
                  className="font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                >
                  <span>Plan Trip</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-100/70 py-16 sm:py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
              Step-by-step
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How Mangaluru Bus Connect Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Our intelligent routing algorithm evaluates all direct lines and valid 1-transfer connections to find your fastest journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 font-extrabold text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Enter Starting Point
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Choose your pickup stop from our verified list of Mangaluru bus stops.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 font-extrabold text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Select Destination
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pick your dropping stop, desired departure time, and day of travel.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 font-extrabold text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Discover Best Bus Journey
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our algorithm discovers direct buses and 1-transfer options ranked by earliest arrival time.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 font-extrabold text-lg flex items-center justify-center mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Follow Journey Directions
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                View boarding stops, transfer junctions, map routes, and accurate waiting durations.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
                Commuter Confidence
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Designed to Solve Mangaluru’s Public Transit Challenges
              </h2>
            </div>
            
            <p className="text-slate-600 leading-relaxed">
              Mangaluru’s city bus network features dozens of private and KSRTC operators. While frequent, routes and transfer points are rarely clear to first-time passengers, students, or visitors.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Smart Journey Planning</h4>
                  <p className="text-xs text-slate-500">Evaluates whole-city network graph to calculate exact waiting, riding, and transfer intervals.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Direct & Transfer Connections</h4>
                  <p className="text-xs text-slate-500">If no direct bus exists, our 1-transfer algorithm finds convenient connection hubs like State Bank, Hampankatta, or Lalbagh.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Transparent Uncertainty Indicators</h4>
                  <p className="text-xs text-slate-500">We never fake GPS live tracking. We clearly distinguish published schedules, peak-hour traffic conditions, and demonstration records.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/plan"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>Try the Journey Planner</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-50 to-blue-50/50 p-6 sm:p-8 rounded-3xl border border-brand-100 shadow-inner space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-brand-200/60">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Real Mangaluru Transit Graph</h4>
                <p className="text-xs text-slate-500">Powered by Dijkstra shortest-path algorithms</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Sample Transfer Search</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">1 Transfer</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">Kadri ➔ Surathkal (NITK)</p>
              <div className="pl-3 border-l-2 border-brand-500 space-y-1 text-slate-600">
                <p>1. Board Route 15 at Kadri (08:00 AM)</p>
                <p>2. Alight at Lalbagh (08:12 AM)</p>
                <p>3. Wait 8 mins, change to Route 1A (08:20 AM)</p>
                <p>4. Reach Surathkal at 09:00 AM</p>
              </div>
              <div className="pt-2 flex justify-between items-center text-slate-500 border-t border-slate-100 text-[11px]">
                <span>Total Duration: 60 mins</span>
                <span className="font-bold text-slate-800">Fare: ₹45</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed italic">
              "Finally, a clean transit guide for Kudla that makes catching city buses effortless!"
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
