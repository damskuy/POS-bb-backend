"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { InventorySummary } from "./InventorySummary";
import { TopSellingPartsChart } from "./TopSellingPartsChart";
import { InventoryValueChart } from "./InventoryValueChart";
import { InventoryMovementChart } from "./InventoryMovementChart";
import { LowStockTable } from "./LowStockTable";
import { SlowMovingTable } from "./SlowMovingTable";
import { InventoryInsights } from "./InventoryInsights";

interface InventoryReportData {
  summary: {
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalRevenue: number;
  };
  topSelling: Array<{ sparePartName: string; totalQuantity: number }>;
  distribution: Array<{ category: string; value: number; percentage: number; color: string }>;
  movement: Array<{ date: string; label: string; count: number }>;
  lowStockList: any[];
  slowMoving: any[];
  insights: any[];
}

interface InventoryReportViewProps {
  filters: {
    startDate: string | null;
    endDate: string | null;
  };
}

export const InventoryReportView: React.FC<InventoryReportViewProps> = ({
  filters,
}) => {
  const [data, setData] = useState<InventoryReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInventoryData() {
      try {
        setLoading(true);
        const params: Record<string, string> = {};
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const res = await api.get<{ success: boolean; data: InventoryReportData }>(
          "/api/reports/spare-parts",
          { params }
        );
        if (res && res.data) {
          setData(res.data);
        } else {
          setError("Failed to parse inventory report data.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load inventory report.");
      } finally {
        setLoading(false);
      }
    }

    fetchInventoryData();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="text-xs text-slate-500 font-semibold mt-4">Generating Inventory Report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-xs font-semibold">
        <p className="font-bold">Error loading inventory report:</p>
        <p className="mt-1">{error || "No data returned."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <InventorySummary summary={data.summary} />

      {/* Row 2: Top Selling Parts & Value distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopSellingPartsChart topSelling={data.topSelling} />
        <InventoryValueChart distribution={data.distribution} />
      </div>

      {/* Row 3: Movement trend chart */}
      <InventoryMovementChart movement={data.movement} />

      {/* Row 4: Low stock alerts table & slow moving list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <LowStockTable lowStockList={data.lowStockList} />
        <SlowMovingTable slowMoving={data.slowMoving} />
      </div>

      {/* Row 5: Operations insights list */}
      <InventoryInsights insights={data.insights} />
    </div>
  );
};
