import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import JourneyResults from './pages/JourneyResults';
import BusRoutes from './pages/BusRoutes';
import ExploreMap from './pages/ExploreMap';
import LiveTracking from './pages/LiveTracking';
import ExploreMangaluru from './pages/ExploreMangaluru';
import BusSchedules from './pages/BusSchedules';
import SelectSeats from './pages/SelectSeats';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/plan" element={<JourneyResults />} />
              <Route path="/journey-results" element={<JourneyResults />} />
              <Route path="/explore" element={<ExploreMangaluru />} />
              <Route path="/schedules" element={<BusSchedules />} />
              <Route path="/book-seats/:scheduleId" element={<SelectSeats />} />
              <Route path="/booking-confirmation/:bookingRef" element={<BookingConfirmation />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/routes" element={<BusRoutes />} />
              <Route path="/tracking" element={<LiveTracking />} />
              <Route path="/map" element={<ExploreMap />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
