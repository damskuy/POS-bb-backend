import React from "react";

interface TrendItem {
  serviceName: string;
  changePercent: number;
  direction: "up" | "down" | "flat";
}

interface ServiceTrendAnalysisProps {
  trends: TrendItem[];
}

export const ServiceTrendAnalysis: React.FC<ServiceTrendAnalysisProps> = ({
  trends,
}) => {
  const trendingUp = trends.filter((t) => t.direction === "up");
  const trendingDown = trends.filter((t) => t.direction === "down");

  // Sort by highest changes first
  trendingUp.sort((a, b) => b.changePercent - a.changePercent);
  trendingDown.sort((a, b) => b.changePercent - a.changePercent);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Service Performance Trend</h3>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
        {/* Trending Up */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Trending Up (This Month vs Last Month)
          </h4>
          <div className="space-y-2">
            {trendingUp.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/10 hover:bg-emerald-50/20 transition-all"
              >
                <span className="text-xs font-bold text-slate-800 truncate pr-2" title={item.serviceName}>
                  {item.serviceName}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ↑ {item.changePercent}%
                </span>
              </div>
            ))}
            {trendingUp.length === 0 && (
              <p className="text-[11px] text-slate-400 font-semibold py-4 text-center">
                No services trending up
              </p>
            )}
          </div>
        </div>

        {/* Trending Down */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Trending Down (This Month vs Last Month)
          </h4>
          <div className="space-y-2">
            {trendingDown.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/10 hover:bg-rose-50/20 transition-all"
              >
                <span className="text-xs font-bold text-slate-800 truncate pr-2" title={item.serviceName}>
                  {item.serviceName}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  ↓ {item.changePercent}%
                </span>
              </div>
            ))}
            {trendingDown.length === 0 && (
              <p className="text-[11px] text-slate-400 font-semibold py-4 text-center">
                No services trending down
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
