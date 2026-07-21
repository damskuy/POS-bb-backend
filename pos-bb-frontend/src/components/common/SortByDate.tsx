"use client";

import React from "react";

interface SortByDateProps {
  order: "asc" | "desc";
  onChange: (order: "asc" | "desc") => void;
}

export const SortByDate: React.FC<SortByDateProps> = ({ order, onChange }) => {
  return (
    <div className="relative shrink-0">
      <select
        value={order}
        onChange={(e) => onChange(e.target.value as "asc" | "desc")}
        className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs cursor-pointer"
      >
        <option value="desc">Terdaftar: Terbaru</option>
        <option value="asc">Terdaftar: Terlama</option>
      </select>
    </div>
  );
};
