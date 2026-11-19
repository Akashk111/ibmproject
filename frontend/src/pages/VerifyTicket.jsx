import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Bus,
  MapPin, Clock, Calendar, Users, IndianRupee, ArrowLeft, QrCode
} from 'lucide-react';
import { bookingService } from '../api/services';
import QRCodeDisplay from '../components/QRCodeDisplay';

export default function VerifyTicket() {
  const { reference } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [verifiedTime, setVerifiedTime] = useState('');

  useEffect(() => {
    verifyPass();
  }, [reference]);

  const verifyPass = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bookingService.verifyTicket(reference);
      setData(res);
      setVerifiedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Ticket verification error:', err);
      setError(err.message || 'Ticket could not be verified or reference is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Top Back Nav */}
        <div className="flex items-center justify-between">
          <Link
            to="/my-bookings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>

          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-navy-900 text-amber-400">
            DKBOA Conductor Terminal
          </span>
        </div>

        {/* Verification Card */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-slate-200">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold text-slate-700 text-sm">Verifying ticket in Mangaluru Bus Connect registry...</p>
          </div>
        ) : error || !data?.valid ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border-2 border-rose-300 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold uppercase tracking-wider">
              Verification Failed
            </div>

            <h1 className="text-2xl font-black text-slate-900">
              Invalid or Cancelled Boarding Pass
            </h1>

            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {error || data?.reason || 'This reference number does not exist or has been cancelled.'}
            </p>

            <p className="font-mono text-xs text-slate-400 pt-2">
              Reference: {reference}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 space-y-6">

            {/* Verified Conductor Seal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 text-center space-y-3">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-white/30">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>

              <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-extrabold tracking-wider uppercase border border-white/20">
                Official Boarding Pass Verified
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                VALID TICKET CONFIRMED
              </h1>

              <p className="text-xs text-emerald-100 font-medium">
                Verified at {verifiedTime} • Bus Connect Transit Security
              </p>
            </div>

            {/* Passenger & Journey Particulars */}
            <div className="p-6 sm:p-8 space-y-6">

              {/* Route & Vehicle */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {data.booking_reference}
                    </span>
                    <span className="text-xs font-extrabold text-slate-700">
                      Route {data.journey_details?.route_code}
                    </span>
                  </div>

                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {data.payment?.status || 'PAID'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm sm:text-base font-black text-slate-900">
                  <span>{data.journey_details?.from_stop}</span>
                  <span className="text-brand-600">➔</span>
                  <span>{data.journey_details?.to_stop}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs text-slate-600 font-semibold">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Bus Number</span>
                    <span className="font-bold text-slate-800">{data.journey_details?.vehicle_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Travel Date</span>
                    <span className="font-bold text-slate-800">{data.journey_details?.travel_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Departure</span>
                    <span className="font-bold text-slate-800">{data.journey_details?.departure_time}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Expected ETA</span>
                    <span className="font-bold text-emerald-700">{data.journey_details?.expected_arrival_time || 'On-Time'}</span>
                  </div>
                </div>

                {data.journey_details?.distance_km && (
                  <div className="pt-2 text-xs text-slate-500 font-medium">
                    Road Distance: <strong className="text-slate-800">{data.journey_details.distance_km} KM</strong>
                  </div>
                )}
              </div>

              {/* Passenger Manifest */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-600" />
                  <span>Passenger Manifest ({data.passengers?.length || 0} Commuters)</span>
                </h3>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {data.passengers?.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-white text-xs">
                      <div>
                        <span className="font-black text-slate-900 block">{p.passenger_name}</span>
                        <span className="text-[10px] text-slate-400">Gender: {p.passenger_gender}</span>
                      </div>
                      <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                        Seat {p.seat_number}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Receipt */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-blue-800 font-bold uppercase block">Payment Verification</span>
                  <span className="text-slate-600 font-medium">Gateway: Paytm Sandbox Checksum Verified</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Fare Paid</span>
                  <span className="text-base font-black text-emerald-700">₹{data.payment?.amount?.toFixed(2)}</span>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
