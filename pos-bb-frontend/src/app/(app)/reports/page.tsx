"use client";

import React from "react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";

export default function ReportsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Revenue analytics, work order reports, and spare part usage."
        badge="System"
      />
      <EmptyState
        title="Reports & Analytics"
        description="Detailed revenue, service, and inventory reports will be available here."
        icon={
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
    </PageContainer>
  );
}
