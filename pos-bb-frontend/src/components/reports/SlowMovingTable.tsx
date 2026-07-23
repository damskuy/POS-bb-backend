import React from "react";
import { formatRupiah, formatDate } from "@/utils/format";

interface SlowMovingItem {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  price: number;
  lastSold: string | null;
}

interface SlowMovingTableProps {
  slowMoving: SlowMovingItem[];
}

export const SlowMovingTable: React.FC<SlowMovingTableProps> = ({
  slowMoving,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Slow Moving Items</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Slow turning stock
        </span>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left min-w-[500px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-5">Part Name</th>
              <th className="py-3 px-4">Last Sold</th>
              <th className="py-3 px-4 text-center">Stock</th>
              <th className="py-3 px-4 text-center">Days Without Sales</th>
              <th className="py-3 px-5 text-right">Inventory Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {slowMoving.map((row, idx) => {
              const lastSoldDate = row.lastSold ? new Date(row.lastSold) : null;
              const daysWithoutSales = lastSoldDate 
                ? Math.floor((new Date().getTime() - lastSoldDate.getTime()) / (1000 * 60 * 60 * 24))
                : 99; // Default to 99 days if never sold
              
              const isSlow = daysWithoutSales > 60;
              const lastSoldStr = lastSoldDate ? formatDate(row.lastSold!) : "Never";
              const invValue = row.stock * row.price;

              return (
                <tr
                  key={idx}
                  className={`transition-colors hover:bg-slate-50/60 ${
                    isSlow ? "bg-amber-50/15 hover:bg-amber-50/25" : ""
                  }`}
                >
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      {isSlow && (
                        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                      <span className={`font-bold ${isSlow ? "text-amber-900" : "text-slate-900"} leading-tight`}>
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-400 font-mono text-[10px]">{lastSoldStr}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">{row.stock} pcs</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black font-mono border ${
                        isSlow
                          ? "bg-amber-50 text-amber-700 border-amber-200/60"
                          : "bg-slate-50 text-slate-600 border-slate-200/60"
                      }`}
                    >
                      {daysWithoutSales >= 99 ? ">90 days" : `${daysWithoutSales} days`}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(invValue)}
                  </td>
                </tr>
              );
            })}
            {slowMoving.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                  No slow moving parts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
