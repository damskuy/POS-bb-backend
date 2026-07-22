"use client";

import React, { useEffect, useState } from "react";
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor invoice..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
        >
          <option value="">Semua Status</option>
          <option value="UNPAID">Belum Dibayar</option>
          <option value="PARTIAL">Belum Lunas</option>
          <option value="PAID">Lunas</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
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
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Lihat Work Orders
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide">No. Invoice</th>
                <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide">Customer</th>
                <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Work Order</th>
                <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Tanggal</th>
                <th className="py-3 px-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total</th>
                <th className="py-3 px-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <span className="font-mono font-bold text-blue-700 group-hover:text-blue-800">
                        {inv.invoiceNumber}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <p className="font-semibold text-slate-900 text-sm">
                        {inv.workOrder?.customer?.name ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {inv.workOrder?.customer?.phone ?? ""}
                      </p>
                    </Link>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <span className="font-mono text-xs text-slate-600 font-semibold">
                        {inv.workOrder?.code ?? "—"}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <span className="text-xs text-slate-500">{formatDate(inv.createdAt)}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(inv.grandTotal)}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-center">
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
