"use client";

import React, { useState } from "react";
import { History, Search, RefreshCw, CheckCircle2, Clock, AlertTriangle, Filter, Eye } from "lucide-react";

interface LogEntry {
  id: string;
  recipientName: string;
  phoneNumber: string;
  category: string;
  status: "delivered" | "pending" | "failed";
  timestamp: string;
  messageSnippet: string;
}

export const NotificationHistoryTab: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "LOG-1001",
      recipientName: "Budi Santoso",
      phoneNumber: "+62 812-3456-7890",
      category: "Unit Ready (COMPLETED)",
      status: "delivered",
      timestamp: "Today, 10:24 AM",
      messageSnippet: "Halo Bpk Budi Santoso, Pengerjaan kendaraan B 1234 CD Anda telah SELESAI...",
    },
    {
      id: "LOG-1002",
      recipientName: "Siti Aminah",
      phoneNumber: "+62 813-9876-5432",
      category: "Invoice & Receipt",
      status: "delivered",
      timestamp: "Today, 09:45 AM",
      messageSnippet: "Halo Ibu Siti Aminah, Pembayaran invoice #INV-2026-0082 sebesar Rp 450.000...",
    },
    {
      id: "LOG-1003",
      recipientName: "Rudi Hermawan",
      phoneNumber: "+62 857-1122-3344",
      category: "Reminder Service",
      status: "pending",
      timestamp: "Today, 09:12 AM",
      messageSnippet: "Halo Bpk Rudi Hermawan, kendaraan B 9988 XYZ sudah mendekati jadwal ganti oli...",
    },
    {
      id: "LOG-1004",
      recipientName: "Agus Setiawan",
      phoneNumber: "+62 819-0011-2233",
      category: "Work Order Baru",
      status: "failed",
      timestamp: "Today, 08:30 AM",
      messageSnippet: "Work Order #WO-2026-0104 gagal terkirim (Nomor WA tidak aktif)...",
    },
    {
      id: "LOG-1005",
      recipientName: "Dewi Lestari",
      phoneNumber: "+62 812-7788-9900",
      category: "Unit Ready (COMPLETED)",
      status: "delivered",
      timestamp: "Yesterday, 04:15 PM",
      messageSnippet: "Halo Ibu Dewi, kendaraan D 4321 EF siap untuk diambil di bengkel...",
    },
  ]);

  const handleRetry = (id: string) => {
    setLogs((prev) =>
      prev.map((log) =>
        log.id === id ? { ...log, status: "delivered", timestamp: "Just now (Retried)" } : log
      )
    );
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      log.phoneNumber.includes(search);
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search & Filter Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama penerima atau nomor telp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {[
            { id: "all", label: "Semua" },
            { id: "delivered", label: "Berhasil" },
            { id: "pending", label: "Pending" },
            { id: "failed", label: "Gagal" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                statusFilter === st.id
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Penerima</th>
                <th className="py-3.5 px-4">Nomor WhatsApp</th>
                <th className="py-3.5 px-4">Kategori Pesan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Waktu Kirim</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {log.recipientName}
                  </td>
                  <td className="py-3.5 px-4 font-mono">{log.phoneNumber}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {log.status === "delivered" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                        Delivered
                      </span>
                    )}
                    {log.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Pending
                      </span>
                    )}
                    {log.status === "failed" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{log.timestamp}</td>
                  <td className="py-3.5 px-4 text-right">
                    {log.status === "failed" ? (
                      <button
                        onClick={() => handleRetry(log.id)}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1 ml-auto shadow-xs"
                      >
                        <RefreshCw className="w-3 h-3" /> Coba Lagi
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Selesai</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-normal">
                    Tidak ada riwayat pengiriman WhatsApp yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
