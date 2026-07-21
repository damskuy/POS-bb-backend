"use client";

import React from "react";

interface StockFilterProps {
  stockFilter: string;
  onChange: (filter: string) => void;
}

export const StockFilter: React.FC<StockFilterProps> = ({
  stockFilter,
  onChange,
}) => {
  return (
    <div className="relative shrink-0">
      <select
        value={stockFilter}
        onChange={(e) => onChange(e.target.value)}
        className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs cursor-pointer"
      >
        <option value="All">Stok: Semua</option>
        <option value="In Stock">Stok: In Stock (Aman)</option>
        <option value="Low Stock">Stok: Low Stock (Menipis)</option>
      </select>
    </div>
  );
};
