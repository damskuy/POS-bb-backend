"use client";

import React from "react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";

export default function InvoicesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Invoices & Payments"
        subtitle="Manage billing, payment receipts, and print invoices."
        badge="Transactions"
      />
      <EmptyState
        title="Invoices Management"
        description="Billing records, payment processing, and invoice printing will be available here."
        icon={
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      />
    </PageContainer>
  );
}
