"use client";

import React, { useState } from "react";
import { formatDate } from "@/utils/format";

interface InactiveCustomerItem {
  id: number;
  name: string;
  phone: string;
  lastVisit: string | null;
  daysSinceLastVisit: number;
}

interface InactiveCustomersListProps {
  inactiveCustomers: InactiveCustomerItem[];
}

export const InactiveCustomersList: React.FC<InactiveCustomersListProps> = ({
  inactiveCustomers,
}) => {
  const [thresholdMonths, setThresholdMonths] = useState<3 | 6 | 12>(3);

  // Filter inactive list based on threshold days:
  // 3 Months = 90 days, 6 Months = 180 days, 12 Months = 365 days
  const thresholdDays = thresholdMonths === 3 ? 90 : thresholdMonths === 6 ? 180 : 365;

  const filteredCustomers = inactiveCustomers.filter(
    (c) => c.daysSinceLastVisit >= thresholdDays
  );

  // Sort by longest inactive first
  filteredCustomers.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full animate-fadeIn">
      {/* Header with Switcher */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-rose-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Inactive Customers</h3>
        </div>

        {/* Tab switcher buttons inside the component */}
        <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setThresholdMonths(3)}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              thresholdMonths === 3
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            &gt; 3 Mos
          </button>
          <button
            onClick={() => setThresholdMonths(6)}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              thresholdMonths === 6
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            &gt; 6 Mos
          </button>
          <button
            onClick={() => setThresholdMonths(12)}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              thresholdMonths === 12
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            &gt; 12 Mos
          </button>
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left min-w-[450px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-5">Customer Name</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Last Visit</th>
              <th className="py-3 px-4 text-center">Inactive Period</th>
              <th className="py-3 px-5 text-center">Action Needed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredCustomers.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-5">
                  <span className="font-bold text-slate-900 leading-tight">{row.name}</span>
                </td>
                <td className="py-3 px-4 font-mono text-[10px] text-slate-400 font-semibold">{row.phone}</td>
                <td className="py-3 px-4 text-slate-500 font-semibold">
                  {row.lastVisit ? formatDate(row.lastVisit) : "Never Visited"}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black font-mono border bg-slate-50 text-slate-600 border-slate-200/60">
                    {row.daysSinceLastVisit === 9999 ? "∞" : `${row.daysSinceLastVisit} days`}
                  </span>
                </td>
                <td className="py-3 px-5 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border bg-rose-50 text-rose-700 border-rose-200/60">
                    <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping" />
                    Needs Follow-up
                  </span>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                  No inactive customers in this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
