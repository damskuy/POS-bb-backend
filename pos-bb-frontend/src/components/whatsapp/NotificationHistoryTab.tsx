"use client";

import React, { useState, useMemo } from "react";
import {
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Eye,
  MoreVertical,
  RefreshCw,
  X,
  Copy,
  CheckCheck,
  ChevronDown,
  RotateCcw,
  Trash2,
  Check,
  Phone,
  Car,
  FileText,
  Zap,
  Info,
  ShieldAlert,
} from "lucide-react";

export interface NotificationLog {
  id: string;
  recipientName: string;
  phoneNumber: string;
  vehiclePlate: string;
  category:
    | "Service Reminder"
    | "Unit Ready"
    | "Invoice & Receipt"
    | "Work Order Update"
    | "Promotional Message";
  templateName: string;
  triggerSource: string;
  message: string;
  status: "delivered" | "pending" | "failed";
  relativeTime: string;
  exactTime: string;
  timeline: {
    created: string;
    queued: string;
    sentToProvider: string;
    delivered?: string;
    failed?: string;
  };
  errorMessage?: string;
  retryCount?: number;
}

export const NotificationHistoryTab: React.FC = () => {
  // Initial Sample Data according to design specification
  const initialLogs: NotificationLog[] = [
    {
      id: "MSG-20260728-102412",
      recipientName: "Budi Santoso",
      phoneNumber: "+62 812-3456-7890",
      vehiclePlate: "B 1234 ABC",
      category: "Service Reminder",
      templateName: "Reminder Servis Berkala",
      triggerSource: "Jadwal servis otomatis (30 Hari / 3.000 KM)",
      message:
        "Halo Budi, kendaraan B 1234 ABC sudah mendekati jadwal servis berkala. Yuk booking servis di POS Bengkel!",
      status: "delivered",
      relativeTime: "10 menit lalu",
      exactTime: "28 Jul 2026, 10:24",
      timeline: {
        created: "28 Jul 2026, 10:20",
        queued: "28 Jul 2026, 10:21",
        sentToProvider: "28 Jul 2026, 10:23",
        delivered: "28 Jul 2026, 10:24",
      },
    },
    {
      id: "MSG-20260728-094508",
      recipientName: "Siti Aminah",
      phoneNumber: "+62 813-9876-5432",
      vehiclePlate: "D 8876 KLM",
      category: "Invoice & Receipt",
      templateName: "Kirim Invoice & Bukti Pembayaran",
      triggerSource: "Transaksi Pelunasan Invoice #INV-2026-0352",
      message:
        "Terima kasih sudah melakukan servis di POS Bengkel. Berikut invoice #INV-2026-0352 dan rincian pembayaran Anda.",
      status: "delivered",
      relativeTime: "49 menit lalu",
      exactTime: "28 Jul 2026, 09:45",
      timeline: {
        created: "28 Jul 2026, 09:41",
        queued: "28 Jul 2026, 09:42",
        sentToProvider: "28 Jul 2026, 09:44",
        delivered: "28 Jul 2026, 09:45",
      },
    },
    {
      id: "MSG-20260728-091240",
      recipientName: "Rudi Hermawan",
      phoneNumber: "+62 857-1122-3344",
      vehiclePlate: "B 4521 RUD",
      category: "Unit Ready",
      templateName: "Pekerjaan Selesai (Unit Ready)",
      triggerSource: "Status Work Order → COMPLETED (#WO-2026-0148)",
      message:
        "Kendaraan Anda (B 4521 RUD) telah selesai dikerjakan dan siap untuk diambil.",
      status: "pending",
      relativeTime: "1 jam lalu",
      exactTime: "28 Jul 2026, 09:12",
      timeline: {
        created: "28 Jul 2026, 09:10",
        queued: "28 Jul 2026, 09:12",
        sentToProvider: "28 Jul 2026, 09:12",
      },
    },
    {
      id: "MSG-20260728-083015",
      recipientName: "Agus Setiawan",
      phoneNumber: "+62 819-0011-2233",
      vehiclePlate: "F 9012 AGS",
      category: "Work Order Update",
      templateName: "Work Order Baru Dibuat",
      triggerSource: "Work Order #WO-2026-0145 Dibuat",
      message:
        "Pengerjaan kendaraan Anda sedang berlangsung. Kami akan mengabari Anda setelah proses selesai.",
      status: "failed",
      relativeTime: "2 jam lalu",
      exactTime: "28 Jul 2026, 08:30",
      timeline: {
        created: "28 Jul 2026, 08:28",
        queued: "28 Jul 2026, 08:29",
        sentToProvider: "28 Jul 2026, 08:30",
        failed: "28 Jul 2026, 08:30",
      },
      errorMessage:
        "Nomor WhatsApp tidak dapat menerima pesan atau perangkat tujuan sedang tidak tersedia.",
      retryCount: 1,
    },
    {
      id: "MSG-20260727-161530",
      recipientName: "Dewi Lestari",
      phoneNumber: "+62 812-7788-9900",
      vehiclePlate: "B 7788 DEW",
      category: "Service Reminder",
      templateName: "Reminder Servis Berkala",
      triggerSource: "Jadwal servis otomatis",
      message:
        "Halo Dewi, saatnya melakukan tune up dan pemeriksaan berkala untuk kendaraan Anda.",
      status: "delivered",
      relativeTime: "Kemarin",
      exactTime: "27 Jul 2026, 16:15",
      timeline: {
        created: "27 Jul 2026, 16:10",
        queued: "27 Jul 2026, 16:11",
        sentToProvider: "27 Jul 2026, 16:14",
        delivered: "27 Jul 2026, 16:15",
      },
    },
    {
      id: "MSG-20260727-144005",
      recipientName: "Andi Pratama",
      phoneNumber: "+62 813-3210-9876",
      vehiclePlate: "B 3210 AND",
      category: "Invoice & Receipt",
      templateName: "Kirim Invoice & Bukti Pembayaran",
      triggerSource: "Transaksi Pelunasan Invoice #INV-2026-0340",
      message:
        "Pembayaran Anda telah berhasil diterima. Terima kasih telah menggunakan layanan kami di POS Bengkel.",
      status: "delivered",
      relativeTime: "Kemarin",
      exactTime: "27 Jul 2026, 14:40",
      timeline: {
        created: "27 Jul 2027, 14:35",
        queued: "27 Jul 2027, 14:36",
        sentToProvider: "27 Jul 2027, 14:39",
        delivered: "27 Jul 2027, 14:40",
      },
    },
  ];

  // Component State
  const [logs, setLogs] = useState<NotificationLog[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Hari ini");
  const [categoryFilter, setCategoryFilter] = useState("Semua kategori");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDrawerLog, setActiveDrawerLog] = useState<NotificationLog | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper Toast Feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter Computation
  const isFiltered =
    search.trim() !== "" ||
    dateFilter !== "Hari ini" ||
    categoryFilter !== "Semua kategori" ||
    statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setDateFilter("Hari ini");
    setCategoryFilter("Semua kategori");
    setStatusFilter("all");
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        log.recipientName.toLowerCase().includes(q) ||
        log.phoneNumber.includes(q) ||
        log.vehiclePlate.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q);

      const matchesCat =
        categoryFilter === "Semua kategori" || log.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" || log.status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [logs, search, categoryFilter, statusFilter]);

  // Selection Checkbox Logic
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredLogs.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Single Retry Action
  const handleRetrySingle = (id: string) => {
    setLogs((prev) =>
      prev.map((log) =>
        log.id === id
          ? {
              ...log,
              status: "delivered",
              relativeTime: "Baru saja",
              exactTime: "28 Jul 2026, 10:30",
              errorMessage: undefined,
              timeline: {
                ...log.timeline,
                delivered: "28 Jul 2026, 10:30",
              },
            }
          : log
      )
    );
    if (activeDrawerLog?.id === id) {
      setActiveDrawerLog((prev) =>
        prev
          ? {
              ...prev,
              status: "delivered",
              relativeTime: "Baru saja",
              exactTime: "28 Jul 2026, 10:30",
              errorMessage: undefined,
            }
          : null
      );
    }
    setActiveMenuId(null);
    showToast("✓ Notifikasi berhasil dikirim ulang!");
  };

  // Bulk Retry Action
  const handleBulkRetry = () => {
    const failedSelected = selectedIds.filter((id) =>
      logs.find((l) => l.id === id && l.status === "failed")
    );
    if (failedSelected.length === 0) return;

    setLogs((prev) =>
      prev.map((log) =>
        failedSelected.includes(log.id)
          ? {
              ...log,
              status: "delivered",
              relativeTime: "Baru saja",
              exactTime: "28 Jul 2026, 10:30",
              errorMessage: undefined,
            }
          : log
      )
    );
    setSelectedIds([]);
    showToast(`✓ ${failedSelected.length} notifikasi berhasil dikirim ulang!`);
  };

  // Bulk Delete Action
  const handleBulkDelete = () => {
    setLogs((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
    showToast(`✓ ${selectedIds.length} notifikasi dihapus dari riwayat.`);
    setSelectedIds([]);
  };

  // Get Initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Helper for Category Label styling
  const getCategoryBadgeClass = (category: NotificationLog["category"]) => {
    switch (category) {
      case "Service Reminder":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "Unit Ready":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "Invoice & Receipt":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "Work Order Update":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "Promotional Message":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/80";
    }
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status: NotificationLog["status"]) => {
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Delivered</span>
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Pending</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Failed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn font-sans text-slate-800">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-fadeIn">
          <span>{toastMessage}</span>
        </div>
      )}



      {/* ========================================================================= */}
      {/* SECTION 1 — COMPACT ACTIVITY SUMMARY (4 Dense Cards) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Terkirim */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Terkirim
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">
                156
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
              <Send className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-normal mt-2.5 pt-2 border-t border-slate-100">
            Seluruh notifikasi yang diproses hari ini.
          </p>
        </div>

        {/* 2. Berhasil Terkirim */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Berhasil Terkirim
              </span>
              <div className="text-xl font-extrabold text-emerald-700 font-sans tracking-tight">
                142
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-normal mt-2.5 pt-2 border-t border-slate-100">
            Pesan berhasil diterima oleh provider.
          </p>
        </div>

        {/* 3. Menunggu Diproses */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Menunggu Diproses
              </span>
              <div className="text-xl font-extrabold text-amber-700 font-sans tracking-tight">
                8
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-normal mt-2.5 pt-2 border-t border-slate-100">
            Sedang berada dalam antrean pengiriman.
          </p>
        </div>

        {/* 4. Gagal Terkirim */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Gagal Terkirim
              </span>
              <div className="text-xl font-extrabold text-rose-700 font-sans tracking-tight">
                6
              </div>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-normal mt-2.5 pt-2 border-t border-slate-100">
            Memerlukan pengecekan atau pengiriman ulang.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2 — HISTORY TOOLBAR (Search, Filters, Reset) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Search Input */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pelanggan, nomor WhatsApp, atau isi pesan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] bg-slate-50/50"
            />
          </div>

          {/* Right: Date Range Selector, Category Dropdown, Segmented Status Filter */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* 1. Date Range Dropdown */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#25D366] cursor-pointer shadow-2xs"
              >
                <option value="Hari ini">Hari ini</option>
                <option value="7 hari terakhir">7 hari terakhir</option>
                <option value="30 hari terakhir">30 hari terakhir</option>
                <option value="Pilih tanggal">Pilih tanggal</option>
              </select>
            </div>

            {/* 2. Notification Type Dropdown */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#25D366] cursor-pointer shadow-2xs"
              >
                <option value="Semua kategori">Semua kategori</option>
                <option value="Service Reminder">Service Reminder</option>
                <option value="Unit Ready">Unit Ready</option>
                <option value="Invoice & Receipt">Invoice & Receipt</option>
                <option value="Work Order Update">Work Order Update</option>
                <option value="Promotional Message">Promotional Message</option>
              </select>
            </div>

            {/* 3. Compact Segmented Status Filter */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
              {[
                { id: "all", label: "Semua" },
                { id: "delivered", label: "Berhasil" },
                { id: "pending", label: "Pending" },
                { id: "failed", label: "Gagal" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all select-none cursor-pointer ${
                    statusFilter === st.id
                      ? "bg-slate-900 text-white font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Reset Filter Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 6 — BULK ACTIONS BAR (Visible when rows selected) */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 pl-1 font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[11px]">
                {selectedIds.length}
              </span>
              <span>notifikasi dipilih</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkRetry}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Kirim Ulang</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedIds([]);
                  showToast("✓ Ditandai sudah dicek.");
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tandai Sudah Dicek</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3 — NOTIFICATION ACTIVITY LIST (Structured Table/List Hybrid) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredLogs.length > 0 &&
                      selectedIds.length === filteredLogs.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-[#25D366] focus:ring-[#25D366] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 min-w-[180px]">Penerima</th>
                <th className="py-3 px-4 min-w-[280px]">Notifikasi</th>
                <th className="py-3 px-4 min-w-[110px]">Status</th>
                <th className="py-3 px-4 min-w-[140px]">Waktu Kirim</th>
                <th className="py-3 px-4 text-right w-20">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.map((log) => {
                const isSelected = selectedIds.includes(log.id);
                const isFailed = log.status === "failed";

                return (
                  <tr
                    key={log.id}
                    className={`group transition-colors duration-150 ${
                      isFailed
                        ? "border-l-4 border-l-rose-500 bg-rose-50/20 hover:bg-rose-50/40"
                        : isSelected
                        ? "bg-emerald-50/40"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(log.id)}
                        className="rounded text-[#25D366] focus:ring-[#25D366] cursor-pointer"
                      />
                    </td>

                    {/* Column 1: Recipient Avatar + Name + Vehicle Plate */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 border ${
                            isFailed
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : log.status === "pending"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {getInitials(log.recipientName)}
                        </div>

                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 font-sans group-hover:text-[#128C7E] transition-colors">
                            {log.recipientName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono font-medium flex items-center gap-1">
                            <Car className="w-3 h-3 text-slate-400" />
                            <span>{log.vehiclePlate}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Notification Category Label + Message Preview */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-md">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeClass(
                            log.category
                          )}`}
                        >
                          {log.category}
                        </span>

                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                          {log.message}
                        </p>
                      </div>
                    </td>

                    {/* Column 3: Status Badge */}
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(log.status)}
                    </td>

                    {/* Column 4: Sent Time (Relative & Exact) */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="font-bold text-slate-800 text-xs font-sans">
                        {log.relativeTime}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {log.exactTime}
                      </div>
                    </td>

                    {/* Column 5: Action (Eye icon & More menu) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 relative">
                        {/* Eye Button: Open Detail Drawer */}
                        <button
                          type="button"
                          onClick={() => setActiveDrawerLog(log)}
                          title="Lihat Detail Notifikasi"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* More Menu Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(
                                activeMenuId === log.id ? null : log.id
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === log.id && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-30 font-sans text-xs animate-fadeIn text-left">
                                {isFailed && (
                                  <button
                                    type="button"
                                    onClick={() => handleRetrySingle(log.id)}
                                    className="w-full px-3.5 py-2 text-emerald-700 font-bold hover:bg-emerald-50 flex items-center gap-2"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Coba Kirim Ulang</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDrawerLog(log);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Info className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Lihat Detail Error</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(
                                      log.phoneNumber
                                    );
                                    setActiveMenuId(null);
                                    showToast(
                                      `✓ Nomor ${log.phoneNumber} tersalin!`
                                    );
                                  }}
                                  className="w-full px-3.5 py-2 text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Salin Nomor WA</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state for no search/filter results */}
              {filteredLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-slate-400 font-normal"
                  >
                    Tidak ada riwayat notifikasi WhatsApp yang sesuai dengan
                    pencarian/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 7 — PAGINATION */}
        {/* ========================================================================= */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Menampilkan{" "}
            <span className="font-bold text-slate-800">
              1–{filteredLogs.length}
            </span>{" "}
            dari <span className="font-bold text-slate-800">156</span>{" "}
            notifikasi
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed font-semibold"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-[#25D366] text-white font-bold shadow-xs cursor-pointer"
            >
              1
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              16
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4 — NOTIFICATION DETAIL DRAWER (Slide-over Right Drawer) */}
      {/* ========================================================================= */}
      {activeDrawerLog && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setActiveDrawerLog(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between z-10 animate-slideLeft">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Detail Notifikasi
                    </h3>
                    {renderStatusBadge(activeDrawerLog.status)}
                  </div>
                  <p className="text-xs font-mono text-slate-400">
                    ID: {activeDrawerLog.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveDrawerLog(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="p-5 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-xs">
                {/* 1. Recipient Information */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Informasi Penerima
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center border border-emerald-200">
                      {getInitials(activeDrawerLog.recipientName)}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-900">
                        {activeDrawerLog.recipientName}
                      </h4>
                      <div className="flex items-center gap-3 text-slate-600 font-medium">
                        <span className="font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {activeDrawerLog.phoneNumber}
                        </span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Car className="w-3 h-3 text-slate-400" />
                          {activeDrawerLog.vehiclePlate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Notification Metadata */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Aturan & Template Notifikasi
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">
                        Kategori:
                      </span>
                      <span className="font-bold text-slate-800">
                        {activeDrawerLog.category}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">
                        Template:
                      </span>
                      <span className="font-bold text-slate-800">
                        {activeDrawerLog.templateName}
                      </span>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-slate-100">
                      <span className="text-slate-400 text-[11px] block">
                        Dipicu Oleh:
                      </span>
                      <span className="font-semibold text-slate-700">
                        {activeDrawerLog.triggerSource}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. WhatsApp Message Preview Card */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pratinjau Pesan WhatsApp
                  </span>

                  <div className="rounded-xl border border-slate-300 p-3 bg-[#E5DDD5] space-y-2">
                    <div className="max-w-[95%] bg-white rounded-lg p-3 shadow-xs text-xs text-slate-800 font-sans leading-relaxed space-y-2 ml-auto border-l-4 border-[#25D366]">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {activeDrawerLog.message}
                      </p>

                      <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                        <span>{activeDrawerLog.exactTime.split(", ")[1]}</span>
                        <CheckCheck
                          className={`w-3.5 h-3.5 ${
                            activeDrawerLog.status === "delivered"
                              ? "text-[#34B7F1]"
                              : "text-slate-400"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Delivery Timeline */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Timeline Pengiriman
                  </span>

                  <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {/* Event 1: Created */}
                    <div className="relative flex items-start gap-2 text-xs">
                      <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                      <div>
                        <div className="font-bold text-slate-800">
                          Pesan Dibuat oleh Sistem
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {activeDrawerLog.timeline.created}
                        </div>
                      </div>
                    </div>

                    {/* Event 2: Queued */}
                    <div className="relative flex items-start gap-2 text-xs">
                      <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                      <div>
                        <div className="font-bold text-slate-800">
                          Masuk Antrean WhatsApp Gateway
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {activeDrawerLog.timeline.queued}
                        </div>
                      </div>
                    </div>

                    {/* Event 3: Sent to Provider */}
                    <div className="relative flex items-start gap-2 text-xs">
                      <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                      <div>
                        <div className="font-bold text-slate-800">
                          Dikirim ke Provider WhatsApp
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {activeDrawerLog.timeline.sentToProvider}
                        </div>
                      </div>
                    </div>

                    {/* Event 4: Delivered or Failed */}
                    {activeDrawerLog.status === "delivered" && (
                      <div className="relative flex items-start gap-2 text-xs">
                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                        <div>
                          <div className="font-bold text-emerald-700">
                            Diterima oleh Pelanggan (Delivered)
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {activeDrawerLog.timeline.delivered}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDrawerLog.status === "failed" && (
                      <div className="relative flex items-start gap-2 text-xs">
                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-white" />
                        <div>
                          <div className="font-bold text-rose-700">
                            Pengiriman Gagal
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {activeDrawerLog.timeline.failed ||
                              activeDrawerLog.exactTime}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. SECTION 5 — FAILED ERROR UX BOX & ACTIONS */}
                {activeDrawerLog.status === "failed" && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 space-y-3 animate-fadeIn">
                    <div className="flex items-start gap-2.5 text-rose-900">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs">Pengiriman Gagal</h5>
                        <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                          {activeDrawerLog.errorMessage}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-rose-200/60 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRetrySingle(activeDrawerLog.id)}
                        className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Kirim Ulang</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          showToast(
                            `Detail Error: ${activeDrawerLog.errorMessage}`
                          )
                        }
                        className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-800 hover:bg-rose-100 font-semibold text-xs transition-colors"
                      >
                        Lihat Detail Error
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(activeDrawerLog.phoneNumber);
                    showToast(
                      `✓ Nomor ${activeDrawerLog.phoneNumber} tersalin!`
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Nomor WA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDrawerLog(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
