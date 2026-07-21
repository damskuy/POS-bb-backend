"use client";

import React from "react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";

export default function ServicesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Services Catalog"
        subtitle="Manage repair services, service packages, and service pricing."
        badge="Master Data"
      />
      <EmptyState
        title="Service Catalog Management"
        description="Services list, service packages, and pricing management will be available here."
        icon={
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
    </PageContainer>
  );
}
