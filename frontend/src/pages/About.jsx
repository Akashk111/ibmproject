import React from 'react';
import { Bus, MapPin, Cpu, ShieldCheck, Compass, GitMerge, Award } from 'lucide-react';
import DemoDataNotice from '../components/DemoDataNotice';

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Page Title */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block">
          Our Mission & Architecture
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          About Mangaluru Bus Connect
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Bridging the information gap in Mangaluru’s public transportation network through intelligent graph routing and transparent schedule information.
        </p>
      </div>

      <DemoDataNotice />

      {/* The Kudla Transit Problem */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Bus className="w-6 h-6 text-brand-600" />
          The Transportation Challenge in Mangaluru
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Mangaluru (Kudla), located between the Arabian Sea and the Western Ghats, is a thriving coastal educational and commercial hub in Karnataka, India. The city relies extensively on a dense network of private city buses operated under the <strong>Dakshina Kannada Bus Operators' Association (DKBOA)</strong> and state-run <strong>KSRTC</strong> city services.
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">
          While buses operate with high frequency along major corridors like State Bank, Hampankatta, Lalbagh, Kadri, and Pumpwell, newcomers, students, tourists, and commuters face several recurring obstacles:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 pt-2 font-medium">
          <li className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0"></span>
            <span>Unclear route connectivity between peripheral neighborhoods without direct buses.</span>
          </li>
          <li className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0"></span>
            <span>Difficulty calculating where to change buses (e.g. State Bank vs Hampankatta).</span>
          </li>
          <li className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0"></span>
            <span>Uncertainty regarding actual waiting times between connecting trips.</span>
          </li>
          <li className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0"></span>
            <span>Lack of digital timetables and map visualization for first-time passengers.</span>
          </li>
        </ul>
      </section>

      {/* The Algorithm & Solution */}
      <section className="bg-gradient-to-br from-brand-900 to-navy-950 text-white p-8 sm:p-10 rounded-3xl shadow-xl space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-bold text-brand-300 uppercase tracking-widest block">
            Algorithm & Routing Logic
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How Our Journey Planner Discovers Routes
          </h2>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed">
          The bus network is modeled as a directed graph $G = (V, E)$, where every bus stop is a vertex $v \in V$, and each scheduled transit service between consecutive stops represents a time-weighted directed edge $e \in E$.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
            <div className="text-brand-300 font-bold text-sm">Stage 1: Direct Discovery</div>
            <p className="text-slate-300 leading-relaxed">
              Finds routes directly connecting origin to destination with zero transfers, evaluating scheduled departures at or after requested time.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
            <div className="text-amber-300 font-bold text-sm">Stage 2: 1-Transfer Dijkstra</div>
            <p className="text-slate-300 leading-relaxed">
              Identifies optimal transfer junctions (such as Hampankatta or State Bank) with a realistic transfer waiting buffer (minimum 5 mins to prevent missed connections).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
            <div className="text-emerald-300 font-bold text-sm">Stage 3: Multi-Criteria Rank</div>
            <p className="text-slate-300 leading-relaxed">
              Sorts all candidate journeys by earliest estimated arrival, shortest travel duration, fewest transfers, and lower fare.
            </p>
          </div>
        </div>
      </section>

      {/* Honest Delay & Uncertainty Philosophy */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          Transparent Uncertainty & Truth in Transit Data
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Many navigation apps mislead passengers by displaying animated "live buses" that are actually fabricated simulations without real GPS tracking feeds.
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">
          At <strong>Mangaluru Bus Connect</strong>, we maintain strict data integrity rules:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <h4 className="font-bold text-emerald-950 mb-1">Schedule-Based Estimations</h4>
            <p className="text-emerald-900/80">Arrival times are calculated strictly from published timetables and average transit segment durations.</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <h4 className="font-bold text-amber-950 mb-1">Peak-Hour Traffic Warnings</h4>
            <p className="text-amber-900/80">Journeys scheduled during Mangaluru peak rush hours (8:30-10:30 AM & 5:00-7:30 PM) display "Possible Delay" alerts.</p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200/80 space-y-4">
        <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
          Technology Stack
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">Frontend</span>
            <span className="text-slate-500">React.js, Vite, Tailwind CSS</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">Backend</span>
            <span className="text-slate-500">Python, Flask REST API, CORS</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">Database</span>
            <span className="text-slate-500">SQLAlchemy ORM (SQLite / PostgreSQL)</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">Mapping</span>
            <span className="text-slate-500">Leaflet.js, React-Leaflet, OpenStreetMap</span>
          </div>
        </div>
      </section>

    </div>
  );
}
