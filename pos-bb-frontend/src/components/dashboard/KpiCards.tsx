"use client";

import React, { useState, useEffect } from "react";
import { formatRupiah } from "@/utils/format";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { WorkOrder } from "@/types/workOrder";

interface KpiCardData {
  title: string;
  value: string | number;
  subtitle: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  statusColor?: string;
}

export const KpiCards: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenueToday: 0,
    revenueChange: "",
    revenueChangePositive: true,
    workOrdersToday: 0,
    waitingQueue: 0,
    completedToday: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        const [dashboardRes, workOrdersRes] = await Promise.all([
          api.get<ApiResponse<any>>("/api/dashboard"),
          api.get<ApiResponse<WorkOrder[]>>("/api/work-orders", {
            params: {
              startDate: todayStart.toISOString(),
              limit: 1000,
            },
          }),
        ]);

        const dashboardData = dashboardRes.data || {};
        const todayWorkOrders = workOrdersRes.data || [];

        const revenueToday = dashboardData.revenue?.todayRevenue ?? 0;
        const revenueYesterday = dashboardData.revenue?.yesterdayRevenue ?? 0;
        const waitingQueue = dashboardData.workOrders?.status?.PENDING ?? 0;
        const workOrdersToday = todayWorkOrders.length;
        const completedToday = todayWorkOrders.filter((wo) => wo.status === "COMPLETED").length;

        const revDiff = revenueToday - revenueYesterday;
        const revPercent = revenueYesterday > 0 ? Math.round((revDiff / revenueYesterday) * 100) : (revenueToday > 0 ? 100 : 0);

        setStats({
          revenueToday,
          revenueChange: `${Math.abs(revPercent)}% from yesterday`,
          revenueChangePositive: revDiff >= 0,
          workOrdersToday,
          waitingQueue,
          completedToday,
        });
      } catch (err) {
        console.error("Error fetching dashboard KPIs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const kpiCardsList: KpiCardData[] = [
    {
      title: "Revenue Today",
      value: formatRupiah(stats.revenueToday),
      subtitle: "",
      change: stats.revenueChange || undefined,
      isPositive: stats.revenueChangePositive,
      statusColor: "group-hover:text-emerald-600",
      icon: (
        <svg className="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Work Orders Today",
      value: stats.workOrdersToday,
      subtitle: "Total created today",
      statusColor: "group-hover:text-blue-600",
      icon: (
        <svg className="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: "Waiting Queue",
      value: stats.waitingQueue,
      subtitle: "Waiting to be processed",
      statusColor: "group-hover:text-amber-600",
      icon: (
        <svg className="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      subtitle: "Finished successfully today",
      statusColor: "group-hover:text-emerald-600",
      icon: (
        <svg className="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-5 w-5 bg-slate-200 rounded" />
            </div>
            <div className="h-10 w-24 bg-slate-200 rounded" />
            <div className="h-3.5 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
      {kpiCardsList.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-2xl p-6 shadow-2xs hover:shadow-xs hover:bg-slate-50/20 transition-all duration-200 group"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`text-slate-400 shrink-0 ${card.statusColor}`}>
              {card.icon}
            </div>
          </div>

          {/* Value */}
          <div className="flex items-baseline">
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono font-tabular">
              {card.value}
            </h3>
          </div>

          {/* Description / Rate */}
          <div className="mt-2.5">
            {card.change ? (
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    card.isPositive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}
                >
                  {card.isPositive ? "↑" : "↓"} {card.change}
                </span>
                {card.subtitle && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    {card.subtitle}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                {card.subtitle}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
