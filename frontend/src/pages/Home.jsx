import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bus, MapPin, Navigation, Clock, ShieldCheck, ArrowRight, 
  Sparkles, CheckCircle2, ChevronRight, Radio, Compass, Map 
} from 'lucide-react';
import SearchCard from '../components/SearchCard';
import DemoDataNotice from '../components/DemoDataNotice';
import { journeyService } from '../api/services';

// Local high quality imagery
import heroBusImg from '../assets/images/hero-bus.jpg';
import cityBusImg1 from '../assets/images/city-bus-1.jpg';
import cityBusImg2 from '../assets/images/city-bus-2.jpg';
import coastalBusImg from '../assets/images/coastal-transit.jpg';
import electricBusImg from '../assets/images/electric-bus.jpg';
import coastImg from '../assets/images/mangaluru-coast.jpg';

const DESTINATIONS = [
  {
    name: 'State Bank',
    tag: 'Transit Hub',
    desc: 'The central nerve center for private city buses connecting all corners of Mangaluru.',
    routes: 'Routes 1A, 15, 27, 42',
    image: cityBusImg1
  },
  {
    name: 'Hampankatta',
    tag: 'Commercial Center',
    desc: 'Old Bus Stand area, vibrant markets, commercial banks and shopping malls.',
    routes: 'All major transit lines',
    image: cityBusImg2
  },
  {
    name: 'Kadri Park & Temple',
    tag: 'Culture & Greenery',
    desc: 'Historic 10th-century Manjunatha Temple and the largest urban park in Mangaluru.',
    routes: 'Routes 15, 19',
    image: electricBusImg
  },
  {
    name: 'Surathkal (NITK)',
    tag: 'Education & Coastal',
    desc: 'National Institute of Technology Karnataka campus, lighthouse and pristine beaches.',
    routes: 'Route 1A & express buses',
    image: coastalBusImg
  },
  {
    name: 'Pumpwell (Mahaveera Circle)',
    tag: 'Highway Gateway',
    desc: 'Strategic intersection for buses heading towards Kerala, Bengaluru and Udupi.',
    routes: 'Routes 27, 42',
    image: cityBusImg1
  },
  {
    name: 'Ullal & Summer Sands',
    tag: 'Heritage & Coast',
    desc: 'Rani Abbakka historic circle, Sayyid Madani Dargah and serene Arabian Sea coastline.',
    routes: 'Route 42 Suburban Line',
    image: coastImg
  }
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
      
      {/* Premium Hero Section with Large Real Bus Photography & Dark Gradient Overlay */}
      <section className="relative overflow-hidden min-h-[640px] lg:min-h-[720px] flex items-center justify-center pt-16 pb-28 text-white">
        
        {/* Real High-Resolution Bus Photography Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBusImg}
            alt="Modern passenger bus travelling across road"
            className="w-full h-full object-cover object-center scale-105 animate-pulse duration-[10000ms]"
          />
          {/* Deep Navy/Black Gradient Overlay for Crisp Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-navy-950/85 to-navy-900/75 backdrop-blur-[1px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/40 text-brand-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-brand-300 animate-spin" />
              <span>Next-Gen City Transit for Mangaluru (Kudla)</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white drop-shadow-md">
              Your Journey Across Mangaluru <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-brand-300 via-blue-200 to-amber-200 bg-clip-text text-transparent">
                Starts Here.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal drop-shadow">
              Find buses, explore routes and travel smarter with Mangaluru Bus Connect.
            </p>

            {/* Quick Links Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Link
                to="/tracking"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all hover:scale-105"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Live Bus Tracking</span>
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all hover:scale-105"
              >
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>Explore City Map</span>
              </Link>
            </div>
          </div>

          {/* Floating Journey Search Card with Geolocation Button */}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100">
          
          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-3xl sm:text-4xl font-extrabold text-brand-600 mb-1">
              {stats.total_stops}+
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-700">Verified Bus Stops</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Accurate GPS locations</p>
          </div>

          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-3xl sm:text-4xl font-extrabold text-brand-600 mb-1">
              {stats.total_routes}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-700">Active Bus Lines</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Direct & connecting routes</p>
          </div>

          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-3xl sm:text-4xl font-extrabold text-brand-600 mb-1">
              {stats.total_services}+
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-700">Scheduled Departures</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Daily published timetables</p>
          </div>

          <div className="text-center p-3">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mb-1">
              100%
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-700">Honest Estimations</div>
            <p className="text-[11px] text-slate-400 mt-0.5">No fake GPS simulations</p>
          </div>

        </div>
      </section>

      {/* Feature Banners: Live Tracking & Geolocation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Live Bus Tracking */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 text-white group h-64 flex flex-col justify-between p-6">
            <img
              src={cityBusImg1}
              alt="Mangaluru City Bus Fleet"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.35]"
            />
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/90 text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Live Tracking
              </span>
              <span className="text-xs text-slate-300">GPS Telematics</span>
            </div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl font-extrabold text-white">
                Track City Buses in Real Time
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed font-light">
                Follow vehicle movement, next stop ETAs, speed, and heading across Mangaluru routes.
              </p>
              <Link
                to="/tracking"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white pt-1"
              >
                <span>Launch Live Tracking Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Interactive City Map & Geolocation */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 text-white group h-64 flex flex-col justify-between p-6">
            <img
              src={coastalBusImg}
              alt="Coastal highway transit"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.35]"
            />
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand-500/90 text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                Explore Map
              </span>
              <span className="text-xs text-slate-300">OpenStreetMap</span>
            </div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl font-extrabold text-white">
                Find Nearest Bus Stops Near You
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed font-light">
                Use your browser GPS location to locate walking distances and nearest transit boarding points.
              </p>
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-200 hover:text-white pt-1"
              >
                <span>Open Interactive Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Popular Mangaluru Destinations with High-Quality Bus Imagery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
              Explore Kudla Transit
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular City Destinations & Bus Corridors
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Major passenger hubs frequently commuted across Mangaluru's urban agglomeration.
            </p>
          </div>
          <Link
            to="/routes"
            className="mt-4 sm:mt-0 text-sm font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 group"
          >
            <span>View all bus lines</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.name}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all group flex flex-col justify-between"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-slate-900 shadow">
                  {dest.tag}
                </span>
                <h3 className="absolute bottom-3 left-3 text-lg font-extrabold text-white">
                  {dest.name}
                </h3>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {dest.desc}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
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
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-100/70 py-16 sm:py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">
              Simple 4 Steps
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How Mangaluru Bus Connect Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Our graph-based routing algorithm evaluates all direct lines and valid 1-transfer connections to find your fastest journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-extrabold text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Enter Starting Point
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click "Use My Current Location" or select your pickup stop from our verified list.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-extrabold text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Select Destination
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pick your dropping stop, desired departure time, and day of travel.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-extrabold text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Discover Best Bus Journey
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our algorithm discovers direct buses and 1-transfer options ranked by earliest arrival time.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-extrabold text-lg flex items-center justify-center mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Follow Journey Directions
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                View boarding stops, transfer junctions, map routes, and accurate waiting durations.
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
