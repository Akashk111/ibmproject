import React, { useState } from 'react';
import { Bus, Clock, ArrowRight, CornerDownRight, ChevronDown, ChevronUp, IndianRupee, Heart, Check, MapPin } from 'lucide-react';
import UncertaintyBadge from './UncertaintyBadge';
import DemoDataNotice from './DemoDataNotice';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/services';

export default function JourneyCard({ journey, isSelected = false, onSelect = null }) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isAuthenticated } = useAuth();

  const isDirect = journey.journey_type === 'DIRECT';

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

  return (
    <div
      onClick={onSelect ? () => onSelect(journey) : undefined}
      className={`rounded-2xl transition-all duration-200 border cursor-pointer ${
        isSelected
          ? 'bg-white border-brand-600 ring-2 ring-brand-500/20 shadow-lg'
          : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm hover:shadow'
      }`}
    >
      <div className="p-5 sm:p-6">
        
        {/* Top Header: Badge, Option Rank, Save Favorite */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-900 text-white">
              Option {journey.rank || 1}
            </span>
            <span
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                isDirect
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {isDirect ? 'Direct Journey' : '1 Transfer Required'}
            </span>
            {journey.is_demo_data && <DemoDataNotice compact />}
          </div>

          <button
            type="button"
            onClick={handleSaveFavorite}
            disabled={saving || saved}
            className={`p-2 rounded-lg border transition-colors ${
              saved
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
            }`}
            title={saved ? 'Saved to favorites' : 'Save journey'}
          >
            {saved ? <Check className="w-4 h-4 text-emerald-600" /> : <Heart className="w-4 h-4" />}
          </button>
        </div>

        {/* Timetable Highlights & Route Line */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          
          {/* Departure */}
          <div className="sm:col-span-3">
            <span className="text-xs font-medium text-slate-400 block uppercase">Departure</span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {journey.departure_time}
            </span>
            <span className="text-xs font-medium text-slate-600 truncate block mt-0.5">
              {journey.segments[0].from_stop.name}
            </span>
          </div>

          {/* Duration & Transfers Graphic */}
          <div className="sm:col-span-6 flex flex-col items-center justify-center px-2">
            <div className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{journey.total_duration_minutes} mins total</span>
            </div>

            <div className="w-full flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"></div>
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
              <div className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0"></div>
            </div>

            <div className="text-[11px] text-slate-500 mt-1 text-center font-medium">
              {isDirect ? (
                <span className="text-slate-600">Bus {journey.segments[0].route_code} (Non-stop direct)</span>
              ) : (
                <span className="text-amber-700 font-semibold">
                  Change at {journey.transfer_stop?.name} ({journey.transfer_wait_minutes} min wait)
                </span>
              )}
            </div>
          </div>

          {/* Arrival */}
          <div className="sm:col-span-3 text-left sm:text-right">
            <span className="text-xs font-medium text-slate-400 block uppercase">Est. Arrival</span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {journey.arrival_time}
            </span>
            <span className="text-xs font-medium text-slate-600 truncate block mt-0.5">
              {journey.segments[journey.segments.length - 1].to_stop.name}
            </span>
          </div>

        </div>

        {/* Additional Stats: Waiting time, Fare, Reliability */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="font-semibold text-slate-800">Boarding Wait:</span>
              <span>{journey.waiting_time_minutes} mins</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="font-semibold text-slate-800">Fare:</span>
              {journey.fare !== null ? (
                <span className="font-bold text-slate-900 flex items-center">
                  ₹{journey.fare}
                </span>
              ) : (
                <span className="text-slate-400">Not available</span>
              )}
            </div>

            <UncertaintyBadge
              status={journey.reliability_status}
              note={journey.uncertainty_note}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 py-1 px-2 rounded-lg hover:bg-brand-50 transition-colors ml-auto"
          >
            <span>{expanded ? 'Hide Details' : 'View Instructions'}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

        </div>

      </div>

      {/* Expanded Segment & Step-by-Step Directions */}
      {expanded && (
        <div className="px-5 pb-6 pt-2 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl space-y-4 animate-fadeIn">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Step-by-Step Journey Instructions
          </h4>

          {journey.segments.map((seg, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Bus Route {seg.route_code}: {seg.route_name}
                    </h5>
                    <p className="text-xs text-slate-500">Operator: {seg.operator}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {seg.duration_minutes} mins ride
                </span>
              </div>

              {/* Boarding */}
              <div className="flex items-start gap-3 text-xs pl-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold text-slate-800">
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
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold text-slate-800">
                    Get down at {seg.to_stop.name} ({seg.arrival_time})
                  </p>
                  <p className="text-slate-500">{seg.to_stop.location_description}</p>
                </div>
              </div>

              {/* If this is segment 1 of a transfer journey */}
              {idx === 0 && !isDirect && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <CornerDownRight className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Transfer point: </span>
                    <span>Wait ~{journey.transfer_wait_minutes} minutes at {journey.transfer_stop?.name} for connecting Bus {journey.segments[1].route_code}.</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-brand-900">Total Travel Duration:</span>
            <span className="font-bold text-brand-700">{journey.total_duration_minutes} minutes</span>
          </div>
        </div>
      )}

    </div>
  );
}
