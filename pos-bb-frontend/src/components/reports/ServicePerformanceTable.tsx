"use client";

import React, { useState } from "react";
import { formatRupiah, formatDate } from "@/utils/format";

interface PerformanceItem {
  serviceId: number;
  serviceName: string;
  totalOrders: number;
  totalRevenue: number;
  averagePrice: number;
  lastOrdered: string | null;
}

interface ServicePerformanceTableProps {
  performance: PerformanceItem[];
}

export const ServicePerformanceTable: React.FC<ServicePerformanceTableProps> = ({
  performance,
}) => {
  const [sortBy, setSortBy] = useState<"orders" | "revenue" | "avgPrice">("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: "orders" | "revenue" | "avgPrice") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const sortedPerformance = [...performance].sort((a, b) => {
    let valA = a.totalRevenue;
    let valB = b.totalRevenue;
    if (sortBy === "orders") {
      valA = a.totalOrders;
      valB = b.totalOrders;
    } else if (sortBy === "avgPrice") {
      valA = a.averagePrice;
      valB = b.averagePrice;
    }
    return sortOrder === "desc" ? valB - valA : valA - valB;
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-2a4 4 0 01-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 01-4 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Service Performance</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Sorted by {sortBy === "revenue" ? "revenue" : sortBy === "orders" ? "orders" : "avg price"}
        </span>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left min-w-[550px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="py-3 px-5">Service Name</th>
              <th
                onClick={() => handleSort("orders")}
                className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Total Orders</span>
                  {sortBy === "orders" && (
                    <span className="text-[10px]">{sortOrder === "desc" ? "↓" : "↑"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("revenue")}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Revenue</span>
                  {sortBy === "revenue" && (
                    <span className="text-[10px]">{sortOrder === "desc" ? "↓" : "↑"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("avgPrice")}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Average Price</span>
                  {sortBy === "avgPrice" && (
                    <span className="text-[10px]">{sortOrder === "desc" ? "↓" : "↑"}</span>
                  )}
                </div>
              </th>
              <th className="py-3 px-5">Last Ordered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {sortedPerformance.map((row) => (
              <tr key={row.serviceId} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-900 leading-tight">
                  {row.serviceName}
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                  {row.totalOrders} items
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                  {formatRupiah(row.totalRevenue)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600">
                  {formatRupiah(row.averagePrice)}
                </td>
                <td className="py-3.5 px-5 text-slate-500 font-semibold">
                  {row.lastOrdered ? formatDate(row.lastOrdered) : "-"}
                </td>
              </tr>
            ))}
            {sortedPerformance.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                  No performance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
