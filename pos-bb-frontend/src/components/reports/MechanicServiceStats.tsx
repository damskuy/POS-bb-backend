import React from "react";
import { formatRupiah } from "@/utils/format";

interface MechanicItem {
  mechanicName: string;
  completedServices: number;
  revenue: number;
  averageValue: number;
}

interface MechanicServiceStatsProps {
  mechanics: MechanicItem[];
}

export const MechanicServiceStats: React.FC<MechanicServiceStatsProps> = ({
  mechanics,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Top Mechanics by Service Count</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {mechanics.length} mechanics
        </span>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left min-w-[450px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-5">Mechanic Name</th>
              <th className="py-3 px-4 text-center">Completed Services</th>
              <th className="py-3 px-4 text-right">Service Revenue</th>
              <th className="py-3 px-5 text-right">Average Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {mechanics.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-900 leading-tight">
                  {row.mechanicName}
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                  {row.completedServices} items
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                  {formatRupiah(row.revenue)}
                </td>
                <td className="py-3.5 px-5 text-right font-mono font-bold text-blue-600">
                  {formatRupiah(row.averageValue)}
                </td>
              </tr>
            ))}
            {mechanics.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold">
                  No mechanic service records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
