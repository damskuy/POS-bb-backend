"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/common";
import { InvoiceService } from "@/services/invoice";
import { Invoice } from "@/types/invoice";
import { formatRupiah, formatDate, formatDateTime } from "@/utils/format";
import { PaymentStatusBadge } from "@/features/invoices/components/PaymentStatusBadge";
import { InvoiceSummaryCard } from "@/features/invoices/components/InvoiceSummaryCard";
import { PaymentModal } from "@/features/invoices/components/PaymentModal";
import { useToast } from "@/components/common/Toast";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  TRANSFER: "Transfer Bank",
  EWALLET: "E-Wallet",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  // ── Loading skeleton ──
  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
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
          <Link href="/invoices" className="mt-4 inline-block text-blue-600 text-sm font-semibold hover:underline">
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

  return (
    <>
      {/* ── Print Styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-printable, #invoice-printable * { visibility: visible; }
          #invoice-printable { position: absolute; inset: 0; padding: 24px; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>

      <PageContainer>
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                  {invoice.invoiceNumber}
                </h1>
                <PaymentStatusBadge status={invoice.paymentStatus} size="md" />
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Dibuat {formatDate(invoice.createdAt)}
                {wo && <> · Work Order <span className="font-mono font-semibold text-slate-700">{wo.code}</span></>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tambah / Update Pembayaran */}
            {!isPaid && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {invoice.payment ? "Update Pembayaran" : "Tambah Pembayaran"}
              </button>
            )}
            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
          </div>
        </div>

        {/* ── Printable Area ── */}
        <div id="invoice-printable">

          {/* Print Header (only visible on print) */}
          <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900">
            <h1 className="text-2xl font-black text-slate-900">INVOICE</h1>
            <div className="flex justify-between mt-2">
              <div>
                <p className="text-lg font-bold font-mono">{invoice.invoiceNumber}</p>
                <p className="text-sm text-slate-500">Tanggal: {formatDate(invoice.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-500">Work Order</p>
                <p className="font-mono font-bold">{wo?.code ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Summary Card (hidden on print) */}
          <InvoiceSummaryCard invoice={invoice} />

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Customer</p>
              {wo?.customer ? (
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">{wo.customer.name}</p>
                  <p className="text-sm text-slate-500 font-mono">{wo.customer.phone}</p>
                  {wo.customer.address && (
                    <p className="text-xs text-slate-400">{wo.customer.address}</p>
                  )}
                </div>
              ) : <p className="text-slate-400 italic text-sm">—</p>}
            </div>

            {/* Kendaraan */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Kendaraan</p>
              {wo?.vehicle ? (
                <div className="space-y-1">
                  <p className="font-mono font-black text-slate-900 text-xl tracking-wider uppercase">
                    {wo.vehicle.plateNumber}
                  </p>
                  <p className="text-sm text-slate-700 font-medium">
                    {wo.vehicle.brand} {wo.vehicle.model}
                    {wo.vehicle.year ? ` (${wo.vehicle.year})` : ""}
                  </p>
                  <p className="text-xs text-slate-400">{wo.vehicle.transmission}</p>
                </div>
              ) : <p className="text-slate-400 italic text-sm">—</p>}
            </div>

            {/* Mekanik */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Mekanik</p>
              {wo?.mechanic ? (
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">{wo.mechanic.name}</p>
                  <p className="text-sm text-slate-500 font-mono">{wo.mechanic.phone}</p>
                </div>
              ) : <p className="text-slate-400 italic text-sm">Belum ditentukan</p>}
            </div>
          </div>

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
                <span className="font-mono text-xs font-bold text-blue-600">{formatRupiah(totalService)}</span>
              </div>
              {invoice.services.length === 0 ? (
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
                    {invoice.services.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{item.name || "—"}</p>
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

            {/* Parts */}
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
                <span className="font-mono text-xs font-bold text-orange-600">{formatRupiah(totalPart)}</span>
              </div>
              {invoice.parts.length === 0 ? (
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
                    {invoice.parts.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{item.name || "—"}</p>
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

          {/* Financial Summary */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Rincian Tagihan</h3>
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal Jasa</span>
                <span className="font-mono font-semibold text-blue-700">{formatRupiah(totalService)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal Suku Cadang</span>
                <span className="font-mono font-semibold text-orange-700">{formatRupiah(totalPart)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Diskon</span>
                  <span className="font-mono font-semibold text-rose-600">-{formatRupiah(invoice.discount)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">PPN / Pajak</span>
                  <span className="font-mono font-semibold text-slate-600">+{formatRupiah(invoice.tax)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="font-mono font-black text-slate-900 text-lg">{formatRupiah(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Pembayaran</h3>
              </div>
              <PaymentStatusBadge status={invoice.paymentStatus} size="sm" />
            </div>

            {invoice.payment ? (
              <div className="p-5">
                {/* Single payment record */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Metode</p>
                      <p className="text-sm font-bold text-slate-900">
                        {METHOD_LABELS[invoice.payment.method ?? ""] ?? invoice.payment.method ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Nominal</p>
                      <p className="font-mono text-sm font-bold text-emerald-700">{formatRupiah(invoice.payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Sisa</p>
                      <p className="font-mono text-sm font-bold text-rose-600">
                        {formatRupiah(Math.max(0, invoice.grandTotal - invoice.payment.amount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Tanggal</p>
                      <p className="text-xs text-slate-600">{formatDateTime(invoice.payment.paidAt ?? invoice.payment.createdAt)}</p>
                    </div>
                  </div>

                  {!isPaid && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors shrink-0 print:hidden"
                    >
                      Update
                    </button>
                  )}
                </div>

                {invoice.payment.referenceNumber && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">No. Referensi</p>
                    <p className="font-mono text-xs text-slate-700">{invoice.payment.referenceNumber}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center gap-3 text-center print:hidden">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-600">Belum ada pembayaran</p>
                <p className="text-xs text-slate-400">Klik tombol di bawah untuk menambah pembayaran.</p>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Pembayaran
                </button>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-xs text-slate-400 font-medium space-y-0.5 print:hidden">
            <p>Dibuat: <span className="text-slate-600 font-semibold">{formatDateTime(invoice.createdAt)}</span></p>
            <p>Diperbarui: <span className="text-slate-600 font-semibold">{formatDateTime(invoice.updatedAt)}</span></p>
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
