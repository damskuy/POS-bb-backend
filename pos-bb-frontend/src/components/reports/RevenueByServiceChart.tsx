import React from "react";
import { formatRupiah } from "@/utils/format";

interface ServiceRevenueItem {
  serviceName: string;
  revenue: number;
}

interface RevenueByServiceChartProps {
  revenueByService: ServiceRevenueItem[];
}

export const RevenueByServiceChart: React.FC<RevenueByServiceChartProps> = ({
  revenueByService,
}) => {
  const maxRevenue = Math.max(...revenueByService.map((r) => r.revenue), 1);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Revenue by Service</h3>
      </div>

      {/* Horizontal Progress Bars */}
      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {revenueByService.slice(0, 8).map((r, idx) => {
          const widthPercent = (r.revenue / maxRevenue) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs" title={r.serviceName}>
                  {r.serviceName}
                </span>
                <span className="font-mono text-slate-900 shrink-0">{formatRupiah(r.revenue)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
        {revenueByService.length === 0 && (
          <p className="text-center text-xs text-slate-400 font-semibold py-8">
            No revenue records found
          </p>
        )}
      </div>
    </div>
  );
};
