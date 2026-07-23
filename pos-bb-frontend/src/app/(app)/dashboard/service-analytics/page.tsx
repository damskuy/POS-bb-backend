"use client";

import React from "react";
import { PageContainer, PageHeader } from "@/components/common";
import { ServiceAnalyticsView } from "@/components/reports/ServiceAnalyticsView";

export default function ServiceAnalyticsDashboardPage() {
  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Service Analytics Dashboard"
        subtitle="Analyze workshop service performances, revenues, trending items, and mechanic counts."
        badge="Services CRM"
      />

      <div className="mt-6">
        <ServiceAnalyticsView />
      </div>
    </PageContainer>
  );
}
