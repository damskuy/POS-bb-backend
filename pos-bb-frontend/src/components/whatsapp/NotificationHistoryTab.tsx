"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  RotateCcw,
  Trash2,
  Check,
  Car,
  Info,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  NotificationHistoryLog,
  NotificationStats,
  NotificationStatus,
} from "@/types/notificationHistory";
import { NotificationHistoryService } from "@/services/notificationHistory.service";

const CATEGORY_LABEL_MAP: Record<string, string> = {
  TEST: "Pesan Uji Coba",
  SERVICE_REMINDER: "Service Reminder",
  WORK_ORDER_CREATED: "Work Order Baru",
  WORK_ORDER_UPDATED: "Work Order Update",
  WORK_ORDER_COMPLETED: "Work Order Selesai",
  VEHICLE_READY: "Unit Ready",
  INVOICE_CREATED: "Invoice",
  INVOICE: "Invoice",
  PAYMENT_RECEIVED: "Pembayaran",
  PAYMENT: "Pembayaran",
  CUSTOM: "Promosi",
};

export const NotificationHistoryTab: React.FC = () => {
  // Data States
  const [logs, setLogs] = useState<NotificationHistoryLog[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    totalToday: 0,
    sentToday: 0,
    pending: 0,
    failed: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("Semua kategori");
  const [dateFilter, setDateFilter] = useState("all");

  // Selection & Active Log
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDrawerLog, setActiveDrawerLog] =
    useState<NotificationHistoryLog | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  // Helper Toast Feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch History & Stats
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let startDateStr: string | undefined = undefined;
      const now = new Date();
      if (dateFilter === "today") {
        startDateStr = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      } else if (dateFilter === "7days") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        startDateStr = d.toISOString();
      } else if (dateFilter === "30days") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        startDateStr = d.toISOString();
      }

      const [historyRes, statsRes] = await Promise.all([
        NotificationHistoryService.getHistory({
          page,
          limit,
          search: search.trim() || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          category:
            categoryFilter !== "Semua kategori" ? categoryFilter : undefined,
          startDate: startDateStr,
        }),
        NotificationHistoryService.getStats(),
      ]);

      setLogs(historyRes.data || []);
      if (historyRes.pagination) {
        setTotalPages(historyRes.pagination.totalPages);
        setTotalRecords(historyRes.pagination.total);
      }
      setStats(statsRes);
    } catch (err: any) {
      console.error("Failed to load notification history:", err);
      setErrorMsg(
        err.message || "Gagal memuat data riwayat notifikasi dari server."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter, categoryFilter, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Search Input Debounce / Submit
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Reset Filters
  const isFiltered =
    search.trim() !== "" ||
    dateFilter !== "all" ||
    categoryFilter !== "Semua kategori" ||
    statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setDateFilter("all");
    setCategoryFilter("Semua kategori");
    setStatusFilter("all");
    setPage(1);
  };

  // Single Retry Action
  const handleRetrySingle = async (id: string) => {
    setIsRetrying(id);
    setActiveMenuId(null);
    try {
      const updated = await NotificationHistoryService.retryNotification(id);

      setLogs((prev) => prev.map((log) => (log.id === id ? updated : log)));
      if (activeDrawerLog?.id === id) {
        setActiveDrawerLog(updated);
      }

      showToast(
        updated.status === "SENT" || updated.status === "DELIVERED"
          ? "✓ Notifikasi berhasil dikirim ulang!"
          : "⚠️ Percobaan kirim ulang gagal: " + (updated.errorMessage || "")
      );

      // Refresh Stats
      const newStats = await NotificationHistoryService.getStats();
      setStats(newStats);
    } catch (err: any) {
      console.error("Failed to retry notification:", err);
      showToast("❌ " + (err.message || "Gagal mengirim ulang notifikasi."));
    } finally {
      setIsRetrying(null);
    }
  };

  // Selection Checkbox Logic
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(logs.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Format Helper Date
  const formatExactTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get Initials for Avatar
  const getInitials = (name?: string | null) => {
    if (!name || !name.trim()) return "WA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Helper for Category Label styling
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "SERVICE_REMINDER":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "WORK_ORDER_COMPLETED":
      case "VEHICLE_READY":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "INVOICE":
      case "INVOICE_CREATED":
      case "PAYMENT":
      case "PAYMENT_RECEIVED":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "WORK_ORDER_CREATED":
      case "WORK_ORDER_UPDATED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "TEST":
        return "bg-cyan-50 text-cyan-700 border-cyan-200/80";
      case "CUSTOM":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/80";
    }
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case "SENT":
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Berhasil</span>
          </span>
        );
      case "PENDING":
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{status === "PROCESSING" ? "Diproses" : "Pending"}</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Gagal</span>
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
      {/* SECTION 1 — COMPACT ACTIVITY SUMMARY (4 Dense Cards Real Data) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Terkirim Hari Ini */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Hari Ini
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">
                {stats.totalToday}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
              <Send className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-normal mt-2.5 pt-2 border-t border-slate-100">
            Seluruh notifikasi diproses hari ini.
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
                {stats.sentToday}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-normal mt-2.5 pt-2 border-t border-slate-100">
            Pesan berhasil terkirim via provider.
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
                {stats.pending}
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
                {stats.failed}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-normal mt-2.5 pt-2 border-t border-slate-100">
            Memerlukan pengiriman ulang (retry).
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
              placeholder="Cari nama penerima, nomor WhatsApp, atau isi pesan..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] bg-slate-50/50"
            />
          </div>

          {/* Right: Date Filter, Category Dropdown, Segmented Status Filter */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* 1. Date Range Dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#25D366] cursor-pointer shadow-2xs"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari ini</option>
              <option value="7days">7 hari terakhir</option>
              <option value="30days">30 hari terakhir</option>
            </select>

            {/* 2. Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#25D366] cursor-pointer shadow-2xs"
            >
              <option value="Semua kategori">Semua kategori</option>
              <option value="TEST">Pesan Uji Coba</option>
              <option value="SERVICE_REMINDER">Service Reminder</option>
              <option value="WORK_ORDER_CREATED">Work Order Baru</option>
              <option value="WORK_ORDER_COMPLETED">Work Order Selesai</option>
              <option value="VEHICLE_READY">Unit Ready</option>
              <option value="INVOICE_CREATED">Invoice</option>
              <option value="PAYMENT_RECEIVED">Pembayaran</option>
              <option value="CUSTOM">Promosi</option>
            </select>

            {/* 3. Compact Segmented Status Filter */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
              {[
                { id: "all", label: "Semua" },
                { id: "SENT", label: "Berhasil" },
                { id: "PENDING", label: "Pending" },
                { id: "FAILED", label: "Gagal" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st.id);
                    setPage(1);
                  }}
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
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3 — NOTIFICATION ACTIVITY TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* LOADING STATE */}
        {isLoading && (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-12 bg-slate-100 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!isLoading && errorMsg && (
          <div className="p-8 text-center space-y-3 bg-rose-50/50">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <div>
              <h4 className="text-xs font-bold text-rose-900">{errorMsg}</h4>
              <p className="text-[11px] text-rose-600 mt-1">
                Pastikan koneksi backend terhubung dengan benar.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchData}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* TABLE CONTENT */}
        {!isLoading && !errorMsg && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={
                          logs.length > 0 && selectedIds.length === logs.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded text-[#25D366] focus:ring-[#25D366] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 min-w-[180px]">Penerima</th>
                    <th className="py-3 px-4 min-w-[280px]">Pesan WhatsApp</th>
                    <th className="py-3 px-4 min-w-[110px]">Status</th>
                    <th className="py-3 px-4 min-w-[140px]">Waktu Kirim</th>
                    <th className="py-3 px-4 text-right w-20">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {logs.map((log) => {
                    const isSelected = selectedIds.includes(log.id);
                    const isFailed = log.status === "FAILED";
                    const displayCategory =
                      CATEGORY_LABEL_MAP[log.category] || log.category;

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

                        {/* Column 1: Recipient Avatar + Name + Phone */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 border ${
                                isFailed
                                  ? "bg-rose-100 text-rose-800 border-rose-200"
                                  : log.status === "PENDING" ||
                                    log.status === "PROCESSING"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {getInitials(log.recipientName)}
                            </div>

                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 font-sans group-hover:text-[#128C7E] transition-colors">
                                {log.recipientName || "Penerima WA"}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono font-medium">
                                {log.recipientPhone}
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
                              {displayCategory}
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

                        {/* Column 4: Sent Time */}
                        <td className="py-3.5 px-4 space-y-0.5">
                          <div className="font-bold text-slate-800 text-xs font-sans">
                            {formatExactTime(log.sentAt || log.createdAt)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {log.provider ? `via ${log.provider}` : "Fonnte"}
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
                                        disabled={isRetrying === log.id}
                                        onClick={() =>
                                          handleRetrySingle(log.id)
                                        }
                                        className="w-full px-3.5 py-2 text-emerald-700 font-bold hover:bg-emerald-50 flex items-center gap-2 disabled:opacity-50"
                                      >
                                        <RefreshCw
                                          className={`w-3.5 h-3.5 text-emerald-600 ${
                                            isRetrying === log.id
                                              ? "animate-spin"
                                              : ""
                                          }`}
                                        />
                                        <span>
                                          {isRetrying === log.id
                                            ? "Mengirim..."
                                            : "Coba Kirim Ulang"}
                                        </span>
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
                                      <span>Lihat Detail Log</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard?.writeText(
                                          log.recipientPhone
                                        );
                                        setActiveMenuId(null);
                                        showToast(
                                          `✓ Nomor ${log.recipientPhone} tersalin!`
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
                </tbody>
              </table>
            </div>

            {/* EMPTY STATE */}
            {logs.length === 0 && (
              <div className="p-12 text-center text-slate-500 space-y-3 font-sans border-t border-slate-100">
                <Send className="w-8 h-8 text-slate-300 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Belum Ada Riwayat Notifikasi
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Seluruh percobaan pengiriman pesan WhatsApp akan tercatat di
                    sini secara real-time.
                  </p>
                </div>
              </div>
            )}

            {/* PAGINATION FOOTER */}
            {logs.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-sans">
                <div>
                  Menampilkan <span className="font-bold">{logs.length}</span>{" "}
                  dari <span className="font-bold">{totalRecords}</span> log
                  notifikasi
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-bold text-slate-700 px-2">
                    Halaman {page} dari {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DRAWER / MODAL DETAIL LOG NOTIFIKASI */}
      {/* ========================================================================= */}
      {activeDrawerLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
            onClick={() => setActiveDrawerLog(null)}
          />

          <div className="relative bg-white w-full max-w-md h-full shadow-2xl z-10 flex flex-col font-sans animate-slideInRight">
            {/* Header Drawer */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#128C7E] flex items-center justify-center border border-emerald-200 font-extrabold text-xs">
                  WA
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">
                    Detail Riwayat Notifikasi
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {activeDrawerLog.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawerLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Status Banner */}
              <div className="p-3.5 rounded-xl border flex items-center justify-between bg-slate-50/80 border-slate-200">
                <span className="font-bold text-slate-700">Status Pengiriman</span>
                {renderStatusBadge(activeDrawerLog.status)}
              </div>

              {/* Error Message callout if failed */}
              {activeDrawerLog.status === "FAILED" && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Pesan Gagal Terkirim</span>
                  </div>
                  <p className="text-[11px] text-rose-700 font-mono leading-relaxed">
                    {activeDrawerLog.errorMessage ||
                      "Fonnte Provider mengembalikan status error."}
                  </p>
                  <button
                    type="button"
                    disabled={isRetrying === activeDrawerLog.id}
                    onClick={() => handleRetrySingle(activeDrawerLog.id)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isRetrying === activeDrawerLog.id ? "animate-spin" : ""
                      }`}
                    />
                    <span>
                      {isRetrying === activeDrawerLog.id
                        ? "Mengirim Ulang..."
                        : "Coba Kirim Ulang Sekarang"}
                    </span>
                  </button>
                </div>
              )}

              {/* Recipient Details */}
              <div className="space-y-2 p-4 rounded-xl border border-slate-200/80 bg-white">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Informasi Penerima
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Nama Penerima:
                    </span>
                    <span className="font-bold text-slate-800">
                      {activeDrawerLog.recipientName || "Pelanggan POS"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Nomor WhatsApp:
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {activeDrawerLog.recipientPhone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Kategori Pesan:
                    </span>
                    <span className="font-bold text-emerald-700">
                      {CATEGORY_LABEL_MAP[activeDrawerLog.category] ||
                        activeDrawerLog.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Provider WhatsApp:
                    </span>
                    <span className="font-bold text-slate-800 uppercase">
                      {activeDrawerLog.provider || "Fonnte"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Jumlah Retry:
                    </span>
                    <span className="font-bold text-slate-800">
                      {activeDrawerLog.retryCount} kali
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Waktu Dibuat:
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatExactTime(activeDrawerLog.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Message Preview */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Isi Pesan WhatsApp Terkirim
                </h4>

                <div className="rounded-2xl border border-slate-300 overflow-hidden bg-[#E5DDD5] shadow-xs">
                  <div className="bg-[#075E54] text-white px-3.5 py-2 flex items-center gap-2 text-xs font-bold">
                    <span>POS Bengkel Baik</span>
                  </div>

                  <div className="p-3 bg-[radial-[#00000008]_1px,transparent_1px] [background-size:12px_12px]">
                    <div className="bg-white rounded-lg p-3 text-xs shadow-xs text-slate-800 font-sans leading-relaxed space-y-1.5 border-l-4 border-[#25D366]">
                      <p className="whitespace-pre-wrap text-[11px]">
                        {activeDrawerLog.message}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 pt-1">
                        <span>
                          {formatExactTime(
                            activeDrawerLog.sentAt || activeDrawerLog.createdAt
                          )}
                        </span>
                        <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
