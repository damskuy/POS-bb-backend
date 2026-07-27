import React from "react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const normStatus = status.toLowerCase();

  // Color Mapping
  let dotColor = "bg-slate-400";
  let label = status;

  if (normStatus === "paid" || normStatus === "finished" || normStatus === "completed" || normStatus === "success") {
    dotColor = "bg-emerald-500";
  } else if (normStatus === "working" || normStatus === "waiting" || normStatus === "draft" || normStatus === "warning" || normStatus === "pending") {
    dotColor = "bg-amber-500";
  } else if (normStatus === "cancelled" || normStatus === "danger" || normStatus === "failed") {
    dotColor = "bg-red-500";
  } else if (normStatus === "info" || normStatus === "processing") {
    dotColor = "bg-blue-500";
  }

  return (
    <span className={`badge-status ${className}`}>
      <span className={`badge-status-dot ${dotColor}`}></span>
      <span>{label}</span>
    </span>
  );
};
