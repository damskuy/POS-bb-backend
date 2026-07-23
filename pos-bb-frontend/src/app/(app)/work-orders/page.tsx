"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageContainer, PageHeader, Pagination } from "@/components/common";
import { WorkOrderTable } from "@/features/work-orders/components/WorkOrderTable";
import { WorkOrderSearch } from "@/features/work-orders/components/WorkOrderSearch";
import { WorkOrderFilter } from "@/features/work-orders/components/WorkOrderFilter";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { WorkOrder } from "@/types/workOrder";

export default function WorkOrdersPage() {
  const {
    workOrders,
    loading,
    isFetching,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    limit,
    total,
    deleteWorkOrder,
  } = useWorkOrders();

  const [woToDelete, setWoToDelete] = useState<WorkOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!woToDelete) return;
    setDeleting(true);
    await deleteWorkOrder(woToDelete.id);
    setDeleting(false);
    setWoToDelete(null);
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Work Order"
        subtitle="Kelola semua perintah kerja servis kendaraan."
        badge="Operasional"
        action={
          <Link
            href="/work-orders/new"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
            </svg>
            <span>Work Order Baru</span>
          </Link>
        }
      />

      {/* Unified Seamless Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          <WorkOrderSearch value={search} onChange={setSearch} />
          <WorkOrderFilter statusFilter={statusFilter} onStatusChange={setStatusFilter} />
        </div>
        <div className="text-xs text-slate-400 font-semibold px-2 self-end md:self-auto shrink-0 select-none">
          Total: <strong className="text-slate-700 font-tabular font-bold">{total}</strong> WO
        </div>
      </div>

      {/* Table Card Container with Pagination */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.04)] overflow-hidden">
        <WorkOrderTable
          workOrders={workOrders}
          loading={loading}
          isFetching={isFetching}
          onDelete={(wo) => setWoToDelete(wo)}
          onAddClick={() => {}}
        />
        <Pagination
          page={page}
          limit={limit}
          total={total}
          unitName="work order"
          onPageChange={setPage}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {woToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scaleUp z-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hapus Work Order?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hapus <strong className="font-mono">{woToDelete.code}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            {woToDelete.invoice && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>❌ Cannot delete. This Work Order has already been invoiced.</span>
              </div>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setWoToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting || Boolean(woToDelete.invoice)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
