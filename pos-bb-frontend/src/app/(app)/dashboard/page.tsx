"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer, PageHeader } from "@/components/common";
import {
  QuickActions,
  KpiCards,
  WorkOrderQueue,
  RecentActivity,
  LowStockAlert,
} from "@/components/dashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  // Format today's date
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={`Selamat datang, ${user?.name || "User"}! 👋`}
        subtitle={today}
      />

      {/* Section 1: Quick Actions */}
      <QuickActions />

      {/* Section 2: KPI Cards */}
      <KpiCards />

      {/* Section 3: Today's Work Order Queue */}
      <WorkOrderQueue />

      {/* Section 5: Bottom Grid — Recent Activity & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentActivity />
        <LowStockAlert />
      </div>
    </PageContainer>
  );
}
