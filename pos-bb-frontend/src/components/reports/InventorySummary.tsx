import React from "react";
import { formatRupiah } from "@/utils/format";

interface KpiCardProps {
  title: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  borderClass?: string;
  valueClass?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  iconBg,
  iconColor,
  icon,
  borderClass = "border-slate-200/80",
  valueClass = "text-slate-900",
}) => {
  return (
    <div className={`bg-white border ${borderClass} rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 animate-fadeIn`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-9 h-9 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center shrink-0 border border-slate-100`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-2xl font-bold tracking-tight ${valueClass}`}>
          {value}
        </h3>
      </div>
    </div>
  );
};

interface SummaryData {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface InventorySummaryProps {
  summary: SummaryData;
}

export const InventorySummary: React.FC<InventorySummaryProps> = ({
  summary,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
      {/* Card 1: Total Inventory Value */}
      <KpiCard
        title="Total Inventory Value"
        value={formatRupiah(summary.totalValue)}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* Card 2: Total Items */}
      <KpiCard
        title="Total Items"
        value={summary.totalItems}
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }
      />

      {/* Card 3: Low Stock */}
      <KpiCard
        title="Low Stock"
        value={summary.lowStockCount}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        borderClass="border-amber-200/80 bg-amber-50/10"
        valueClass="text-amber-700"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
      />

      {/* Card 4: Out of Stock */}
      <KpiCard
        title="Out of Stock"
        value={summary.outOfStockCount}
        iconBg="bg-rose-50"
        iconColor="text-rose-600"
        borderClass="border-rose-200/80 bg-rose-50/10"
        valueClass="text-rose-700"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
};
