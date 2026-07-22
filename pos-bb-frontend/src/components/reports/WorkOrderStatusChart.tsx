import React from "react";
import { woStatuses } from "@/mock/workOrderReport";

export const WorkOrderStatusChart: React.FC = () => {
  const radius = 10;
  const circ = 2 * Math.PI * radius; // 62.8318

  let accumulatedPercent = 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Work Order Status</h3>
      </div>

      {/* Content Area */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-1">
        {/* Doughnut SVG */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle cx="16" cy="16" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="4" />

            {/* Segment segments */}
            {woStatuses.map((s) => {
              const dashArray = `${(s.percentage / 100) * circ} ${circ}`;
              const dashOffset = `${circ - (accumulatedPercent / 100) * circ}`;
              accumulatedPercent += s.percentage;

              return (
                <circle
                  key={s.status}
                  cx="16"
                  cy="16"
                  r={radius}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth="4"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-300 hover:stroke-[5px]"
                  style={{ cursor: "pointer" }}
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-xs font-black text-slate-800 font-mono mt-0.5">100%</p>
          </div>
        </div>

        {/* Legend Right Side */}
        <div className="flex-1 w-full space-y-3.5">
          {woStatuses.map((s) => (
            <div key={s.status} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="font-semibold text-slate-700">{s.status}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 font-mono">{s.percentage}%</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 font-mono">
                  {s.count} orders
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
