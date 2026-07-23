"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/common";
import { InvoiceService } from "@/services/invoice";
import { Invoice } from "@/types/invoice";
import { formatRupiah, formatDate } from "@/utils/format";
import { PaymentStatusBadge } from "@/features/invoices/components/PaymentStatusBadge";
import { useToast } from "@/components/common/Toast";

export default function InvoicesPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await InvoiceService.getInvoices({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 50,
        sort: "createdAt",
        order: "desc",
      });
      setInvoices(data);
    } catch (err: any) {
      showToast(err.message || "Gagal memuat daftar invoice", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  return (
    <PageContainer>
      <PageHeader
        title="Invoice & Pembayaran"
        subtitle="Kelola faktur tagihan dan rekam pembayaran pelanggan."
        badge="Transaksi"
      />

      {/* Unified Seamless Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor invoice..."
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-200 transition-all shadow-2xs"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="relative shrink-0" ref={statusDropdownRef}>
            <button
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs select-none cursor-pointer"
            >
              <span>
                Status:{" "}
                {statusFilter === "UNPAID"
                  ? "Belum Dibayar"
                  : statusFilter === "PARTIAL"
                  ? "Belum Lunas"
                  : statusFilter === "PAID"
                  ? "Lunas"
                  : "Semua Status"}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isStatusOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isStatusOpen && (
              <div className="absolute left-0 mt-2 w-44 bg-white border border-slate-200/80 rounded-xl shadow-lg z-30 py-1.5 animate-fadeIn">
                {[
                  { value: "", label: "Semua Status" },
                  { value: "UNPAID", label: "Belum Dibayar" },
                  { value: "PARTIAL", label: "Belum Lunas" },
                  { value: "PAID", label: "Lunas" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setIsStatusOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                      statusFilter === opt.value
                        ? "text-slate-900 bg-slate-50/50 font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {statusFilter === opt.value && (
                      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-400 font-semibold px-2 self-end md:self-auto shrink-0 select-none">
          Total: <strong className="text-slate-700 font-tabular font-bold">{invoices.length}</strong> Invoice
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.04)] overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="w-32 h-4 bg-slate-200 rounded" />
                <div className="w-24 h-3 bg-slate-100 rounded" />
              </div>
              <div className="w-24 h-4 bg-slate-200 rounded hidden md:block" />
              <div className="w-24 h-4 bg-slate-200 rounded hidden sm:block" />
              <div className="w-20 h-4 bg-slate-200 rounded" />
              <div className="w-16 h-6 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-600 font-semibold">Belum ada invoice</p>
          <p className="text-sm text-slate-400 mt-1">
            Invoice dibuat dari Work Order yang sudah selesai.
          </p>
          <Link
            href="/work-orders"
            className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 mx-auto cursor-pointer"
          >
            Lihat Work Orders
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.04)] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/80">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. Invoice</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Work Order</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Tanggal</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <span className="font-mono font-bold text-blue-600 hover:text-blue-800 text-sm">
                        {inv.invoiceNumber}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <p className="font-bold text-slate-900 text-sm">
                        {inv.workOrder?.customer?.name ?? "—"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {inv.workOrder?.customer?.phone ?? ""}
                      </p>
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <span className="font-mono text-xs text-slate-600 font-semibold">
                        {inv.workOrder?.code ?? "—"}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <span className="text-xs text-slate-500">{formatDate(inv.createdAt)}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {formatRupiah(inv.grandTotal)}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/invoices/${inv.id}`} className="block flex justify-center">
                      <PaymentStatusBadge status={inv.paymentStatus} size="sm" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
