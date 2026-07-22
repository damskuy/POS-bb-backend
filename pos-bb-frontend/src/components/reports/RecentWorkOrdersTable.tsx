import React from "react";
import { formatRupiah } from "@/utils/format";
import { recentWorkOrders } from "@/mock/workOrderReport";

const statusConfig = {
  Waiting: { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Waiting" },
  "In Progress": { bg: "bg-blue-50 text-blue-700 border-blue-200", label: "In Progress" },
  Finished: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Finished" },
  Cancelled: { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "Cancelled" },
};

export const RecentWorkOrdersTable: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Recent Work Orders</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {recentWorkOrders.length} orders
        </span>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-5">WO Number</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Vehicle</th>
              <th className="py-3.5 px-4">Mechanic</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center">Created</th>
              <th className="py-3.5 px-4 text-center">Finished</th>
              <th className="py-3.5 px-5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {recentWorkOrders.map((row) => {
              const s = statusConfig[row.status];
              return (
                <tr key={row.code} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{row.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{row.customerName}</td>
                  <td className="py-3.5 px-4 font-mono uppercase text-slate-600">{row.plateNumber}</td>
                  <td className="py-3.5 px-4 text-slate-600">{row.mechanicName}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.bg}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500">{row.createdAt}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500">{row.finishedAt}</td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(row.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
