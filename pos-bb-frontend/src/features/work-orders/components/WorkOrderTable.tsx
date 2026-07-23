"use client";

import React from "react";
import { WorkOrder } from "@/types/workOrder";
import { formatDate, formatRupiah } from "@/utils/format";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import Link from "next/link";

interface WorkOrderTableProps {
  workOrders: WorkOrder[];
  loading: boolean;
  isFetching?: boolean;
  onDelete?: (wo: WorkOrder) => void;
  onAddClick?: () => void;
}

export const WorkOrderTable: React.FC<WorkOrderTableProps> = ({
  workOrders,
  loading,
  isFetching = false,
  onDelete,
  onAddClick,
}) => {
  if (loading && workOrders.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between animate-pulse gap-4">
            <div className="space-y-1.5">
              <div className="w-28 h-4 bg-slate-200 rounded" />
              <div className="w-20 h-3 bg-slate-100 rounded" />
            </div>
            <div className="w-32 h-4 bg-slate-200 rounded hidden sm:block" />
            <div className="w-24 h-4 bg-slate-200 rounded hidden md:block" />
            <div className="w-20 h-6 bg-slate-200 rounded-full" />
            <div className="w-24 h-4 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (workOrders.length === 0 && !loading) {
    return (
      <EmptyState
        title="Belum Ada Work Order"
        description="Belum ada work order yang dibuat. Klik 'Work Order Baru' untuk membuat perintah kerja pertama."
        action={
          onAddClick && (
            <Link
              href="/work-orders/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Buat Work Order Baru</span>
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="relative">
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-200 overflow-hidden z-20">
          <div className="h-full bg-slate-900 animate-pulse w-full" />
        </div>
      )}

      <div className={`overflow-x-auto transition-opacity duration-200 ${isFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/80">
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nomor WO</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kendaraan</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mekanik</th>
              <th className="text-center px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workOrders.map((wo) => {
              const hasInvoice = Boolean(wo.invoice);

              return (
                <tr key={wo.id} className="group hover:bg-slate-50/60 transition-colors">
                  {/* WO Number */}
                  <td className="px-6 py-4">
                    <Link href={`/work-orders/${wo.id}`} className="group/link block">
                      <p className="font-mono font-bold text-blue-600 hover:text-blue-800 text-sm transition-colors">
                        {wo.code}
                      </p>
                      {wo.complaint && (
                        <p className="text-xs text-slate-400 font-normal truncate max-w-[140px] mt-0.5">
                          {wo.complaint}
                        </p>
                      )}
                    </Link>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(wo.createdAt)}
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    {wo.customer ? (
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{wo.customer.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{wo.customer.phone}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">-</span>
                    )}
                  </td>

                  {/* Vehicle */}
                  <td className="px-6 py-4">
                    {wo.vehicle ? (
                      <div>
                        <p className="font-mono font-extrabold text-slate-900 text-xs uppercase">{wo.vehicle.plateNumber}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{wo.vehicle.brand} {wo.vehicle.model}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">-</span>
                    )}
                  </td>

                  {/* Mechanic */}
                  <td className="px-6 py-4 text-sm text-slate-800 font-semibold">
                    {wo.mechanic?.name || <span className="text-slate-400 italic font-normal">-</span>}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex justify-center">
                      <StatusBadge status={wo.status} />
                    </div>
                  </td>

                  {/* Grand Total */}
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono font-semibold text-slate-900 text-sm">
                      {formatRupiah(wo.grandTotal)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/work-orders/${wo.id}`}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Lihat Detail"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      {onDelete && (
                        <button
                          type="button"
                          disabled={hasInvoice}
                          onClick={() => !hasInvoice && onDelete(wo)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            hasInvoice
                              ? "text-slate-200 cursor-not-allowed opacity-40"
                              : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          }`}
                          title={
                            hasInvoice
                              ? "Cannot delete. This Work Order has already been invoiced."
                              : "Hapus Work Order"
                          }
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
