import React from "react";

interface TopSellingItem {
  sparePartName: string;
  totalQuantity: number;
}

interface TopSellingPartsChartProps {
  topSelling: TopSellingItem[];
}

export const TopSellingPartsChart: React.FC<TopSellingPartsChartProps> = ({
  topSelling,
}) => {
  const maxSold = Math.max(...topSelling.map((p) => p.totalQuantity), 1);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Top Selling Spare Parts</h3>
      </div>

      {/* Horizontal Progress Bars */}
      <div className="space-y-3.5 flex-1 flex flex-col justify-center">
        {topSelling.slice(0, 5).map((p, idx) => {
          const widthPercent = (p.totalQuantity / maxSold) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs" title={p.sparePartName}>
                  {p.sparePartName}
                </span>
                <span className="font-mono text-slate-500 shrink-0">{p.totalQuantity} sold</span>
              </div>
              <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
        {topSelling.length === 0 && (
          <p className="text-center text-xs text-slate-400 font-semibold py-8">
            No parts sold in this period
          </p>
        )}
      </div>
    </div>
  );
};
