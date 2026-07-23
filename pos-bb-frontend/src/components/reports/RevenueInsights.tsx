import React from "react";
import { formatRupiah } from "@/utils/format";

const typeConfig = {
  success: {
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-50 border-emerald-100",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  info: {
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50 border-blue-100",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50 border-amber-100",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
};

interface RevenueInsightsProps {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
}

export const RevenueInsights: React.FC<RevenueInsightsProps> = ({
  totalRevenue,
  totalTransactions,
  averageTransaction,
}) => {
  // Generate real dynamic insights
  const insights = [
    {
      id: 1,
      type: "info" as const,
      text: `Total pendapatan terakumulasi sebesar ${formatRupiah(totalRevenue)} dari ${totalTransactions} transaksi pembayaran lunas.`,
    },
    {
      id: 2,
      type: "success" as const,
      text: `Rata-rata tiket transaksi bernilai ${formatRupiah(averageTransaction)}, menunjukkan distribusi kontribusi jasa dan part yang sehat.`,
    },
    {
      id: 3,
      type: averageTransaction < 500000 ? ("warning" as const) : ("success" as const),
      text:
        averageTransaction < 500000
          ? "Rata-rata tiket per transaksi berada di bawah target. Tawarkan paket service bundling untuk meningkatkan penjualan."
          : "Efisiensi penjualan paket service optimal dengan nilai tiket transaksi harian yang tinggi.",
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 113.536 0V21h-2v-5.07z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Revenue Insights</h3>
      </div>

      {/* Insights Bullet Points */}
      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {insights.map((insight) => {
          const config = typeConfig[insight.type] || typeConfig.info;
          return (
            <div
              key={insight.id}
              className={`flex gap-3 p-3.5 rounded-xl border ${config.bgColor}`}
            >
              <div className={`shrink-0 ${config.iconColor}`}>
                {config.icon}
              </div>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
