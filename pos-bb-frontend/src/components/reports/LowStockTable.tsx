import React from "react";

interface LowStockItem {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  price: number;
}

interface LowStockTableProps {
  lowStockList: LowStockItem[];
}

export const LowStockTable: React.FC<LowStockTableProps> = ({
  lowStockList,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Low Stock Alert</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          {lowStockList.length} items alert
        </span>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left min-w-[500px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-5">Part Name</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4 text-center">Current Stock</th>
              <th className="py-3 px-4 text-center">Min Alert</th>
              <th className="py-3 px-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {lowStockList.map((row, idx) => {
              const isCritical = row.stock <= 2;
              return (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      {isCritical ? (
                        <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="font-bold text-slate-900 leading-tight">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400 font-semibold">{row.sku || "-"}</td>
                  <td className={`py-3 px-4 text-center font-mono font-bold ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                    {row.stock} pcs
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">5 pcs</td>
                  <td className="py-3 px-5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border ${
                      isCritical
                        ? "bg-rose-50 text-rose-700 border-rose-200/60"
                        : "bg-amber-50 text-amber-700 border-amber-200/60"
                    }`}>
                      {isCritical ? "Critical" : "Low"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {lowStockList.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                  No parts running low on stock
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
