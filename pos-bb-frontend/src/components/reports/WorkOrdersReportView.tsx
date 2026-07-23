"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { WorkOrderSummary } from "./WorkOrderSummary";
import { WorkOrderStatusChart } from "./WorkOrderStatusChart";
import { WorkOrderTrendChart } from "./WorkOrderTrendChart";
import { MechanicPerformanceChart } from "./MechanicPerformanceChart";
import { CompletionTimeCard } from "./CompletionTimeCard";
import { RecentWorkOrdersTable } from "./RecentWorkOrdersTable";
import { WorkOrderInsights } from "./WorkOrderInsights";

interface WorkOrdersReportData {
  summary: {
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  workOrders: any[];
  completionTime: {
    average: string;
    fastest: string;
    longest: string;
  };
  dailyTrend: Array<{ date: string; label: string; count: number }>;
  mechanicPerformance: Array<{ name: string; completed: number }>;
}

interface WorkOrdersReportViewProps {
  filters: {
    startDate: string | null;
    endDate: string | null;
  };
}

export const WorkOrdersReportView: React.FC<WorkOrdersReportViewProps> = ({
  filters,
}) => {
  const [data, setData] = useState<WorkOrdersReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkOrdersData() {
      try {
        setLoading(true);
        const params: Record<string, string> = {};
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        params.limit = "50"; // Limit to top 50 recent rows for report breakdown

        const res = await api.get<{ success: boolean; data: WorkOrdersReportData }>(
          "/api/reports/work-orders",
          { params }
        );
        if (res && res.data) {
          setData(res.data);
        } else {
          setError("Failed to parse work orders report data.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load work orders report.");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkOrdersData();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-xs text-slate-500 font-semibold mt-4">Generating Work Orders Report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-xs font-semibold">
        <p className="font-bold">Error loading work orders report:</p>
        <p className="mt-1">{error || "No data returned."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1: Summary KPI */}
      <WorkOrderSummary summary={data.summary} />

      {/* SECTION 2 & 5: Work Order Status & Average Completion Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WorkOrderStatusChart summary={data.summary} />
        <CompletionTimeCard completionTime={data.completionTime} />
      </div>

      {/* SECTION 3: Daily Work Orders Trend */}
      <WorkOrderTrendChart dailyTrend={data.dailyTrend} />

      {/* SECTION 4 & 7: Mechanic Performance & Operational Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MechanicPerformanceChart mechanicPerformance={data.mechanicPerformance} />
        <WorkOrderInsights summary={data.summary} />
      </div>

      {/* SECTION 6: Recent Work Orders Table */}
      <RecentWorkOrdersTable workOrders={data.workOrders} />
    </div>
  );
};
