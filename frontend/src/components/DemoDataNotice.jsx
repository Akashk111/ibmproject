import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export default function DemoDataNotice({ compact = false }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
        <Info className="w-3 h-3 text-amber-600" />
        Demonstration Timetable Data
      </span>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 shadow-sm flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-amber-950">Demonstration Transit Data Notice</h4>
        <p className="mt-1 text-amber-800/90 leading-relaxed">
          Some schedules, route connections, and operating timings displayed are illustrative demonstration data based on Mangaluru City Bus references. Arrival times are calculated from published timetables and do not represent live GPS vehicle tracking feeds. Actual road traffic, railway crossing delays, and city peak hours may vary journey times.
        </p>
      </div>
    </div>
  );
}
