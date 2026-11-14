import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, MapPin, Heart, Shield, Mail, Phone, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
                <div className="relative">
                  <Bus className="w-5 h-5 text-white" />
                  <MapPin className="w-3.5 h-3.5 text-amber-300 absolute -bottom-1 -right-1" />
                </div>
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                MANGALURU BUS CONNECT
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your City. Your Route. Your Journey. An intelligent transit companion helping commuters and visitors navigate Mangaluru’s city bus network effortlessly.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400/90 bg-navy-900/80 p-2.5 rounded-lg border border-navy-800">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Timetable reference platform for public commuters.</span>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Explore Transit
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/plan" className="hover:text-brand-400 transition-colors">
                  Plan Bus Journey
                </Link>
              </li>
              <li>
                <Link to="/routes" className="hover:text-brand-400 transition-colors">
                  Mangaluru Bus Routes Directory
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-400 transition-colors">
                  About the Platform
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-400 transition-colors">
                  Transit Help & Contact
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-brand-400 transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Key Mangaluru Hubs */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Major Transit Hubs
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                <span>State Bank City Bus Stand</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                <span>Hampankatta & Central Railway (MAQ)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                <span>Pumpwell (Mahaveera) Highway Circle</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                <span>Bejai KSRTC Inter-city Stand</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                <span>Surathkal (NITK) / Kottara Junction</span>
              </li>
            </ul>
          </div>

          {/* Contact & Disclaimer */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Transit Notice
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Timetable estimates are generated based on published schedules and representative transit models. Real-world traffic may affect timings.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                <span>support@mangaluru-busconnect.in</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-brand-400" />
                <span>Helpline: +91 824 222 0000</span>
              </p>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Mangaluru Bus Connect. Built with pride for Kudla commuters.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-slate-400">Privacy Policy</Link>
            <Link to="/about" className="hover:text-slate-400">Terms & Conditions</Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Dakshina Kannada, Karnataka</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
