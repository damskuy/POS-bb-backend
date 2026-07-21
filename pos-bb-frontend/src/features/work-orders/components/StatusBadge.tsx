"use client";

import React from "react";
import { WorkOrderStatus, STATUS_LABELS } from "@/types/workOrder";

interface StatusBadgeProps {
  status: WorkOrderStatus | string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; classes: string; dotClass: string }> = {
  PENDING: {
    label: "Waiting",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500 animate-pulse",
  },
  WAITING_PART: {
    label: "Waiting Part",
    classes: "bg-orange-50 text-orange-700 border-orange-200",
    dotClass: "bg-orange-500",
  },
  READY: {
    label: "Ready",
    classes: "bg-teal-50 text-teal-700 border-teal-200",
    dotClass: "bg-teal-500",
  },
  COMPLETED: {
    label: "Finished",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    classes: "bg-slate-100 text-slate-500 border-slate-200",
    dotClass: "bg-slate-400",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "sm" }) => {
  const config = statusConfig[status] || {
    label: status,
    classes: "bg-slate-100 text-slate-600 border-slate-200",
    dotClass: "bg-slate-400",
  };

  const sizeClasses = size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeClasses} ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
};
