import React from "react";
import { formatRupiah, formatDate } from "@/utils/format";

interface DailyRevenueItem {
  date: string;
  revenue: number;
  transactions: number;
}

interface RevenueTableProps {
  dailyRevenue: DailyRevenueItem[];
}

export const RevenueTable: React.FC<RevenueTableProps> = ({
  dailyRevenue,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Daily Revenue Table</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {dailyRevenue.length} records
        </span>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left min-w-[500px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-5">Date</th>
              <th className="py-3.5 px-4 text-center">Transactions</th>
              <th className="py-3.5 px-4 text-right">Revenue</th>
              <th className="py-3.5 px-5 text-right">Average Ticket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {[...dailyRevenue].reverse().map((row) => {
              const avgTicket = row.transactions > 0 ? Math.round(row.revenue / row.transactions) : 0;
              return (
                <tr key={row.date} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 text-slate-500 font-semibold">{formatDate(row.date)}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">{row.transactions} items</td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                    {formatRupiah(row.revenue)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-blue-600">
                    {formatRupiah(avgTicket)}
                  </td>
                </tr>
              );
            })}
            {dailyRevenue.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold">
                  No transaction records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
