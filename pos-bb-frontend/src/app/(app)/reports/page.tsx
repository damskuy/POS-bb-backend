"use client";

import React, { useState } from "react";
import { PageContainer, PageHeader } from "@/components/common";
import { ReportsFilters } from "@/components/reports/ReportsFilters";
import { ReportsTabs } from "@/components/reports/ReportsTabs";
import { RevenueSummary } from "@/components/reports/RevenueSummary";
import { RevenueTrendChart } from "@/components/reports/RevenueTrendChart";
import { PaymentMethodChart } from "@/components/reports/PaymentMethodChart";
import { RevenueTable } from "@/components/reports/RevenueTable";
import { RevenueInsights } from "@/components/reports/RevenueInsights";
import { WorkOrderSummary } from "@/components/reports/WorkOrderSummary";
import { WorkOrderStatusChart } from "@/components/reports/WorkOrderStatusChart";
import { WorkOrderTrendChart } from "@/components/reports/WorkOrderTrendChart";
import { MechanicPerformanceChart } from "@/components/reports/MechanicPerformanceChart";
import { CompletionTimeCard } from "@/components/reports/CompletionTimeCard";
import { RecentWorkOrdersTable } from "@/components/reports/RecentWorkOrdersTable";
import { WorkOrderInsights } from "@/components/reports/WorkOrderInsights";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("work-orders"); // Work Orders is active by default now

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Reports & Analytics"
        subtitle="Analyze workshop performance, revenue, customers and inventory."
        badge="Analytics"
      />

      {/* Top Filter Bar */}
      <ReportsFilters />

      {/* Report Category Navigation Tabs */}
      <ReportsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Dynamic Tab Content Area */}
      <div className="pt-2 animate-fadeIn">
        {activeTab === "revenue" ? (
          <div className="space-y-6">
            {/* SECTION 1: Revenue Summary */}
            <RevenueSummary />

            {/* SECTION 2: Revenue Trend Chart */}
            <RevenueTrendChart />

            {/* SECTION 3 & 5: Payment Method & Insights in a 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PaymentMethodChart />
              <RevenueInsights />
            </div>

            {/* SECTION 4: Daily Revenue Table */}
            <RevenueTable />
          </div>
        ) : activeTab === "work-orders" ? (
          <div className="space-y-6">
            {/* SECTION 1: Summary KPI */}
            <WorkOrderSummary />

            {/* SECTION 2 & 5: Work Order Status & Average Completion Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <WorkOrderStatusChart />
              <CompletionTimeCard />
            </div>

            {/* SECTION 3: Daily Work Orders Trend */}
            <WorkOrderTrendChart />

            {/* SECTION 4 & 7: Mechanic Performance & Operational Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <MechanicPerformanceChart />
              <WorkOrderInsights />
            </div>

            {/* SECTION 6: Recent Work Orders Table */}
            <RecentWorkOrdersTable />
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center shadow-xs animate-scaleUp">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-slate-900 capitalize">
              Laporan {activeTab.replace("-", " ")}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Halaman visualisasi data dan laporan analisis untuk kategori{" "}
              <strong className="text-slate-700 capitalize">
                {activeTab.replace("-", " ")}
              </strong>{" "}
              sedang disiapkan.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
