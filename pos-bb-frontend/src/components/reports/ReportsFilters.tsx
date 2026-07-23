"use client";

import React, { useState } from "react";

interface ReportsFiltersProps {
  dateRange: string;
  setDateRange: (range: string) => void;
}

export const ReportsFilters: React.FC<ReportsFiltersProps> = ({
  dateRange,
  setDateRange,
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const dateRanges = [
    "Today",
    "Yesterday",
    "Last 7 Days",
    "Last 30 Days",
    "This Month",
    "Last Month",
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between pb-1 animate-fadeIn">
      {/* Filter Selectors Group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-lg">
        {/* Date Range Selector */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Periode
          </label>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer appearance-none animate-fadeIn"
            >
              {dateRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button (Dropdown) */}
      <div className="relative flex flex-col justify-end self-end mt-4 lg:mt-0">
        <label className="hidden lg:block text-[10px] font-bold text-transparent select-none mb-1">
          Aksi
        </label>
        <button
          type="button"
          onClick={() => setShowExportDropdown(!showExportDropdown)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 h-[42px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export Laporan</span>
          <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showExportDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowExportDropdown(false)}
            />
            <div className="absolute right-0 bottom-full lg:top-full lg:bottom-auto mb-2 lg:mb-0 lg:mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-scaleUp">
              <button
                type="button"
                onClick={() => setShowExportDropdown(false)}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
              <button
                type="button"
                onClick={() => setShowExportDropdown(false)}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
