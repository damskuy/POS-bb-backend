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
  Info,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Database,
  Filter,
} from "lucide-react";
import { CustomSelect } from "../common/CustomSelect";
import { useToast } from "@/components/common/Toast";
import {
  NotificationHistoryLog,
  NotificationStats,
  NotificationStatus,
} from "@/types/notificationHistory";
import { NotificationHistoryService } from "@/services/notificationHistory.service";
import { WorkOrderService } from "@/services/workorder.service";

// ─────────────────────────────────────────────
// CONSTANTS & MAPS
// ─────────────────────────────────────────────

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

const TRIGGER_LABEL_MAP: Record<string, string> = {
  WORK_ORDER_CREATED: "WO Dibuat",
  WORK_ORDER_IN_PROGRESS: "Pengerjaan Dimulai",
  WORK_ORDER_COMPLETED: "Pekerjaan Selesai",
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export const NotificationHistoryTab: React.FC = () => {
  const { showToast } = useToast();

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
  const [sumberFilter, setSumberFilter] = useState("all"); // 'all' | 'automation' | 'reminder' | 'manual'

  // Selection & Drawer Details
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDrawerLog, setActiveDrawerLog] = useState<NotificationHistoryLog | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  // Dynamically loaded Work Order Details
  const [activeWorkOrder, setActiveWorkOrder] = useState<any | null>(null);
  const [isLoadingWorkOrder, setIsLoadingWorkOrder] = useState(false);

  // ─────────────────────────────────────────────
  // FETCH LOGS
  // ─────────────────────────────────────────────

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
          category: categoryFilter !== "Semua kategori" ? categoryFilter : undefined,
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
      setErrorMsg(err.message || "Gagal memuat data riwayat notifikasi dari server.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter, categoryFilter, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch Work Order on drawer open
  useEffect(() => {
    if (activeDrawerLog && activeDrawerLog.workOrderId) {
      setIsLoadingWorkOrder(true);
      setActiveWorkOrder(null);
      WorkOrderService.getWorkOrderById(activeDrawerLog.workOrderId)
        .then((res) => {
          setActiveWorkOrder(res);
        })
        .catch((err) => {
          console.error("Failed to load work order:", err);
        })
        .finally(() => {
          setIsLoadingWorkOrder(false);
        });
    } else {
      setActiveWorkOrder(null);
      setIsLoadingWorkOrder(false);
    }
  }, [activeDrawerLog]);

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  const getNotificationSource = (log: NotificationHistoryLog) => {
    if (log.automationId || log.trigger) return "Automation";
    if (log.category === "SERVICE_REMINDER") return "Reminder";
    return "Manual/Test";
  };

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case "Automation":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
      case "Reminder":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/80";
    }
  };

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

  const renderStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case "SIMULATED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
            <span>Simulasi</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>Pending</span>
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Loader2 className="w-3 h-3 text-indigo-600 shrink-0 animate-spin" />
            <span>Diproses</span>
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Terkirim</span>
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/80">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Diterima</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Gagal</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200/80">
            <span>{status}</span>
          </span>
        );
    }
  };

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

  const getInitials = (name?: string | null) => {
    if (!name || !name.trim()) return "WA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

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
      const newStats = await NotificationHistoryService.getStats();
      setStats(newStats);
    } catch (err: any) {
      console.error("Failed to retry notification:", err);
      showToast("❌ " + (err.message || "Gagal mengirim ulang notifikasi."));
    } finally {
      setIsRetrying(null);
    }
  };

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

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("Semua kategori");
    setDateFilter("all");
    setSumberFilter("all");
    setPage(1);
  };

  // ─────────────────────────────────────────────
  // CLIENT FILTERING (sumberFilter)
  // ─────────────────────────────────────────────

  const filteredLogs = logs.filter((log) => {
    if (sumberFilter === "all") return true;
    const isAutomation = !!(log.automationId || log.trigger);
    const isReminder = log.category === "SERVICE_REMINDER";
    if (sumberFilter === "automation") return isAutomation;
    if (sumberFilter === "reminder") return isReminder;
    if (sumberFilter === "manual") return !isAutomation && !isReminder;
    return true;
  });

  const isAnyFilterActive =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "Semua kategori" ||
    dateFilter !== "all" ||
    sumberFilter !== "all";

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="space-y-4 font-sans text-slate-800 animate-fadeIn">
      {/* SECTION 1 — ACTIVITY SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Today */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Hari Ini
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-900">{stats.totalToday}</span>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 shrink-0">
              <Send className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Berhasil */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Berhasil Terkirim
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-emerald-600">{stats.sentToday}</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-500 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Antrean Pending
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-600">{stats.pending}</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Gagal */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Gagal Terkirim
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-rose-600">{stats.failed}</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-500 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — HISTORY TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari penerima, nomor, isi pesan..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] bg-slate-50/50"
            />
          </div>

          {/* Filters & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sumber Filter */}
            <CustomSelect
              value={sumberFilter}
              onChange={(val) => {
                setSumberFilter(val);
                setPage(1);
              }}
              options={[
                { value: "all", label: "Semua Sumber" },
                { value: "automation", label: "Automation" },
                { value: "reminder", label: "Reminder" },
                { value: "manual", label: "Manual/Test" },
              ]}
              buttonClassName="py-2 text-xs"
            />

            {/* Status Filter */}
            <CustomSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[
                { value: "all", label: "Semua Status" },
                { value: "SIMULATED", label: "Simulasi" },
                { value: "PENDING", label: "Pending" },
                { value: "PROCESSING", label: "Diproses" },
                { value: "SENT", label: "Terkirim" },
                { value: "DELIVERED", label: "Diterima" },
                { value: "FAILED", label: "Gagal" },
              ]}
              buttonClassName="py-2 text-xs"
            />

            {/* Date Range Dropdown */}
            <CustomSelect
              value={dateFilter}
              onChange={(val) => {
                setDateFilter(val);
                setPage(1);
              }}
              options={[
                { value: "all", label: "Semua Waktu" },
                { value: "today", label: "Hari ini" },
                { value: "7days", label: "7 hari terakhir" },
                { value: "30days", label: "30 hari terakhir" },
              ]}
              buttonClassName="py-2 text-xs"
            />

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchData}
              title="Refresh Data"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Active Filter Clear Helper */}
        {isAnyFilterActive && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 italic">
              Filter aktif diterapkan. Beberapa hasil mungkin tersembunyi.
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-[#25D366] hover:text-emerald-700 transition-colors"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* SECTION 3 — TABLE CONTENT */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="divide-y divide-slate-100">
            <div className="bg-slate-50/80 h-10 animate-pulse" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 space-y-3 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded w-16" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMsg && (
          <div className="p-10 text-center space-y-3">
            <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Gagal Memuat Riwayat Notifikasi</h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                {errorMsg}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchData}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && !errorMsg && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80 select-none">
                  <tr>
                    <th className="py-3 px-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredLogs.length > 0 && selectedIds.length === filteredLogs.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded text-[#25D366] focus:ring-[#25D366] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 min-w-[160px]">Penerima</th>
                    <th className="py-3 px-4 min-w-[280px]">Pesan WhatsApp</th>
                    <th className="py-3 px-4 min-w-[110px]">Status</th>
                    <th className="py-3 px-4 min-w-[130px]">Waktu Kirim</th>
                    <th className="py-3 px-4 text-right w-16">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredLogs.map((log) => {
                    const isSelected = selectedIds.includes(log.id);
                    const isFailed = log.status === "FAILED";
                    const isSimulated = log.status === "SIMULATED";
                    const displayCategory = CATEGORY_LABEL_MAP[log.category] || log.category;
                    const source = getNotificationSource(log);

                    return (
                      <tr
                        key={log.id}
                        className={`group transition-colors duration-150 ${
                          isFailed
                            ? "border-l-4 border-l-rose-500 bg-rose-50/15 hover:bg-rose-50/25"
                            : isSelected
                            ? "bg-emerald-50/30"
                            : "hover:bg-slate-50/50"
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

                        {/* Recipient */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 border select-none ${
                                isFailed
                                  ? "bg-rose-50 text-rose-700 border-rose-100"
                                  : isSimulated
                                  ? "bg-sky-50 text-sky-700 border-sky-100"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
                              }`}
                            >
                              {getInitials(log.recipientName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">
                                {log.recipientName || "Pelanggan"}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {log.recipientPhone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Message Preview & Badges */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5 max-w-md">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${getSourceBadgeClass(
                                  source
                                )}`}
                              >
                                {source}
                              </span>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadgeClass(
                                  log.category
                                )}`}
                              >
                                {displayCategory}
                              </span>
                              {log.trigger && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                  {TRIGGER_LABEL_MAP[log.trigger] || log.trigger}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 font-normal leading-relaxed">
                              {log.message}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">{renderStatusBadge(log.status)}</td>

                        {/* Time */}
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 text-[11px]">
                            {formatExactTime(log.sentAt || log.createdAt)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {log.provider ? `via ${log.provider}` : "Fonnte"}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 relative">
                            {/* Eye Detail */}
                            <button
                              type="button"
                              onClick={() => setActiveDrawerLog(log)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveMenuId(activeMenuId === log.id ? null : log.id)
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {activeMenuId === log.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setActiveMenuId(null)}
                                  />
                                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 font-sans text-xs text-left animate-fadeIn">
                                    {/* Retry: Only for FAILED status, never for SIMULATED */}
                                    {isFailed && !isSimulated && (
                                      <button
                                        type="button"
                                        disabled={isRetrying === log.id}
                                        onClick={() => handleRetrySingle(log.id)}
                                        className="w-full px-3 py-2 text-emerald-700 font-bold hover:bg-emerald-50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                      >
                                        <RefreshCw
                                          className={`w-3 h-3 text-emerald-600 ${
                                            isRetrying === log.id ? "animate-spin" : ""
                                          }`}
                                        />
                                        <span>
                                          {isRetrying === log.id ? "Mengirim..." : "Kirim Ulang"}
                                        </span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveDrawerLog(log);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-slate-600 font-semibold hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Info className="w-3 h-3 text-slate-400" />
                                      <span>Detail Log</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard?.writeText(log.recipientPhone);
                                        setActiveMenuId(null);
                                        showToast(`✓ Nomor ${log.recipientPhone} tersalin!`);
                                      }}
                                      className="w-full px-3 py-2 text-slate-600 font-semibold hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Copy className="w-3 h-3 text-slate-400" />
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

            {/* Empty Filter / Database State */}
            {filteredLogs.length === 0 && (
              <div className="p-16 text-center space-y-4">
                {isAnyFilterActive ? (
                  <>
                    <Filter className="w-8 h-8 text-slate-300 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Hasil Filter Tidak Ditemukan
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        Tidak ada log notifikasi yang cocok dengan filter atau kata kunci Anda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </>
                ) : (
                  <>
                    <Database className="w-8 h-8 text-slate-300 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Belum Ada Riwayat Notifikasi
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        Seluruh eksekusi pesan otomatis dan pesan tes akan tersimpan di sini.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Pagination Footer */}
            {filteredLogs.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 select-none">
                <div>
                  Menampilkan <span className="font-bold">{filteredLogs.length}</span> dari{" "}
                  <span className="font-bold">{totalRecords}</span> log
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-bold text-slate-700 px-1">
                    Halaman {page} dari {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DRAWER LOG DETAIL */}
      {activeDrawerLog && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setActiveDrawerLog(null)}
          />

          {/* Drawer container */}
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl z-10 flex flex-col animate-slideInRight">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 font-extrabold text-[11px] shrink-0">
                  WA
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">Detail Log Notifikasi</h3>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{activeDrawerLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawerLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Status Banner */}
              <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <span className="font-bold text-slate-600">Status</span>
                {renderStatusBadge(activeDrawerLog.status)}
              </div>

              {/* Error Message callout */}
              {activeDrawerLog.status === "FAILED" && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Pesan Gagal Terkirim</span>
                  </div>
                  <p className="text-[11px] text-rose-700 font-mono leading-relaxed">
                    {activeDrawerLog.errorMessage || "Fonnte Provider mengembalikan status error."}
                  </p>

                  <button
                    type="button"
                    disabled={isRetrying === activeDrawerLog.id}
                    onClick={() => handleRetrySingle(activeDrawerLog.id)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isRetrying === activeDrawerLog.id ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isRetrying === activeDrawerLog.id ? "Mengirim Ulang..." : "Kirim Ulang"}
                    </span>
                  </button>
                </div>
              )}

              {/* Recipient Info */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Penerima & Kategori
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Penerima</span>
                    <span className="font-bold text-slate-800">
                      {activeDrawerLog.recipientName || "Pelanggan POS"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">WhatsApp</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {activeDrawerLog.recipientPhone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Sumber</span>
                    <span className="font-bold text-indigo-600">
                      {getNotificationSource(activeDrawerLog)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Kategori</span>
                    <span className="font-bold text-slate-800">
                      {CATEGORY_LABEL_MAP[activeDrawerLog.category] || activeDrawerLog.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Work Order Info (loaded dynamically) */}
              {activeDrawerLog.workOrderId && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Informasi Work Order
                  </h4>
                  {isLoadingWorkOrder ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 text-[#25D366] animate-spin" />
                    </div>
                  ) : activeWorkOrder ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Kode WO</span>
                        <span className="font-bold text-slate-800">{activeWorkOrder.code}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Status WO</span>
                        <span className="font-bold text-slate-800">{activeWorkOrder.status}</span>
                      </div>
                      {activeWorkOrder.vehicle && (
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[10px] uppercase">Kendaraan</span>
                          <span className="font-semibold text-slate-800">
                            {activeWorkOrder.vehicle.brand} {activeWorkOrder.vehicle.model} (
                            {activeWorkOrder.vehicle.plateNumber})
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Pelanggan</span>
                        <span className="font-semibold text-slate-800">
                          {activeWorkOrder.customer?.name || "Pelanggan"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Total</span>
                        <span className="font-bold text-emerald-600">
                          Rp {activeWorkOrder.grandTotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Work Order #{activeDrawerLog.workOrderId} tidak ditemukan.
                    </p>
                  )}
                </div>
              )}

              {/* Message Preview */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Isi Pesan WhatsApp
                </h4>
                <div className="rounded-2xl border border-slate-300 overflow-hidden bg-[#E5DDD5] shadow-2xs">
                  <div className="bg-[#075E54] text-white px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold select-none">
                    <span>POS Bengkel Baik</span>
                  </div>
                  <div className="p-3 bg-[radial-[#00000008]_1px,transparent_1px] [background-size:12px_12px]">
                    <div className="bg-white rounded-lg p-3 shadow-2xs text-slate-800 leading-relaxed space-y-1.5 border-l-4 border-[#25D366]">
                      <p className="whitespace-pre-wrap text-[11px] font-medium">
                        {activeDrawerLog.message}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 pt-1 select-none">
                        <span>{formatExactTime(activeDrawerLog.sentAt || activeDrawerLog.createdAt)}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details Collapsible */}
              <details className="group border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <summary className="flex items-center justify-between p-3.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none hover:bg-slate-100/50 transition-colors">
                  <span>Detail Teknis / Metadata</span>
                  <span className="text-slate-400 transition-transform duration-200 group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <div className="p-3.5 border-t border-slate-200 space-y-2.5 font-mono text-[10px] text-slate-500 bg-white">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Message ID</span>
                    <span className="font-semibold text-slate-700">{activeDrawerLog.providerMessageId || "-"}</span>
                  </div>
                  {activeDrawerLog.trigger && (
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Trigger</span>
                      <span className="font-semibold text-slate-700">{activeDrawerLog.trigger}</span>
                    </div>
                  )}
                  {activeDrawerLog.automationId && (
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Automation ID</span>
                      <span className="font-semibold text-slate-700">{activeDrawerLog.automationId}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Response Provider</span>
                    <pre className="mt-1 p-2 rounded bg-slate-50 overflow-x-auto max-h-36 custom-scrollbar text-[9px] text-slate-600 border border-slate-150">
                      {JSON.stringify(activeDrawerLog.providerResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
