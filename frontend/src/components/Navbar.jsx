import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bus, MapPin, Menu, X, User as UserIcon, LogOut, ShieldCheck, Radio, Route as RouteIcon, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Plan Journey', path: '/plan' },
    { name: 'City Bus Routes', path: '/routes' },
    { name: 'Bus Stops', path: '/#popular-stops', isHash: true },
    { name: 'Live Tracking', path: '/tracking' },
    { name: 'My Bookings', path: '/my-bookings' },
    { name: 'Help', path: '/contact' },
  ];

  const handleNavClick = (link) => {
    if (link.isHash) {
      if (location.pathname === '/') {
        const el = document.getElementById('popular-stops');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/#popular-stops');
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#102B4E] border-b border-[#0756B8]/30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0756B8] flex items-center justify-center text-white shadow-md group-hover:bg-blue-600 transition-colors flex-shrink-0">
              <Bus className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-lg sm:text-xl tracking-tight text-white">
                  MANGALURU
                </span>
                <span className="font-black text-lg sm:text-xl tracking-tight text-blue-300">
                  BUS CONNECT
                </span>
              </div>
              <p className="text-[10px] text-blue-200/80 font-medium tracking-wider uppercase hidden sm:block">
                City Bus Transit Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = !link.isHash && location.pathname === link.path;
              if (link.isHash) {
                return (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link)}
                    className="px-3.5 py-2 rounded-lg text-xs xl:text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {link.name}
                  </button>
                );
              }
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-colors ${
                    active
                      ? 'text-white bg-[#0756B8] shadow-sm'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Auth Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs xl:text-sm font-semibold text-white hover:bg-white/10 transition-colors border border-white/15 bg-white/5"
                  title="Passenger Account"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0756B8] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-blue-200 block font-normal leading-tight">Passenger Account</span>
                    <span className="font-bold text-white max-w-[120px] truncate block leading-tight">{user?.name}</span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-300 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs xl:text-sm font-semibold text-white hover:bg-white/10 rounded-lg transition-colors border border-white/20"
                >
                  <UserIcon className="w-3.5 h-3.5 text-blue-300" />
                  <span>Passenger Account</span>
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs xl:text-sm font-bold text-white bg-[#0756B8] hover:bg-blue-600 rounded-lg shadow-sm transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#102B4E] px-4 pt-3 pb-6 space-y-1.5 shadow-2xl animate-fadeIn">
          {navLinks.map((link) => (
            link.isHash ? (
              <button
                key={link.name}
                onClick={() => handleNavClick(link)}
                className="w-full text-left block px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                {link.name}
              </button>
            ) : (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-lg text-sm font-semibold ${
                  location.pathname === link.path
                    ? 'bg-[#0756B8] text-white'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                {link.name}
              </Link>
            )
          ))}

          <div className="pt-4 border-t border-white/10 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-white hover:bg-white/10"
                >
                  <UserIcon className="w-4 h-4 text-blue-300" />
                  <span>Passenger Account ({user?.name})</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-amber-300 font-bold hover:bg-white/10"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Admin Portal</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-rose-300 hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-lg border border-white/20 font-semibold text-white hover:bg-white/10 text-xs flex items-center justify-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5 text-blue-300" />
                  <span>Passenger Account</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-lg bg-[#0756B8] text-white font-bold hover:bg-blue-600 text-xs flex items-center justify-center"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}