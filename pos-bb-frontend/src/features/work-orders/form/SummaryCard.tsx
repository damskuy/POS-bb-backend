"use client";

import React from "react";
import { formatRupiah } from "@/utils/format";
import { WorkOrderServiceInput, WorkOrderPartInput } from "@/types/workOrder";
import { Service } from "@/types/service";
import { SparePart } from "@/types/sparePart";

interface SummaryCardProps {
  selectedServices: WorkOrderServiceInput[];
  selectedParts: WorkOrderPartInput[];
  servicesData?: Service[];
  partsData?: SparePart[];
  discount?: number;
  tax?: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  selectedServices,
  selectedParts,
  discount = 0,
  tax = 0,
}) => {
  const totalService = selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const totalPart = selectedParts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const subtotal = totalService + totalPart;
  const grandTotal = Math.max(0, subtotal - discount + tax);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl sticky top-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-sm">Ringkasan Biaya</h3>
          <p className="text-xs text-slate-400">Work Order</p>
        </div>
      </div>

      {/* Summary rows */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-xs text-slate-300">Jasa Servis</span>
            <span className="text-[10px] text-slate-500 font-mono">({selectedServices.length})</span>
          </div>
          <span className="font-mono text-sm font-bold text-blue-300">{formatRupiah(totalService)}</span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-orange-400 rounded-full" />
            <span className="text-xs text-slate-300">Suku Cadang</span>
            <span className="text-[10px] text-slate-500 font-mono">({selectedParts.length})</span>
          </div>
          <span className="font-mono text-sm font-bold text-orange-300">{formatRupiah(totalPart)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-300">Diskon</span>
            <span className="font-mono text-sm font-bold text-rose-300">-{formatRupiah(discount)}</span>
          </div>
        )}

        {tax > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-300">Pajak</span>
            <span className="font-mono text-sm font-bold text-slate-300">+{formatRupiah(tax)}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 my-3" />

      {/* Grand Total */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-white">Grand Total</span>
        <span className="font-mono text-xl font-black text-emerald-400">{formatRupiah(grandTotal)}</span>
      </div>

      {/* Item count hint */}
      {(selectedServices.length === 0 && selectedParts.length === 0) && (
        <p className="text-[11px] text-slate-500 text-center mt-3">
          Tambahkan jasa atau suku cadang
        </p>
      )}
    </div>
  );
};
