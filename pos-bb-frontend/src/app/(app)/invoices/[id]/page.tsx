"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/common";
import { InvoiceService } from "@/services/invoice";
import { Invoice } from "@/types/invoice";
import { formatRupiah, formatDate, formatDateTime } from "@/utils/format";
import { PaymentStatusBadge } from "@/features/invoices/components/PaymentStatusBadge";
import { PaymentModal } from "@/features/invoices/components/PaymentModal";
import { useToast } from "@/components/common/Toast";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  TRANSFER: "Transfer Bank",
  EWALLET: "E-Wallet",
};

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  amount?: number;
  user?: string;
  isCompleted: boolean;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const data = await InvoiceService.getInvoiceById(Number(id));
      setInvoice(data);
    } catch (err: any) {
      showToast(err.message || "Gagal memuat invoice", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    showToast("Pembayaran berhasil ditambahkan.", "success");
    await fetchInvoice();
  };

  const handlePrint = () => {
    window.print();
  };

  const copyInvoiceLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link invoice disalin ke clipboard", "success");
    }
    setShowMoreActions(false);
  };

  const contactCustomer = () => {
    const phone = invoice?.workOrder?.customer?.phone;
    if (phone) {
      const formattedPhone = phone.replace(/\D/g, "");
      window.open(`https://wa.me/${formattedPhone}`, "_blank");
    } else {
      showToast("Nomor telepon tidak tersedia", "error");
    }
    setShowMoreActions(false);
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6 animate-pulse mt-4">
          <div className="flex justify-between items-center">
            <div className="h-10 w-80 bg-slate-200 rounded-xl" />
            <div className="h-10 w-64 bg-slate-200 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-slate-100 rounded-2xl" />
              <div className="h-64 bg-slate-100 rounded-2xl" />
            </div>
            <div className="h-96 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <p className="text-slate-500 font-medium">Invoice tidak ditemukan.</p>
          <Link href="/invoices" className="mt-4 inline-block text-slate-800 text-sm font-semibold hover:underline">
            Kembali ke Daftar Invoice
          </Link>
        </div>
      </PageContainer>
    );
  }

  const isPaid = invoice.paymentStatus === "PAID";
  const wo = invoice.workOrder;
  const totalService = invoice.services.reduce((s, i) => s + i.subtotal, 0);
  const totalPart = invoice.parts.reduce((s, i) => s + i.subtotal, 0);
  const paid = invoice.payment?.amount ?? 0;
  const remaining = Math.max(0, invoice.grandTotal - paid);

  // Unified items
  const items = [
    ...invoice.services.map((s) => ({
      name: s.name || "Jasa Servis",
      category: "SERVICE",
      quantity: s.quantity,
      price: s.price,
      subtotal: s.subtotal,
    })),
    ...invoice.parts.map((p) => ({
      name: p.name || "Suku Cadang",
      category: "PART",
      quantity: p.quantity,
      price: p.price,
      subtotal: p.subtotal,
    })),
  ];

  // Timeline events
  const timeline: TimelineEvent[] = [];
  
  timeline.push({
    date: invoice.createdAt,
    title: "Invoice Dibuat",
    description: `Invoice ${invoice.invoiceNumber} berhasil dibuat dari Work Order ${wo?.code ?? ""}`,
    isCompleted: true,
  });

  if (invoice.payment) {
    const isFullyPaid = invoice.payment.status === "PAID";
    const methodLabel = METHOD_LABELS[invoice.payment.method ?? ""] ?? invoice.payment.method ?? "Tunai";
    timeline.push({
      date: invoice.payment.paidAt ?? invoice.payment.createdAt ?? invoice.createdAt,
      title: isFullyPaid ? "Pembayaran Lunas" : "Pembayaran Sebagian",
      description: `Pembayaran sebesar ${formatRupiah(invoice.payment.amount)} diterima melalui ${methodLabel}`,
      amount: invoice.payment.amount,
      user: "Owner Bengkel",
      isCompleted: true,
    });
  } else if (invoice.paymentStatus === "UNPAID") {
    timeline.push({
      date: "",
      title: "Menunggu Pembayaran",
      description: "Tagihan belum dibayar oleh customer",
      isCompleted: false,
    });
  }

  const sortedTimeline = [...timeline].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <>
      {/* ── Print Styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-printable, #invoice-printable * { visibility: visible; }
          #invoice-printable { position: absolute; inset: 0; padding: 24px; width: 100%; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>

      <PageContainer>
        <div id="invoice-printable" className="space-y-8 py-2">
          
          {/* Print Header (only visible on print) */}
          <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-900">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-slate-900">INVOICE TAGIHAN</h1>
                <p className="text-lg font-bold font-mono text-slate-700 mt-1">{invoice.invoiceNumber}</p>
                <p className="text-xs text-slate-500 mt-0.5">Tanggal Invoice: {formatDate(invoice.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work Order</p>
                <p className="font-mono font-bold text-slate-800 text-sm">{wo?.code ?? "—"}</p>
                <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-300">
                  {invoice.paymentStatus === "PAID" ? "Lunas" : invoice.paymentStatus === "PARTIAL" ? "Belum Lunas" : "Belum Dibayar"}
                </div>
              </div>
            </div>
          </div>

          {/* ── Header (Screen Only) ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/60 pb-6 print:hidden">
            <div className="flex items-center gap-4">
              <Link
                href="/invoices"
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                title="Kembali ke Daftar Invoice"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                    {invoice.invoiceNumber}
                  </h1>
                  <PaymentStatusBadge status={invoice.paymentStatus} size="md" />
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1.5 flex-wrap font-medium">
                  <span>Dibuat {formatDate(invoice.createdAt)}</span>
                  <span>•</span>
                  {wo && (
                    <>
                      <span>Work Order</span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {wo.code}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
              
              {/* More Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl border border-slate-200 transition-colors flex items-center justify-center shadow-xs"
                  title="Tindakan Lainnya"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showMoreActions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreActions(false)} />
                    <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-scaleUp py-1">
                      <button
                        onClick={copyInvoiceLink}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 10v-5a1 1 0 011-1h2m-6 5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Salin Link Invoice
                      </button>
                      {wo?.customer?.phone && (
                        <button
                          onClick={contactCustomer}
                          className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Hubungi Pelanggan
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Main Layout: Two Columns ── */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* ── Left Column (approx 70%) ── */}
            <div className="w-full lg:w-[68%] space-y-8">
              
              {/* ── Metric Cards (Screen Only) ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                {/* Total */}
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan</p>
                  <p className="font-mono text-base font-extrabold text-slate-900 mt-1">{formatRupiah(invoice.grandTotal)}</p>
                </div>

                {/* Paid */}
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terbayar</p>
                    <p className="font-mono text-base font-extrabold text-emerald-600 mt-1">{formatRupiah(paid)}</p>
                  </div>
                  {/* Progress indicator for partial payments */}
                  {invoice.paymentStatus === "PARTIAL" && invoice.grandTotal > 0 && (
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-1">
                        <span>Progress</span>
                        <span>{Math.round((paid / invoice.grandTotal) * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(paid / invoice.grandTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Remaining */}
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sisa</p>
                  <p className="font-mono text-base font-extrabold text-rose-600 mt-1">{formatRupiah(remaining)}</p>
                </div>

                {/* Status */}
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <PaymentStatusBadge status={invoice.paymentStatus} size="sm" />
                  </div>
                </div>
              </div>

              {/* ── Merged Customer & Vehicle Information Card ── */}
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">Rincian Informasi</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Customer Section */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelanggan</h4>
                    {wo?.customer ? (
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{wo.customer.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{wo.customer.phone}</p>
                        {wo.customer.address && (
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{wo.customer.address}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-xs">—</p>
                    )}
                  </div>

                  {/* Vehicle Section */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kendaraan</h4>
                    {wo?.vehicle ? (
                      <div>
                        <p className="font-mono font-black text-slate-900 tracking-wider uppercase text-sm bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-200/60">
                          {wo.vehicle.plateNumber}
                        </p>
                        <p className="text-xs text-slate-700 font-bold mt-1.5">
                          {wo.vehicle.brand} {wo.vehicle.model}
                          {wo.vehicle.year ? ` (${wo.vehicle.year})` : ""}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{wo.vehicle.transmission}</p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-xs">—</p>
                    )}
                  </div>

                  {/* Mechanic Section */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mekanik</h4>
                    {wo?.mechanic ? (
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{wo.mechanic.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{wo.mechanic.phone}</p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-xs">Belum ditentukan</p>
                    )}
                  </div>
                </div>

                {/* Date & Payment Method dividers */}
                <div className="border-t border-slate-100 mt-6 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal Dibuat</span>
                    <span className="text-xs font-semibold text-slate-800 mt-1 block">
                      {formatDateTime(invoice.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Metode Pembayaran</span>
                    <span className="text-xs font-semibold text-slate-800 mt-1 block">
                      {invoice.payment?.method ? METHOD_LABELS[invoice.payment.method] : "Belum Ada Pembayaran"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Unified Invoice Items Table ── */}
              <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Daftar Item</h3>
                  <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                    {items.length} Item
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="py-3 px-6 text-left font-bold text-slate-500 text-[11px] uppercase tracking-wide">Item</th>
                        <th className="py-3 px-4 text-left font-bold text-slate-500 text-[11px] uppercase tracking-wide">Kategori</th>
                        <th className="py-3 px-4 text-center font-bold text-slate-500 text-[11px] uppercase tracking-wide">Qty</th>
                        <th className="py-3 px-4 text-right font-bold text-slate-500 text-[11px] uppercase tracking-wide">Harga Satuan</th>
                        <th className="py-3 px-6 text-right font-bold text-slate-500 text-[11px] uppercase tracking-wide">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-6">
                            <p className="font-semibold text-slate-900">{item.name}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            {item.category === "SERVICE" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200/80">
                                SERVICE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                PART
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">{item.quantity}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-500">{formatRupiah(item.price)}</td>
                          <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-900">{formatRupiah(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Financial Summary Block (Only visible on print to avoid screen duplication) ── */}
              <div className="hidden print:flex bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs justify-end">
                <div className="space-y-2.5 w-full md:w-64 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Subtotal Jasa</span>
                    <span className="font-mono text-slate-800">{formatRupiah(totalService)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Subtotal Suku Cadang</span>
                    <span className="font-mono text-slate-800">{formatRupiah(totalPart)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon</span>
                      <span className="font-mono">-{formatRupiah(invoice.discount)}</span>
                    </div>
                  )}
                  {invoice.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">PPN / Pajak</span>
                      <span className="font-mono text-slate-800">+{formatRupiah(invoice.tax)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2.5 mt-2.5 flex justify-between items-baseline font-bold">
                    <span className="text-slate-900">Grand Total</span>
                    <span className="font-mono text-slate-900 text-base">{formatRupiah(invoice.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* ── Payment History Timeline (Screen Only) ── */}
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs print:hidden">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Riwayat Aktivitas & Pembayaran</h3>
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 ml-2">
                  {sortedTimeline.map((evt, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[33px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                        evt.isCompleted ? "border-emerald-500 ring-4 ring-emerald-50" : "border-slate-300 bg-slate-100"
                      }`} />
                      
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {evt.date ? formatDateTime(evt.date) : "Mendatang"}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{evt.title}</h4>
                        <p className="text-xs text-slate-500">{evt.description}</p>
                        {evt.amount && (
                          <p className="text-xs font-mono font-bold text-emerald-600 mt-1">
                            Jumlah: {formatRupiah(evt.amount)}
                          </p>
                        )}
                        {evt.user && (
                          <p className="text-[9px] text-slate-400 font-medium">
                            Oleh: <span className="font-semibold text-slate-500">{evt.user}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── Right Column: Sticky Summary Panel (approx 30%) ── */}
            <div className="w-full lg:w-[32%] lg:sticky lg:top-6 space-y-6 print:hidden">
              
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ringkasan Tagihan</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Rincian akhir tagihan jasa & part</p>
                </div>

                <div className="space-y-3 text-xs border-y border-slate-100 py-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal Jasa</span>
                    <span className="font-mono font-semibold text-slate-800">{formatRupiah(totalService)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal Suku Cadang</span>
                    <span className="font-mono font-semibold text-slate-800">{formatRupiah(totalPart)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon</span>
                      <span className="font-mono font-bold">-{formatRupiah(invoice.discount)}</span>
                    </div>
                  )}
                  {invoice.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">PPN / Pajak</span>
                      <span className="font-mono font-semibold text-slate-800">+{formatRupiah(invoice.tax)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900">Total Akhir</span>
                    <span className="font-mono font-black text-slate-900 text-xl">{formatRupiah(invoice.grandTotal)}</span>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs border-b border-slate-100 pb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status Pembayaran</span>
                    <PaymentStatusBadge status={invoice.paymentStatus} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Metode</span>
                    <span className="font-semibold text-slate-800">
                      {invoice.payment?.method ? METHOD_LABELS[invoice.payment.method] : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dibuat Pada</span>
                    <span className="font-semibold text-slate-800">{formatDate(invoice.createdAt)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {/* Record Payment Button */}
                  {!isPaid && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      {invoice.payment ? "Update Pembayaran" : "Catat Pembayaran"}
                    </button>
                  )}

                  {/* Print & Download actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePrint}
                      className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PDF
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>{/* end #invoice-printable */}

        {/* Payment Modal */}
        {showPaymentModal && invoice && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            invoice={invoice}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </PageContainer>
    </>
  );
}
