"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/common";
import { StatusBadge } from "@/features/work-orders/components/StatusBadge";
import { WorkOrderService as WOService } from "@/services/workorder.service";
import { InvoiceService } from "@/services/invoice";
import { WorkOrder, WorkOrderStatus, STATUS_LABELS } from "@/types/workOrder";
import { formatRupiah, formatDate, formatDateTime } from "@/utils/format";
import { useToast } from "@/components/common/Toast";
import { EditWorkOrderModal } from "@/features/work-orders/form/EditWorkOrderModal";

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
  IN_PROGRESS: "Selesaikan Pekerjaan",
  WAITING_PART: "Tandai Siap",
  READY: "Selesaikan Order",
};

interface TimelineEvent {
  time: string;
  title: string;
  desc?: string;
}

interface UnifiedItem {
  id: string;
  name: string;
  category: "SERVICE" | "PART";
  qty: number;
  price: number;
  subtotal: number;
  sku?: string | null;
}

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
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl">
          <p className="text-slate-500 font-semibold">Work Order tidak ditemukan.</p>
          <Link href="/work-orders" className="mt-4 inline-block text-[#0F172A] text-xs font-bold bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all shadow-3xs">
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

  // Reconstruct events timeline dynamically
  const getTimelineEvents = (wo: WorkOrder): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    if (wo.createdAt) {
      events.push({
        time: formatDateTime(wo.createdAt),
        title: "Work Order Dibuat",
        desc: "Work order terdaftar ke dalam database."
      });
    }
    if (wo.mechanic) {
      events.push({
        time: formatDateTime(wo.createdAt),
        title: "Mekanik Ditunjuk",
        desc: `${wo.mechanic.name} telah ditugaskan untuk menangani pengerjaan ini.`
      });
    }
    if ((wo.services || []).length > 0 || (wo.parts || []).length > 0) {
      events.push({
        time: formatDateTime(wo.createdAt),
        title: "Item Transaksi Ditambahkan",
        desc: `Ditambahkan ${(wo.services || []).length} jasa servis dan ${(wo.parts || []).length} suku cadang.`
      });
    }
    if (wo.status !== "PENDING" && wo.status !== "CANCELLED") {
      events.push({
        time: formatDateTime(wo.checkInAt || wo.createdAt),
        title: "Pengerjaan Dimulai",
        desc: "Status diperbarui menjadi Dalam Pengerjaan."
      });
    }
    if (wo.status === "READY" || wo.status === "COMPLETED") {
      events.push({
        time: formatDateTime(wo.finishedAt || wo.updatedAt),
        title: "Pengerjaan Selesai",
        desc: "Mekanik telah menandai pengerjaan ini selesai dan siap."
      });
    }
    if (wo.invoice) {
      events.push({
        time: formatDateTime(wo.updatedAt),
        title: "Invoice Diterbitkan",
        desc: `Invoice #${wo.invoice.invoiceNumber} siap dicetak.`
      });
    }
    if (wo.payment && wo.payment.status === "PAID") {
      events.push({
        time: formatDateTime(wo.payment.paidAt || wo.updatedAt),
        title: "Pembayaran Lunas",
        desc: `Transaksi selesai diselesaikan dengan metode ${wo.payment.method || "Kas"}.`
      });
    }
    return events;
  };

  // Merge items into single visual list
  const getUnifiedItems = (wo: WorkOrder): UnifiedItem[] => {
    const items: UnifiedItem[] = [];
    (wo.services || []).forEach((s) => {
      items.push({
        id: `service-${s.id}`,
        name: s.service?.name || "Jasa Servis",
        category: "SERVICE",
        qty: s.quantity,
        price: s.price,
        subtotal: s.subtotal,
      });
    });
    (wo.parts || []).forEach((p) => {
      items.push({
        id: `part-${p.id}`,
        name: p.sparePart?.name || "Suku Cadang",
        category: "PART",
        qty: p.quantity,
        price: p.price,
        subtotal: p.subtotal,
        sku: p.sparePart?.sku,
      });
    });
    return items;
  };

  // Pipeline Stage Setup
  const pipelineSteps = [
    { label: "Created", completed: true, active: false },
    { label: "Waiting", completed: workOrder.status !== "PENDING", active: workOrder.status === "PENDING" },
    {
      label: "In Progress",
      completed: workOrder.status !== "PENDING" && workOrder.status !== "IN_PROGRESS" && workOrder.status !== "WAITING_PART",
      active: workOrder.status === "IN_PROGRESS" || workOrder.status === "WAITING_PART",
    },
    {
      label: "Finished",
      completed: workOrder.status === "COMPLETED" || Boolean(workOrder.invoice),
      active: workOrder.status === "READY",
    },
    {
      label: "Invoiced",
      completed: Boolean(workOrder.invoice),
      active: workOrder.status === "COMPLETED" && !workOrder.invoice,
    },
  ];

  return (
    <PageContainer>
      {/* Hero Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200/60 pb-6 mb-8 print:hidden">
        <div className="flex items-start gap-4">
          <Link
            href="/work-orders"
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors shadow-2xs cursor-pointer shrink-0 mt-0.5"
            title="Kembali ke Daftar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                {workOrder.code}
              </h1>
              <StatusBadge status={workOrder.status} size="md" />
              {workOrder.vehicle && (
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {workOrder.vehicle.plateNumber}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
              <p>
                Pelanggan:{" "}
                <span className="font-semibold text-slate-800">
                  {workOrder.customer?.name || "-"}
                </span>
              </p>
              <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
              <p>
                Mekanik:{" "}
                <span className="font-semibold text-slate-800">
                  {workOrder.mechanic?.name || "Belum ditunjuk"}
                </span>
              </p>
              <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
              <p>
                Dibuat:{" "}
                <span className="font-semibold text-slate-800">
                  {formatDate(workOrder.createdAt)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Header Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Secondary Actions */}
          {workOrder.status !== "COMPLETED" && workOrder.status !== "CANCELLED" && (
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Pekerjaan</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Cetak WO</span>
          </button>

          {/* Delete Shortcut */}
          <button
            type="button"
            disabled={Boolean(workOrder.invoice)}
            onClick={() => !workOrder.invoice && setShowDeleteModal(true)}
            className={`p-2.5 border rounded-xl transition-colors shrink-0 shadow-2xs ${
              workOrder.invoice
                ? "text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed opacity-55"
                : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200 hover:border-rose-200 cursor-pointer"
            }`}
            title={
              workOrder.invoice
                ? "Cannot delete. This Work Order has already been invoiced."
                : "Hapus Work Order"
            }
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Primary CTA (depending on status) */}
          {nextStatus && nextLabel && (
            <button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
              className="px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {updatingStatus ? (
                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>{nextLabel}</span>
            </button>
          )}

          {workOrder.status === "COMPLETED" && !workOrder.invoice && (
            <button
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {generatingInvoice ? (
                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span>Buat Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout Workspace */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column (68%) */}
        <div className="flex-1 w-full min-w-0 space-y-8">
          {/* Merged Information Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs flex flex-col md:flex-row md:items-start divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-y-4 md:gap-y-0">
            {/* Customer Section */}
            <div className="flex-1 pb-4 md:pb-0 md:pr-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Pelanggan</h4>
              {workOrder.customer ? (
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{workOrder.customer.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{workOrder.customer.phone}</p>
                  {workOrder.customer.address && (
                    <p className="text-xs text-slate-400 mt-1">{workOrder.customer.address}</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs">-</p>
              )}
            </div>

            {/* Vehicle Section */}
            <div className="flex-1 py-4 md:py-0 md:px-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Kendaraan</h4>
              {workOrder.vehicle ? (
                <div className="space-y-1">
                  <p className="font-mono font-black text-slate-900 text-sm tracking-wider uppercase">
                    {workOrder.vehicle.plateNumber}
                  </p>
                  <p className="text-xs text-slate-700 font-bold mt-1">
                    {workOrder.vehicle.brand} {workOrder.vehicle.model}
                    {workOrder.vehicle.year ? ` (${workOrder.vehicle.year})` : ""}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{workOrder.vehicle.transmission}</p>
                  {workOrder.odometer && (
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      Odometer: <span className="font-mono font-extrabold text-slate-800">{workOrder.odometer.toLocaleString()} km</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs">-</p>
              )}
            </div>

            {/* Mechanic Section */}
            <div className="flex-1 pt-4 md:pt-0 md:pl-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Mekanik</h4>
              {workOrder.mechanic ? (
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{workOrder.mechanic.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{workOrder.mechanic.phone}</p>
                  {workOrder.mechanic.skills && (
                    <p className="text-xs text-slate-400 mt-1">{workOrder.mechanic.skills}</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs">Belum ditunjuk</p>
              )}
            </div>
          </div>

          {/* Compact Complaint Section */}
          {(workOrder.complaint || workOrder.notes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workOrder.complaint && (
                <div className="flex gap-3 items-start bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4.5">
                  <div className="w-5.5 h-5.5 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
                    ⚠️
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Detail Keluhan</h4>
                    <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{workOrder.complaint}</p>
                  </div>
                </div>
              )}
              {workOrder.notes && (
                <div className="flex gap-3 items-start bg-slate-50 border border-slate-200/60 rounded-2xl p-4.5">
                  <div className="w-5.5 h-5.5 bg-slate-200 rounded-lg flex items-center justify-center shrink-0 text-slate-600 mt-0.5">
                    📝
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Internal</h4>
                    <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{workOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Unified Work Order Items Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-3xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Daftar Item Pekerjaan</h3>
              {workOrder.status !== "COMPLETED" && workOrder.status !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Edit Item
                </button>
              )}
            </div>
            {getUnifiedItems(workOrder).length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 italic">Belum ada item jasa atau suku cadang ditambahkan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="py-3 px-4 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Nama Item</th>
                      <th className="py-3 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider w-24">Kategori</th>
                      <th className="py-3 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider w-20">Qty</th>
                      <th className="py-3 px-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider w-36">Harga Satuan</th>
                      <th className="py-3 px-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider w-36">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getUnifiedItems(workOrder).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-950">{item.name}</p>
                          {item.sku && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {item.sku}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black border ${
                            item.category === "SERVICE"
                              ? "bg-slate-100 border-slate-200 text-slate-600"
                              : "bg-orange-50 border-orange-200/50 text-orange-700"
                          }`}>
                            {item.category === "SERVICE" ? "SERVICE" : "PART"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{item.qty}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">{formatRupiah(item.price)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs">
            <h3 className="text-sm font-bold text-slate-900 mb-5">Riwayat & Progres Kerja</h3>
            <div className="relative border-l border-slate-100 ml-3.5 pl-6 space-y-6">
              {getTimelineEvents(workOrder).map((event, idx) => (
                <div key={idx} className="relative">
                  {/* Dot indicator */}
                  <div className="absolute -left-[32px] top-0.5 w-3 h-3 rounded-full border-2 border-white bg-slate-950 shadow-sm flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-extrabold text-slate-900">{event.title}</p>
                      <span className="text-[9px] font-medium text-slate-400 font-mono">({event.time})</span>
                    </div>
                    {event.desc && <p className="text-xs text-slate-500 mt-1">{event.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column / Sticky Summary (32%) */}
        <div className="w-full lg:w-[32%] shrink-0 lg:sticky lg:top-6 space-y-6 print:hidden">
          {/* Operational Progress Stepper */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-3xs">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Workflow Status</h4>
            <div className="flex flex-col gap-4">
              {pipelineSteps.map((step, idx) => {
                const isCompleted = step.completed;
                const isActive = step.active;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all shrink-0 ${
                        isCompleted
                          ? "bg-slate-900 border-slate-900 text-white"
                          : isActive
                          ? "bg-emerald-500 border-emerald-500 text-white ring-2 ring-emerald-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block ${isActive ? "text-emerald-600 font-extrabold" : isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Cost Summary Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">Ringkasan Tagihan</h3>
            
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Total Jasa Servis</span>
                <span className="font-mono font-semibold text-slate-800">{formatRupiah(totalService)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Suku Cadang</span>
                <span className="font-mono font-semibold text-slate-800">{formatRupiah(totalPart)}</span>
              </div>
              
              {workOrder.discount > 0 && (
                <div className="flex justify-between items-center text-rose-600 font-medium">
                  <span>Diskon</span>
                  <span className="font-mono">-{formatRupiah(workOrder.discount)}</span>
                </div>
              )}
              
              {workOrder.tax > 0 && (
                <div className="flex justify-between items-center">
                  <span>Pajak (11%)</span>
                  <span className="font-mono">+{formatRupiah(workOrder.tax)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grand Total</p>
                {workOrder.payment && (
                  <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                    workOrder.payment.status === "PAID"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}>
                    {workOrder.payment.status === "PAID" ? "Lunas" : "Belum Lunas"}
                  </span>
                )}
              </div>
              <p className="font-mono text-xl font-black text-slate-900">{formatRupiah(workOrder.grandTotal)}</p>
            </div>

            {/* Main Action buttons row in summary card */}
            <div className="pt-2">
              {nextStatus && nextLabel && (
                <button
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus}
                  className="w-full px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {updatingStatus ? (
                    <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span>{nextLabel}</span>
                </button>
              )}

              {workOrder.status === "COMPLETED" && !workOrder.invoice && (
                <button
                  onClick={handleGenerateInvoice}
                  disabled={generatingInvoice}
                  className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {generatingInvoice ? (
                    <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <span>Buat Invoice</span>
                </button>
              )}

              {workOrder.invoice && (
                <Link
                  href={`/invoices/${workOrder.invoice.id}`}
                  className="w-full px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Lihat Invoice</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hapus Work Order?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            {workOrder.invoice && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Terdapat invoice terkait ({workOrder.invoice.invoiceNumber}).</span>
              </div>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || Boolean(workOrder.invoice)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
