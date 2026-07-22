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
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}

export const KpiCards: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenueToday: 0,
    workOrdersToday: 0,
    waitingQueue: 0,
    completedToday: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        // Fetch dashboard summary and work orders created today
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
        const waitingQueue = dashboardData.workOrders?.status?.PENDING ?? 0;
        const workOrdersToday = todayWorkOrders.length;
        const completedToday = todayWorkOrders.filter((wo) => wo.status === "COMPLETED").length;

        setStats({
          revenueToday,
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
      subtitle: "Compared to yesterday",
      change: "+18% from yesterday",
      isPositive: true,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Work Orders Today",
      value: stats.workOrdersToday,
      subtitle: "Total work orders created today",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: "Waiting Queue",
      value: stats.waitingQueue,
      subtitle: "Waiting to be processed",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      subtitle: "Finished successfully today",
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-9 w-9 bg-slate-200 rounded-xl" />
            </div>
            <div className="h-7 w-20 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
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
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`w-9 h-9 ${card.iconBg} ${card.iconColor} rounded-xl flex items-center justify-center shrink-0 border border-slate-100`}>
              {card.icon}
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl font-bold tracking-tight ${card.valueColor || "text-slate-900"}`}>
              {card.value}
            </h3>
          </div>

          <div className="mt-1.5">
            {card.change ? (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                  card.isPositive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {card.isPositive ? "↑" : "↓"} {card.change}
              </span>
            ) : (
              <p className="text-xs text-slate-400 font-normal">{card.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
