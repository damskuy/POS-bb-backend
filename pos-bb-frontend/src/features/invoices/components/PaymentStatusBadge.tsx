"use client";

import React from "react";
import { PaymentStatus } from "@/types/invoice";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: "sm" | "md" | "lg";
}

const config: Record<PaymentStatus, { label: string; classes: string; dot: string }> = {
  PAID: {
    label: "Lunas",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  PARTIAL: {
    label: "Belum Lunas",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  UNPAID: {
    label: "Belum Dibayar",
    classes: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
  lg: "px-3 py-1.5 text-sm gap-2",
};

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const { label, classes, dot } = config[status] ?? config.UNPAID;
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${classes} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  );
};
