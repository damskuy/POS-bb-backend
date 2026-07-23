"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatRupiah } from "@/utils/format";
import { ServiceAnalyticsSummary } from "./ServiceAnalyticsSummary";
import { ServiceRevenueChart } from "./ServiceRevenueChart";
import { ServicePopularityChart } from "./ServicePopularityChart";
import { RevenueByServiceChart } from "./RevenueByServiceChart";
import { ServicePerformanceTable } from "./ServicePerformanceTable";
import { CombinedServicesList } from "./CombinedServicesList";
import { ServiceTrendAnalysis } from "./ServiceTrendAnalysis";
import { ServiceContributionChart } from "./ServiceContributionChart";
import { MechanicServiceStats } from "./MechanicServiceStats";

interface AnalyticsData {
  summary: {
    totalServices: number;
    totalRevenue: number;
    averageValue: number;
    mostPopularService: string;
    leastPopularService: string;
  };
  dailyTrend: any[];
  monthlyTrend: any[];
  popularity: any[];
  revenueByService: any[];
  performance: any[];
  frequentCombinations: any[];
  trends: any[];
  contribution: any[];
  mechanics: any[];
}

export const ServiceAnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; data: AnalyticsData }>(
          "/api/reports/service-analytics"
        );
        if (res && res.data) {
          setData(res.data);
        } else {
          setError("Invalid response format received.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load service analytics data.");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const handleExport = (format: "csv" | "excel") => {
    if (!data) return;

    // Export service performance list
    const exportData = data.performance.map((s) => ({
      "Service Name": s.serviceName,
      "Total Orders": s.totalOrders,
      "Total Revenue (Rp)": s.totalRevenue,
      "Average Price (Rp)": s.averagePrice,
      "Last Ordered Date": s.lastOrdered ? new Date(s.lastOrdered).toLocaleDateString() : "-",
    }));

    if (exportData.length === 0) return;

    const headers = Object.keys(exportData[0]).join(",");
    const rows = exportData.map((row) =>
      Object.values(row)
        .map((val) => {
          let str = String(val ?? "").replace(/"/g, '""');
          if (str.includes(",") || str.includes("\n") || str.includes('"')) {
            str = `"${str}"`;
          }
          return str;
        })
        .join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `service_analytics_${new Date().toISOString().slice(0, 10)}.${format === "csv" ? "csv" : "xlsx"}`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-xs text-slate-500 font-semibold mt-4">Generating Service Analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-xs font-semibold">
        <p className="font-bold">Error loading analytics:</p>
        <p className="mt-1">{error || "No data returned."}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-[10px]"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Action Bar */}
      <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl px-5 py-4 shadow-xs">
        <div>
          <h4 className="text-xs font-bold text-slate-900">Service Performance & Revenue Analysis</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Insights based on completed work orders and service records</p>
        </div>

        {/* Export Button (Dropdown) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 h-[36px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Export Services</span>
            <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showExportDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-scaleUp">
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("excel")}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export Excel (CSV)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <ServiceAnalyticsSummary summary={data.summary} />

      {/* Trend & Contribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ServiceRevenueChart dailyTrend={data.dailyTrend} monthlyTrend={data.monthlyTrend} />
        </div>
        <div>
          <ServiceContributionChart contribution={data.contribution} />
        </div>
      </div>

      {/* Popularity & Revenue bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ServicePopularityChart popularity={data.popularity} />
        <RevenueByServiceChart revenueByService={data.revenueByService} />
      </div>

      {/* Combined services & trends up/down */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CombinedServicesList combinations={data.frequentCombinations} />
        <ServiceTrendAnalysis trends={data.trends} />
      </div>

      {/* Performance & Mechanics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ServicePerformanceTable performance={data.performance} />
        <MechanicServiceStats mechanics={data.mechanics} />
      </div>
    </div>
  );
};
