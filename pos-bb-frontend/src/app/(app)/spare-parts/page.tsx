"use client";

import React from "react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";

export default function SparePartsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Spare Parts Inventory"
        subtitle="Track stock levels, SKUs, and spare part pricing."
        badge="Master Data"
      />
      <EmptyState
        title="Spare Parts Management"
        description="Inventory stock tracking, SKU management, and pricing will be available here."
        icon={
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }
      />
    </PageContainer>
  );
}
