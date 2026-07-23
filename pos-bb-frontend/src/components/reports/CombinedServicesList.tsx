import React from "react";

interface ComboItem {
  combination: string;
  count: number;
}

interface CombinedServicesListProps {
  combinations: ComboItem[];
}

export const CombinedServicesList: React.FC<CombinedServicesListProps> = ({
  combinations,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Frequently Combined Services</h3>
      </div>

      {/* Combinations List */}
      <div className="space-y-3.5 flex-1 flex flex-col justify-center">
        {combinations.slice(0, 5).map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all duration-150"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="text-xs font-bold text-slate-800 leading-snug">{item.combination}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black font-mono bg-purple-50 text-purple-700 border border-purple-100">
                {item.count} times
              </span>
            </div>
          </div>
        ))}
        {combinations.length === 0 && (
          <p className="text-center text-xs text-slate-400 font-semibold py-8">
            No service combinations recorded yet
          </p>
        )}
      </div>
    </div>
  );
};
