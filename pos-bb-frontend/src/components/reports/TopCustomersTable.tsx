"use client";

import React, { useState } from "react";
import { formatRupiah, formatDate } from "@/utils/format";

interface CustomerSpendingItem {
  customerId: number;
  name: string;
  phone: string;
  totalVisits: number;
  totalSpending: number;
  lastVisit: string | null;
  averageInvoice: number;
}

interface TopCustomersTableProps {
  topCustomers: CustomerSpendingItem[];
}

export const TopCustomersTable: React.FC<TopCustomersTableProps> = ({
  topCustomers,
}) => {
  const [sortBy, setSortBy] = useState<"spending" | "visits">("spending");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: "spending" | "visits") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const sortedCustomers = [...topCustomers].sort((a, b) => {
    const valA = sortBy === "spending" ? a.totalSpending : a.totalVisits;
    const valB = sortBy === "spending" ? b.totalSpending : b.totalVisits;
    return sortOrder === "desc" ? valB - valA : valA - valB;
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5h8m-11 5a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Top Customers</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Sorted by {sortBy === "spending" ? "spending" : "visits"}
        </span>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left min-w-[500px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="py-3 px-5">Customer Name</th>
              <th
                onClick={() => handleSort("visits")}
                className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Total Visits</span>
                  {sortBy === "visits" && (
                    <span className="text-[10px]">{sortOrder === "desc" ? "↓" : "↑"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("spending")}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Spending</span>
                  {sortBy === "spending" && (
                    <span className="text-[10px]">{sortOrder === "desc" ? "↓" : "↑"}</span>
                  )}
                </div>
              </th>
              <th className="py-3 px-4">Last Visit</th>
              <th className="py-3 px-5 text-right">Average Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {sortedCustomers.map((row) => (
              <tr key={row.customerId} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 leading-tight">{row.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{row.phone}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{row.totalVisits} visits</td>
                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                  {formatRupiah(row.totalSpending)}
                </td>
                <td className="py-3 px-4 text-slate-500 font-semibold">
                  {row.lastVisit ? formatDate(row.lastVisit) : "-"}
                </td>
                <td className="py-3 px-5 text-right font-mono font-bold text-blue-600">
                  {formatRupiah(row.averageInvoice)}
                </td>
              </tr>
            ))}
            {sortedCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                  No customer records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
