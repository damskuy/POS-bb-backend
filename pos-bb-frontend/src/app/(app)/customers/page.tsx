"use client";

import React from "react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";

export default function CustomersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        subtitle="Manage workshop customer database and contacts."
        badge="Master Data"
      />
      <EmptyState
        title="Customer Management"
        description="Customer management list and CRUD operations will be available here."
        icon={
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      />
    </PageContainer>
  );
}
