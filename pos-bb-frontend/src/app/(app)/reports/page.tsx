"use client";

import React, { useState } from "react";
import { PageContainer, PageHeader } from "@/components/common";
import { ReportsFilters } from "@/components/reports/ReportsFilters";
import { ReportsTabs } from "@/components/reports/ReportsTabs";
import { RevenueReportView } from "@/components/reports/RevenueReportView";
import { WorkOrdersReportView } from "@/components/reports/WorkOrdersReportView";
import { InventoryReportView } from "@/components/reports/InventoryReportView";
import { CustomerAnalyticsView } from "@/components/reports/CustomerAnalyticsView";
import { ServiceAnalyticsView } from "@/components/reports/ServiceAnalyticsView";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("customers"); // Customers tab active by default
  const [dateRange, setDateRange] = useState("This Month");

  const getDateRangeParams = (range: string) => {
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (range === "Today") {
      startDate = now.toISOString().split("T")[0];
      endDate = now.toISOString().split("T")[0];
    } else if (range === "Yesterday") {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      startDate = yesterday.toISOString().split("T")[0];
      endDate = yesterday.toISOString().split("T")[0];
    } else if (range === "Last 7 Days") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      startDate = past.toISOString().split("T")[0];
      endDate = now.toISOString().split("T")[0];
    } else if (range === "Last 30 Days") {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      startDate = past.toISOString().split("T")[0];
      endDate = now.toISOString().split("T")[0];
    } else if (range === "This Month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = startOfMonth.toISOString().split("T")[0];
      endDate = now.toISOString().split("T")[0];
    } else if (range === "Last Month") {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = startOfLastMonth.toISOString().split("T")[0];
      endDate = endOfLastMonth.toISOString().split("T")[0];
    }
    return { startDate, endDate };
  };

  const filters = getDateRangeParams(dateRange);

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Reports & Analytics"
        subtitle="Analyze workshop performance, revenue, customers and inventory."
        badge="Analytics"
      />

      {/* Top Filter Bar */}
      <ReportsFilters dateRange={dateRange} setDateRange={setDateRange} />

      {/* Report Category Navigation Tabs */}
      <ReportsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Dynamic Tab Content Area */}
      <div className="pt-2 animate-fadeIn">
        {activeTab === "revenue" ? (
          <RevenueReportView filters={filters} />
        ) : activeTab === "work-orders" ? (
          <WorkOrdersReportView filters={filters} />
        ) : activeTab === "spare-parts" ? (
          <InventoryReportView filters={filters} />
        ) : activeTab === "customers" ? (
          <CustomerAnalyticsView />
        ) : activeTab === "services" ? (
          <ServiceAnalyticsView />
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
