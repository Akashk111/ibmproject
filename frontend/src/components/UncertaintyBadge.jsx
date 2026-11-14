import React from 'react';
import { CheckCircle2, AlertCircle, Clock, AlertTriangle } from 'lucide-react';

export default function UncertaintyBadge({ status, note }) {
  let badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
  let icon = <Clock className="w-3.5 h-3.5 text-blue-600" />;
  let label = status || "Schedule-Based Estimate";

  if (status === 'On Time') {
    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
  } else if (status === 'Possible Delay') {
    badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
  } else if (status === 'Delayed') {
    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
    icon = <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
  }

  return (
    <div className="inline-flex flex-col">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeStyle}`}>
        {icon}
        {label}
      </span>
      {note && (
        <span className="text-[11px] text-slate-500 mt-1 pl-1">
          {note}
        </span>
      )}
    </div>
  );
}
