import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bus, Clock, ArrowRight, CornerDownRight, ChevronDown, ChevronUp, 
  IndianRupee, Heart, Check, MapPin, Gauge, ShieldCheck, Ticket, AlertCircle 
} from 'lucide-react';
import UncertaintyBadge from './UncertaintyBadge';
import DemoDataNotice from './DemoDataNotice';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/services';

export default function JourneyCard({ journey, isSelected = false, onSelect = null }) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isDirect = journey.journey_type === 'DIRECT';
  const hasTrafficDelay = (journey.traffic_delay_minutes || 0) > 0;

  const handleSaveFavorite = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please log in or sign up to save journeys to your favorites!');
      return;
    }
    setSaving(true);
    try {
      const srcId = journey.segments[0].from_stop.id;
      const destId = journey.segments[journey.segments.length - 1].to_stop.id;
      await userService.addFavorite(srcId, destId);
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBookNow = (e) => {
    e.stopPropagation();
    if (journey.schedule_id) {
      navigate(`/book-seats/${journey.schedule_id}`);
    } else {
      // Find matching schedule or go to schedules list
      navigate('/schedules');
    }
  };

  return (
    <div
      onClick={onSelect ? () => onSelect(journey) : undefined}
      className={`rounded-3xl transition-all duration-200 border cursor-pointer overflow-hidden ${
        isSelected
          ? 'bg-white border-brand-600 ring-2 ring-brand-500/25 shadow-xl'
          : 'bg-white hover:bg-slate-50/90 border-slate-200/90 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="p-5 sm:p-6">
        
        {/* Top Header: Option Rank, Badges, Distance & Booking Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 text-white">
              Option {journey.rank || 1}
            </span>
            
            <span
              className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider ${
                isDirect
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {isDirect ? 'Direct Line' : '1 Transfer Point'}
            </span>

            {/* Accurate Road Distance Badge */}
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-blue-600" />
              <span>{journey.distance_label || `${journey.distance_km || 18.5} KM`} Road</span>
            </span>

            {/* Booking Enabled indicator */}
            {journey.booking_enabled ? (
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <Ticket className="w-3 h-3 text-purple-600" />
                <span>{journey.available_seats || 28} seats available</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-600">
                Pay on bus (No reservation)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveFavorite}
            disabled={saving || saved}
            className={`p-2 rounded-xl border transition-colors ${
              saved
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
            }`}
            title={saved ? 'Saved to favorites' : 'Save journey'}
          >
            {saved ? <Check className="w-4 h-4 text-emerald-600" /> : <Heart className="w-4 h-4" />}
          </button>
        </div>

        {/* Bus Vehicle & Operator Sub-heading */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-brand-600" />
            <span className="font-extrabold text-xs sm:text-sm text-slate-900">
              {journey.bus_name || `Bus ${journey.segments[0].route_code}`}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({journey.bus_number || 'KA-19'})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[200px]">
            {journey.operator}
          </span>
        </div>

        {/* Departure, Duration Graphic & Arrival Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          
          {/* Departure */}
          <div className="sm:col-span-3">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Departure
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {journey.departure_time}
            </span>
            <span className="text-xs font-bold text-slate-700 truncate block mt-0.5">
              {journey.segments[0].from_stop.name}
            </span>
          </div>

          {/* Duration Graphic & ETA */}
          <div className="sm:col-span-6 flex flex-col items-center justify-center px-2">
            <div className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-1 flex items-center gap-1.5 border border-brand-100">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              <span>{journey.total_duration_minutes} mins travel</span>
            </div>

            <div className="w-full flex items-center gap-2 my-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <div className="h-1 flex-1 bg-slate-200 relative">
                {!isDirect && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-sm flex items-center justify-center"
                    title={`Transfer at ${journey.transfer_stop?.name}`}
                  >
                    <span className="text-[9px] font-bold text-white">T</span>
                  </div>
                )}
              </div>
              <div className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0" />
            </div>

            {/* Traffic-adjusted Expected Arrival label */}
            <div className="text-[11px] text-center">
              {hasTrafficDelay ? (
                <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ETA with Traffic: ~{journey.expected_arrival_time} (+{journey.traffic_delay_minutes}m delay)
                </span>
              ) : (
                <span className="text-emerald-700 font-bold">
                  On-Time Scheduled Arrival ~{journey.arrival_time}
                </span>
              )}
            </div>
          </div>

          {/* Arrival */}
          <div className="sm:col-span-3 text-left sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Expected Arrival
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {journey.expected_arrival_time || journey.arrival_time}
            </span>
            <span className="text-xs font-bold text-slate-700 truncate block mt-0.5">
              {journey.segments[journey.segments.length - 1].to_stop.name}
            </span>
          </div>

        </div>

        {/* Footer Stats: Fare, Distance source, and Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Verified Fare:</span>
              {journey.fare !== null ? (
                <span className="text-base font-black text-slate-900">
                  ₹{journey.fare}
                </span>
              ) : (
                <span className="text-slate-400 font-medium">Standard ₹25</span>
              )}
            </div>

            <UncertaintyBadge
              status={journey.reliability_status}
              note={journey.uncertainty_note}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {onSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(journey);
                }}
                className={`flex items-center gap-1 text-xs font-bold py-2 px-3.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isSelected ? 'Viewing on Map' : 'View Route'}</span>
              </button>
            )}

            {journey.booking_enabled ? (
              <button
                type="button"
                onClick={handleBookNow}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-brand-600 hover:from-blue-700 hover:to-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-500/25 transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Book Seats (Paytm)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/schedules');
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
              >
                Check Schedules
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 py-1 px-2"
            >
              <span>{expanded ? 'Hide' : 'Stops'}</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

        </div>

      </div>

      {/* Expanded Segment & Step-by-Step Directions */}
      {expanded && (
        <div className="px-5 pb-6 pt-2 bg-slate-50/80 border-t border-slate-100 rounded-b-3xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Road Route & Stop Sequence ({journey.road_routing_source || 'OSRM'})
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Total Road Distance: {journey.distance_km} KM
            </span>
          </div>

          {journey.segments.map((seg, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Bus Route {seg.route_code}: {seg.route_name}
                    </h5>
                    <p className="text-xs text-slate-500">Operator: {seg.operator}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                  {seg.duration_minutes} mins ride • {seg.distance_km || (journey.distance_km / journey.segments.length).toFixed(1)} km
                </span>
              </div>

              {/* Boarding */}
              <div className="flex items-start gap-3 text-xs pl-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">
                    Board at {seg.from_stop.name} ({seg.departure_time})
                  </p>
                  <p className="text-slate-500">{seg.from_stop.location_description}</p>
                </div>
              </div>

              {/* Intermediate stops list */}
              {seg.stops && seg.stops.length > 2 && (
                <div className="pl-6 border-l-2 border-dashed border-slate-200 my-1 text-xs text-slate-500 py-1">
                  <span>Passes through {seg.stops.length - 2} intermediate stops: </span>
                  <span className="font-medium text-slate-700">
                    {seg.stops.slice(1, -1).map(s => s.stop_name).join(' ➔ ')}
                  </span>
                </div>
              )}

              {/* Alighting */}
              <div className="flex items-start gap-3 text-xs pl-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">
                    Get down at {seg.to_stop.name} ({seg.arrival_time})
                  </p>
                  <p className="text-slate-500">{seg.to_stop.location_description}</p>
                </div>
              </div>

              {/* Transfer point notes */}
              {idx === 0 && !isDirect && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <CornerDownRight className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Transfer point: </span>
                    <span>Wait ~{journey.transfer_wait_minutes} minutes at {journey.transfer_stop?.name} for connecting Bus {journey.segments[1].route_code}.</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
