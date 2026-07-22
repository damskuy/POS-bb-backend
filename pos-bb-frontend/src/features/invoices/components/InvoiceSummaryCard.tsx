"use client";

import React from "react";
import { Invoice } from "@/types/invoice";
import { formatRupiah } from "@/utils/format";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

interface InvoiceSummaryCardProps {
  invoice: Invoice;
}

export const InvoiceSummaryCard: React.FC<InvoiceSummaryCardProps> = ({ invoice }) => {
  const total = invoice.grandTotal;
  const paid = invoice.payment?.amount ?? 0;
  const remaining = Math.max(0, total - paid);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Left: breakdown */}
        <div className="grid grid-cols-3 gap-6 flex-1">
          {/* Total */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Total Tagihan</p>
            <p className="font-mono text-lg font-black text-white">{formatRupiah(total)}</p>
          </div>

          {/* Paid */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Sudah Dibayar</p>
            <p className={`font-mono text-lg font-black ${paid > 0 ? "text-emerald-400" : "text-slate-500"}`}>
              {formatRupiah(paid)}
            </p>
          </div>

          {/* Remaining */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Sisa Tagihan</p>
            <p className={`font-mono text-lg font-black ${remaining > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {formatRupiah(remaining)}
            </p>
          </div>
        </div>

        {/* Right: Status */}
        <div className="flex flex-col items-start sm:items-end gap-1">
          <p className="text-xs text-slate-400">Status Pembayaran</p>
          <PaymentStatusBadge status={invoice.paymentStatus} size="lg" />
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mt-5">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
            <span>Progress Pembayaran</span>
            <span className="font-mono font-bold">
              {Math.min(100, Math.round((paid / total) * 100))}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (paid / total) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
