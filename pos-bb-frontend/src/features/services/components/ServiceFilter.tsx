"use client";

import React from "react";

interface ServiceFilterProps {
  selectedStatus: string;
  onChange: (status: string) => void;
}

export const ServiceFilter: React.FC<ServiceFilterProps> = ({
  selectedStatus,
  onChange,
}) => {
  return (
    <div className="relative shrink-0">
      <select
        value={selectedStatus}
        onChange={(e) => onChange(e.target.value)}
        className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs cursor-pointer"
      >
        <option value="All">Status: Semua</option>
        <option value="Active">Status: Active</option>
        <option value="Inactive">Status: Inactive</option>
      </select>
    </div>
  );
};
