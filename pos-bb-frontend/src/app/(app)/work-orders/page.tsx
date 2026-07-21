"use client";

import React from "react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";

export default function WorkOrdersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Work Orders"
        subtitle="Create and manage vehicle repair service orders."
        badge="Transactions"
      />
      <EmptyState
        title="Work Order Management"
        description="Service queue, repair status tracking, and work order creation will be available here."
        icon={
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
    </PageContainer>
  );
}
