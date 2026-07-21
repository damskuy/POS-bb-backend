"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer, PageHeader } from "@/components/common";
import { StatCard } from "@/components/dashboard";
import { formatRupiah } from "@/utils/format";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={`Welcome back, ${user?.name || "User"}! 👋`}
        subtitle="Here is what is happening in your workshop today."
        badge={user?.role || "ADMIN"}
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Customers"
          value="128"
          change="12%"
          isPositive={true}
          subtitle="Registered workshop customers"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Vehicles"
          value="256"
          change="8%"
          isPositive={true}
          subtitle="Vehicles linked to customers"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
        />
        <StatCard
          title="Pending Work Orders"
          value="18"
          change="3%"
          isPositive={false}
          subtitle="4 currently in progress"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          title="Total Revenue"
          value={formatRupiah(45850000)}
          change="15%"
          isPositive={true}
          subtitle="Calculated this month"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Overview Card Placeholder */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Workshop Summary & Quick Actions</h3>
        <p className="text-sm text-slate-500">
          This dashboard layout is connected to the Application Shell. Module pages (Customers, Vehicles, Mechanics, Work Orders, etc.) are structured and ready for Phase 7 CRUD integration.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs font-bold text-blue-600 uppercase">Phase 7 Ready</span>
            <h4 className="text-sm font-bold text-slate-800 mt-1">Customer Management</h4>
            <p className="text-xs text-slate-500 mt-1">Manage customer profiles & contact details.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs font-bold text-blue-600 uppercase">Phase 8 Ready</span>
            <h4 className="text-sm font-bold text-slate-800 mt-1">Work Orders & Queue</h4>
            <p className="text-xs text-slate-500 mt-1">Track vehicle repairs and mechanic assignments.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-xs font-bold text-blue-600 uppercase">Phase 9 Ready</span>
            <h4 className="text-sm font-bold text-slate-800 mt-1">POS & Invoicing</h4>
            <p className="text-xs text-slate-500 mt-1">Process transactions and print receipt invoices.</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
