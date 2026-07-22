import React from "react";
import { formatRupiah } from "@/utils/format";
import { revenueSummary } from "@/mock/revenueReport";

interface KpiCardProps {
  title: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  comparisonText: string;
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
        <span className="text-[10px] text-slate-400 font-medium">
          {comparisonText}
        </span>
      </div>
    </div>
  );
};

export const RevenueSummary: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Revenue */}
      <KpiCard
        title="Total Revenue"
        value={formatRupiah(revenueSummary.totalRevenue)}
        change={revenueSummary.totalRevenueChange}
        isPositive={true}
        comparisonText="vs previous period"
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* Total Invoices */}
      <KpiCard
        title="Total Invoices"
        value={revenueSummary.totalInvoices}
        change={revenueSummary.totalInvoicesChange}
        isPositive={true}
        comparisonText="vs previous period"
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />

      {/* Average Transaction */}
      <KpiCard
        title="Average Transaction"
        value={formatRupiah(revenueSummary.averageTransaction)}
        change={revenueSummary.averageTransactionChange}
        isPositive={true}
        comparisonText="vs previous period"
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        }
      />

      {/* Highest Revenue Day */}
      <KpiCard
        title="Highest Revenue Day"
        value={revenueSummary.highestRevenueDayName}
        comparisonText={`Peak: ${formatRupiah(revenueSummary.highestRevenueDayValue)}`}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
    </div>
  );
};
