"use client";

import React, { useState } from "react";
import { PageContainer, PageHeader } from "@/components/common";
import { ReportsFilters } from "@/components/reports/ReportsFilters";
import { UnifiedReportsDashboard } from "@/components/reports/UnifiedReportsDashboard";

export default function ReportsPage() {
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

      {/* Unified Dashboard Content */}
      <div className="pt-6">
        <UnifiedReportsDashboard filters={filters} />
      </div>
    </PageContainer>
  );
}
