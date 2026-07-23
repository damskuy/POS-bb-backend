import React from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  comparisonText?: string;
  change?: string;
  isPositive?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  iconBg,
  iconColor,
  icon,
  comparisonText,
  change,
  isPositive = true,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-9 h-9 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center shrink-0 border border-slate-100`}>
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </h3>
      </div>

      {(change || comparisonText) && (
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {change && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full border ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {isPositive ? "↑" : "↓"} {change}
            </span>
          )}
          {comparisonText && (
            <span className="text-[10px] text-slate-400 font-medium">
              {comparisonText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface WorkOrderSummaryProps {
  summary: {
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
}

export const WorkOrderSummary: React.FC<WorkOrderSummaryProps> = ({
  summary,
}) => {
  const totalWO = summary.pending + summary.inProgress + summary.completed + summary.cancelled;
  const completionRate = totalWO > 0 ? Math.round((summary.completed / totalWO) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
      {/* Card 1: Total Work Orders */}
      <KpiCard
        title="Total Work Orders"
        value={totalWO}
        comparisonText="Total created"
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />

      {/* Card 2: Completed */}
      <KpiCard
        title="Completed"
        value={summary.completed}
        comparisonText={`Completion Rate: ${completionRate}%`}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        }
      />

      {/* Card 3: In Progress */}
      <KpiCard
        title="In Progress"
        value={summary.inProgress}
        comparisonText="Currently actively worked"
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* Card 4: Waiting Queue */}
      <KpiCard
        title="Waiting Queue"
        value={summary.pending}
        comparisonText="Pending assignment"
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        }
      />
    </div>
  );
};
