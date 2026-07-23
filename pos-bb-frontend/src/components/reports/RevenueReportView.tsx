"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { RevenueSummary } from "./RevenueSummary";
import { RevenueTrendChart } from "./RevenueTrendChart";
import { PaymentMethodChart } from "./PaymentMethodChart";
import { RevenueTable } from "./RevenueTable";
import { RevenueInsights } from "./RevenueInsights";

interface RevenueData {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  dailyRevenue: Array<{ date: string; revenue: number; transactions: number }>;
  paymentMethods: Array<{ method: string; amount: number; percentage: number; color: string }>;
}

interface RevenueReportViewProps {
  filters: {
    startDate: string | null;
    endDate: string | null;
  };
}

export const RevenueReportView: React.FC<RevenueReportViewProps> = ({
  filters,
}) => {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRevenueData() {
      try {
        setLoading(true);
        const params: Record<string, string> = {};
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const res = await api.get<{ success: boolean; data: RevenueData }>(
          "/api/reports/revenue",
          { params }
        );
        if (res && res.data) {
          setData(res.data);
        } else {
          setError("Failed to parse revenue report data.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load revenue report.");
      } finally {
        setLoading(false);
      }
    }

    fetchRevenueData();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="text-xs text-slate-500 font-semibold mt-4">Generating Revenue Report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-xs font-semibold">
        <p className="font-bold">Error loading revenue report:</p>
        <p className="mt-1">{error || "No data returned."}</p>
      </div>
    );
  }

  // Calculate highest day
  let highestDayLabel = "-";
  let highestDayValue = 0;
  data.dailyRevenue.forEach((d) => {
    if (d.revenue > highestDayValue) {
      highestDayValue = d.revenue;
      highestDayLabel = d.date;
    }
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <RevenueSummary
        totalRevenue={data.totalRevenue}
        totalTransactions={data.totalTransactions}
        averageTransaction={data.averageTransaction}
        highestDayLabel={highestDayLabel}
        highestDayValue={highestDayValue}
      />

      {/* Row 2: Trend & Payment Method Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueTrendChart dailyRevenue={data.dailyRevenue} />
        </div>
        <div>
          <PaymentMethodChart paymentMethods={data.paymentMethods} />
        </div>
      </div>

      {/* Row 3: Table breakdown & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueTable dailyRevenue={data.dailyRevenue} />
        </div>
        <div>
          <RevenueInsights
            totalRevenue={data.totalRevenue}
            totalTransactions={data.totalTransactions}
            averageTransaction={data.averageTransaction}
          />
        </div>
      </div>
    </div>
  );
};
