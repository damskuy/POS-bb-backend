"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/common";
import { StatusBadge } from "@/features/work-orders/components/StatusBadge";
import { WorkOrderService as WOService } from "@/services/workorder.service";
import { InvoiceService } from "@/services/invoice";
import { WorkOrder, WorkOrderStatus, STATUS_LABELS, STATUS_FLOW } from "@/types/workOrder";
import { formatRupiah, formatDate, formatDateTime } from "@/utils/format";
import { useToast } from "@/components/common/Toast";

import { EditWorkOrderModal } from "@/features/work-orders/form/EditWorkOrderModal";

// Status next step config
const nextStatusMap: Record<WorkOrderStatus, WorkOrderStatus | null> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "READY",
  WAITING_PART: "READY",
  READY: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null,
};

const nextStatusLabel: Partial<Record<WorkOrderStatus, string>> = {
  PENDING: "Mulai Pengerjaan",
  IN_PROGRESS: "Tandai Selesai Proses",
  WAITING_PART: "Tandai Siap",
  READY: "Tandai Selesai",
};

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const fetchWorkOrder = async () => {
    setLoading(true);
    try {
      const wo = await WOService.getWorkOrderById(Number(id));
      setWorkOrder(wo);
    } catch (err: any) {
      showToast(err.message || "Gagal memuat work order", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrder();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!workOrder) return;
    const next = nextStatusMap[workOrder.status];
    if (!next) return;
    setUpdatingStatus(true);
    try {
      await WOService.updateWorkOrder(workOrder.id, { status: next });
      showToast("Status berhasil diperbarui", "success");
      fetchWorkOrder();
    } catch (err: any) {
      showToast(err.message || "Gagal update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!workOrder) return;
    setDeleting(true);
    try {
      await WOService.deleteWorkOrder(workOrder.id);
      showToast("Work Order berhasil dihapus", "success");
      router.push("/work-orders");
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus", "error");
      setDeleting(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!workOrder) return;
    setGeneratingInvoice(true);
    try {
      const invoice = await InvoiceService.createInvoice(workOrder.id);
      showToast("Invoice berhasil dibuat.", "success");
      router.push(`/invoices/${invoice.id}`);
    } catch (err: any) {
      showToast(err.message || "Gagal membuat invoice", "error");
      setGeneratingInvoice(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-52 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!workOrder) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <p className="text-slate-500 font-medium">Work Order tidak ditemukan.</p>
          <Link href="/work-orders" className="mt-4 inline-block text-blue-600 text-sm font-semibold hover:underline">
            Kembali ke Daftar
          </Link>
        </div>
      </PageContainer>
    );
  }

  const nextStatus = nextStatusMap[workOrder.status];
  const nextLabel = nextStatusLabel[workOrder.status];

  const totalService = (workOrder.services || []).reduce((s, i) => s + i.subtotal, 0);
  const totalPart = (workOrder.parts || []).reduce((s, i) => s + i.subtotal, 0);

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/work-orders"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {workOrder.code}
              </h1>
              <StatusBadge status={workOrder.status} size="md" />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{formatDate(workOrder.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Generate Invoice button — only when COMPLETED and no invoice yet */}
          {workOrder.status === "COMPLETED" && !workOrder.invoice && (
            <button
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
            >
              {generatingInvoice ? (
                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {generatingInvoice ? "Membuat..." : "Generate Invoice"}
            </button>
          )}

          {/* View invoice button — if already has invoice */}
          {workOrder.invoice && (
            <Link
              href={`/invoices/${workOrder.invoice.id}`}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Lihat Invoice
            </Link>
          )}

          {/* Edit Items button — available when status is not COMPLETED or CANCELLED */}
          {workOrder.status !== "COMPLETED" && workOrder.status !== "CANCELLED" && (
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Jasa & Part
            </button>
          )}

          {/* Next status button */}
          {nextStatus && nextLabel && (
            <button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              {updatingStatus ? (
                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {nextLabel}
            </button>
          )}

          <button
            type="button"
            disabled={Boolean(workOrder.invoice)}
            onClick={() => !workOrder.invoice && setShowDeleteModal(true)}
            className={`p-2 border rounded-xl transition-colors ${
              workOrder.invoice
                ? "text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed opacity-50"
                : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200"
            }`}
            title={
              workOrder.invoice
                ? "❌ Cannot delete. This Work Order has already been invoiced."
                : "Hapus Work Order"
            }
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Customer</p>
          {workOrder.customer ? (
            <div className="space-y-1">
              <p className="font-bold text-slate-900">{workOrder.customer.name}</p>
              <p className="text-sm text-slate-500 font-mono">{workOrder.customer.phone}</p>
              {workOrder.customer.address && (
                <p className="text-xs text-slate-400">{workOrder.customer.address}</p>
              )}
            </div>
          ) : (
            <p className="text-slate-400 italic text-sm">-</p>
          )}
        </div>

        {/* Vehicle */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Kendaraan</p>
          {workOrder.vehicle ? (
            <div className="space-y-1">
              <p className="font-mono font-black text-slate-900 text-xl tracking-wider uppercase">
                {workOrder.vehicle.plateNumber}
              </p>
              <p className="text-sm text-slate-700 font-medium">
                {workOrder.vehicle.brand} {workOrder.vehicle.model}
                {workOrder.vehicle.year ? ` (${workOrder.vehicle.year})` : ""}
              </p>
              <p className="text-xs text-slate-400">{workOrder.vehicle.transmission}</p>
            </div>
          ) : (
            <p className="text-slate-400 italic text-sm">-</p>
          )}
          {workOrder.odometer && (
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Odometer: <span className="font-mono font-bold">{workOrder.odometer.toLocaleString()} km</span>
            </p>
          )}
        </div>

        {/* Mechanic */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Mekanik</p>
          {workOrder.mechanic ? (
            <div className="space-y-1">
              <p className="font-bold text-slate-900">{workOrder.mechanic.name}</p>
              <p className="text-sm text-slate-500 font-mono">{workOrder.mechanic.phone}</p>
              {workOrder.mechanic.skills && (
                <p className="text-xs text-slate-400">{workOrder.mechanic.skills}</p>
              )}
            </div>
          ) : (
            <p className="text-slate-400 italic text-sm">Belum ada mekanik</p>
          )}
        </div>
      </div>

      {/* Complaint & Notes */}
      {(workOrder.complaint || workOrder.notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workOrder.complaint && (
            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5">
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2">Keluhan</p>
              <p className="text-sm text-slate-700 leading-relaxed">{workOrder.complaint}</p>
            </div>
          )}
          {workOrder.notes && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Catatan</p>
              <p className="text-sm text-slate-700 leading-relaxed">{workOrder.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Services & Parts Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Services */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Jasa Servis</h3>
            </div>
            <div className="flex items-center gap-2">
              {workOrder.status !== "COMPLETED" && workOrder.status !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  + Edit Jasa
                </button>
              )}
              <span className="font-mono text-xs font-bold text-blue-600">{formatRupiah(totalService)}</span>
            </div>
          </div>
          {(workOrder.services || []).length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400 italic">Tidak ada jasa</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-2.5 px-4 text-left font-bold text-slate-500 text-[11px] uppercase tracking-wide">Jasa</th>
                  <th className="py-2.5 px-4 text-center font-bold text-slate-500 text-[11px] uppercase tracking-wide">Qty</th>
                  <th className="py-2.5 px-4 text-right font-bold text-slate-500 text-[11px] uppercase tracking-wide">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(workOrder.services || []).map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{item.service?.name || "-"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatRupiah(item.price)} / unit</p>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{formatRupiah(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Spare Parts */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Suku Cadang</h3>
            </div>
            <div className="flex items-center gap-2">
              {workOrder.status !== "COMPLETED" && workOrder.status !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  + Edit Part
                </button>
              )}
              <span className="font-mono text-xs font-bold text-orange-600">{formatRupiah(totalPart)}</span>
            </div>
          </div>
          {(workOrder.parts || []).length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400 italic">Tidak ada suku cadang</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-2.5 px-4 text-left font-bold text-slate-500 text-[11px] uppercase tracking-wide">Part</th>
                  <th className="py-2.5 px-4 text-center font-bold text-slate-500 text-[11px] uppercase tracking-wide">Qty</th>
                  <th className="py-2.5 px-4 text-right font-bold text-slate-500 text-[11px] uppercase tracking-wide">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(workOrder.parts || []).map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{item.sparePart?.name || "-"}</p>
                      {item.sparePart?.sku && (
                        <p className="text-[10px] text-slate-400 font-mono">{item.sparePart.sku}</p>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono">{formatRupiah(item.price)} / unit</p>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-orange-700">{formatRupiah(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Grand Total Summary */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Total Jasa:</span>
              <span className="font-mono font-bold text-blue-300">{formatRupiah(totalService)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Total Suku Cadang:</span>
              <span className="font-mono font-bold text-orange-300">{formatRupiah(totalPart)}</span>
            </div>
            {workOrder.discount > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Diskon:</span>
                <span className="font-mono font-bold text-rose-300">-{formatRupiah(workOrder.discount)}</span>
              </div>
            )}
            {workOrder.tax > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Pajak:</span>
                <span className="font-mono font-bold text-slate-300">+{formatRupiah(workOrder.tax)}</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Grand Total</p>
            <p className="font-mono text-3xl font-black text-emerald-400">{formatRupiah(workOrder.grandTotal)}</p>
            {workOrder.payment && (
              <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                workOrder.payment.status === "PAID"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}>
                {workOrder.payment.status === "PAID" ? "Lunas" : "Belum Lunas"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="text-xs text-slate-400 font-medium space-y-0.5">
        <p>Dibuat: <span className="text-slate-600 font-semibold">{formatDateTime(workOrder.createdAt)}</span></p>
        <p>Diperbarui: <span className="text-slate-600 font-semibold">{formatDateTime(workOrder.updatedAt)}</span></p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hapus Work Order?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hapus <strong className="font-mono">{workOrder.code}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            {workOrder.invoice && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>❌ Cannot delete. This Work Order has already been invoiced ({workOrder.invoice.invoiceNumber}).</span>
              </div>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || Boolean(workOrder.invoice)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Work Order Modal */}
      {workOrder && (
        <EditWorkOrderModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          workOrder={workOrder}
          onSuccess={fetchWorkOrder}
        />
      )}
    </PageContainer>
  );
}
