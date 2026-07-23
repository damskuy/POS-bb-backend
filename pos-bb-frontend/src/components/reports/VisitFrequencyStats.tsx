import React from "react";

interface VisitFrequencyStatsProps {
  totalCustomers: number;
  visitFrequency: {
    averageVisits: number;
    oneTimeCustomers: number;
    repeatCustomers: number;
  };
}

export const VisitFrequencyStats: React.FC<VisitFrequencyStatsProps> = ({
  totalCustomers,
  visitFrequency,
}) => {
  const { averageVisits, oneTimeCustomers, repeatCustomers } = visitFrequency;

  // Calculate percentages
  const totalVisited = oneTimeCustomers + repeatCustomers || 1;
  const oneTimePct = Math.round((oneTimeCustomers / totalVisited) * 100);
  const repeatPct = Math.round((repeatCustomers / totalVisited) * 100);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Visit Frequency</h3>
      </div>

      {/* Content */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-1">
        {/* Large Stat Dial */}
        <div className="w-28 h-28 bg-slate-50 border border-slate-100 rounded-full flex flex-col items-center justify-center text-center shrink-0 shadow-inner">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Average</span>
          <span className="text-3xl font-black text-slate-800 font-mono mt-0.5">{averageVisits}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Visits/Cust</span>
        </div>

        {/* Legend / Brackets Distribution */}
        <div className="flex-1 w-full space-y-4">
          {/* One-Time Customers */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>One-Time Customers</span>
              </div>
              <span className="font-mono text-slate-500">{oneTimeCustomers} cust ({oneTimePct}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 rounded-full transition-all duration-500"
                style={{ width: `${oneTimePct}%` }}
              />
            </div>
          </div>

          {/* Repeat Customers */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Repeat Customers</span>
              </div>
              <span className="font-mono text-slate-500">{repeatCustomers} cust ({repeatPct}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${repeatPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
