import React from "react";

interface CompletionTimeItem {
  average: string;
  fastest: string;
  longest: string;
}

interface CompletionTimeCardProps {
  completionTime: CompletionTimeItem;
}

export const CompletionTimeCard: React.FC<CompletionTimeCardProps> = ({
  completionTime,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col justify-between h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Average Completion Time</h3>
      </div>

      {/* Main Stat */}
      <div className="text-center py-4 flex-1 flex flex-col justify-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Durasi Rata-rata
        </span>
        <h2 className="text-4xl font-black text-slate-950 font-mono tracking-tight">
          {completionTime.average}
        </h2>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 mt-auto">
        <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Fastest</span>
            <span className="text-xs font-bold text-slate-800 font-mono">{completionTime.fastest}</span>
          </div>
        </div>

        <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Longest</span>
            <span className="text-xs font-bold text-slate-800 font-mono">{completionTime.longest}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
