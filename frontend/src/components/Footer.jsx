import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, MapPin, Shield, Mail, Phone, ChevronRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#102B4E] text-slate-300 border-t border-[#0756B8]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0756B8] flex items-center justify-center text-white shadow-md flex-shrink-0">
                <Bus className="w-6 h-6 text-white stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-lg text-white tracking-tight">
                  MANGALURU
                </span>
                <span className="font-black text-lg text-blue-300 tracking-tight">
                  BUS CONNECT
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-300/90 leading-relaxed">
              Clean, reliable and modern transit information for Mangaluru’s city bus commuter network. Discover local bus stops, verified daily routes, schedules, and live telemetry across Kudla.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-200 bg-[#0756B8]/20 p-2.5 rounded-lg border border-[#0756B8]/40">
              <Shield className="w-4 h-4 text-blue-300 flex-shrink-0" />
              <span>Official city commuter schedule reference system.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              Transit Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/plan" className="hover:text-blue-300 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>Plan Journey</span>
                </Link>
              </li>
              <li>
                <Link to="/routes" className="hover:text-blue-300 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>City Bus Routes</span>
                </Link>
              </li>
              <li>
                <a href="#popular-stops" className="hover:text-blue-300 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>Bus Stops Directory</span>
                </a>
              </li>
              <li>
                <Link to="/tracking" className="hover:text-blue-300 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>Live Bus Tracking</span>
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-blue-300 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>My Bookings</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Key Terminals */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              Major City Terminals
            </h3>
            <ul className="space-y-2 text-sm text-slate-300/90">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>State Bank Main Bus Stand Hub</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Surathkal (NITK & Coastal Terminal)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>KSRTC Bejai Central Bus Terminal</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Hampankatta & Clock Tower Circle</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Pumpwell (Mahaveera Circle Gateway)</span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              Commuter Support
            </h3>
            <div className="space-y-3 text-sm text-slate-300/90">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-300 mt-1 flex-shrink-0" />
                <span>Central Bus Terminal, State Bank, Mangaluru, DK - 575001</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-300 flex-shrink-0" />
                <a href="mailto:support@mangalurusmartbus.in" className="hover:text-white transition-colors">
                  support@mangalurusmartbus.in
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-300 flex-shrink-0" />
                <span>+91 824 222 3456 (06:00 - 22:00 IST)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Mangaluru Landmarks & Appreciation Strip */}
        <div className="my-10 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <h4 className="text-base font-black text-white">
              Thank you for travelling with Mangaluru Bus Connect!
            </h4>
            <p className="text-xs text-blue-200/80">
              Connecting Panambur, State Bank, Hampankatta, Kadri, Lalbagh, Surathkal & all of Dakshina Kannada.
            </p>
          </div>
          {/* Subtle Mangaluru Landmark Illustrations / Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-300">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">🏖️ Panambur Beach</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">🏰 Sultan Battery</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">⛪ St. Aloysius</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">🛕 Kadri Temple</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">🌉 Netravati Bridge</span>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Mangaluru Bus Connect. Built for the public commuters of Mangaluru, Dakshina Kannada.</p>
          <div className="flex items-center gap-6 text-slate-300">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/about" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/about" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}