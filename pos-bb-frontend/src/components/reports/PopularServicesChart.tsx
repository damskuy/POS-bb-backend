import React from "react";

interface ServiceUsageItem {
  serviceName: string;
  totalUsage: number;
}

interface PopularServicesChartProps {
  popularServices: ServiceUsageItem[];
}

export const PopularServicesChart: React.FC<PopularServicesChartProps> = ({
  popularServices,
}) => {
  const maxUsage = Math.max(...popularServices.map((s) => s.totalUsage), 1);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Most Popular Services</h3>
      </div>

      {/* Horizontal Progress Bars */}
      <div className="space-y-3.5 flex-1 flex flex-col justify-center">
        {popularServices.map((s, idx) => {
          const widthPercent = (s.totalUsage / maxUsage) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs" title={s.serviceName}>
                  {s.serviceName}
                </span>
                <span className="font-mono text-slate-500 shrink-0">{s.totalUsage} used</span>
              </div>
              <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
        {popularServices.length === 0 && (
          <p className="text-center text-xs text-slate-400 font-semibold py-8">
            No service records found
          </p>
        )}
      </div>
    </div>
  );
};
