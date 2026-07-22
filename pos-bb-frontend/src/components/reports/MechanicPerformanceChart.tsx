import React from "react";
import { mechanicPerformance } from "@/mock/workOrderReport";

export const MechanicPerformanceChart: React.FC = () => {
  const maxCompleted = Math.max(...mechanicPerformance.map((m) => m.completed));

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Mechanic Performance</h3>
      </div>

      {/* Horizontal Progress Bars */}
      <div className="space-y-4.5 flex-1 flex flex-col justify-center">
        {mechanicPerformance.map((m) => {
          const widthPercent = (m.completed / maxCompleted) * 100;
          return (
            <div key={m.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="font-bold text-slate-900">{m.name}</span>
                <span className="font-mono text-slate-500">{m.completed} WO</span>
              </div>
              <div className="w-full h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
