"use client";

import React from "react";

interface WorkOrderFilterProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

export const WorkOrderFilter: React.FC<WorkOrderFilterProps> = ({
  statusFilter,
  onStatusChange,
}) => {
  return (
    <select
      value={statusFilter}
      onChange={(e) => onStatusChange(e.target.value)}
      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs cursor-pointer shrink-0"
    >
      <option value="">Status: Semua</option>
      <option value="PENDING">Waiting</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="WAITING_PART">Waiting Part</option>
      <option value="READY">Ready</option>
      <option value="COMPLETED">Finished</option>
      <option value="CANCELLED">Cancelled</option>
    </select>
  );
};
