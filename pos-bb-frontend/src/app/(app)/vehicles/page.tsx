"use client";

import React from "react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";

export default function VehiclesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Vehicles"
        subtitle="Manage customer vehicles, plate numbers, and models."
        badge="Master Data"
      />
      <EmptyState
        title="Vehicle Management"
        description="Vehicle registry, plate search, and CRUD operations will be available here."
        icon={
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        }
      />
    </PageContainer>
  );
}
