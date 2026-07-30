"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  MoreVertical,
  Sparkles,
  Trash2,
  MessageSquare,
  Save,
  Copy,
  AlertCircle,
  RefreshCw,
  CheckCheck,
  Send,
  Users,
  Clock,
  Radio,
  Calendar,
  Zap,
} from "lucide-react";
import {
  NotificationTemplate,
  NotificationCategory,
} from "@/types/notificationTemplate";
import { NotificationTemplateService } from "@/services/notificationTemplate.service";

const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  WORK_ORDER_CREATED: "Pekerjaan Masuk",
  WORK_ORDER_COMPLETED: "Selesai Servis",
  PAYMENT_RECEIVED: "Pembayaran",
  SERVICE_REMINDER: "Reminder",
  WORK_ORDER_UPDATED: "Follow Up",
  CUSTOM: "Custom (Broadcast)",
  VEHICLE_READY: "Unit Ready",
  INVOICE_CREATED: "Invoice",
  TEST: "Pesan Uji Coba",
  INVOICE: "Invoice",
  PAYMENT: "Pembayaran",
};

export const NotificationTemplatesTab: React.FC = () => {
  // Data States
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // UI Action States
  const [showMenu, setShowMenu] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingInline, setIsCreatingInline] = useState(false);

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<NotificationTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Templates from Backend API
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await NotificationTemplateService.getNotificationTemplates();
      setTemplates(data);

      if (data.length > 0) {
        setSelectedId((prev) => {
          if (prev && data.some((t) => t.id === prev)) return prev;
          return data[0].id;
        });
      } else {
        setSelectedId(null);
      }
    } catch (err: any) {
      console.error("Error loading notification templates:", err);
      setErrorMsg(
        err.message || "Gagal memuat daftar template notifikasi dari server."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Active Selected Template
  const activeTemplate = templates.find((t) => t.id === selectedId) || null;

  // Helper for updating active template state locally
  const updateActiveField = (field: keyof NotificationTemplate, value: any) => {
    if (!selectedId) return;
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, [field]: value } : t))
    );
  };

  // Helper for updating nested conditions
  const updateConditionField = (key: string, value: any) => {
    if (!activeTemplate || !selectedId) return;
    const currentConditions = activeTemplate.conditions || {};
    updateActiveField("conditions", {
      ...currentConditions,
      [key]: value,
    });
  };

  // Insert Variable to Message Content
  const insertVariable = (variableTag: string) => {
    if (!activeTemplate) return;
    updateActiveField("message", activeTemplate.message + " " + variableTag);
  };

  // Save / Update Active Template to Backend
  const handleSaveTemplate = async () => {
    if (!activeTemplate) return;
    setIsSaving(true);
    setSaveNotice(null);

    try {
      const updated =
        await NotificationTemplateService.updateNotificationTemplate(
          activeTemplate.id,
          {
            name: activeTemplate.name,
            category: activeTemplate.category,
            triggerEvent: activeTemplate.triggerEvent,
            message: activeTemplate.message,
            targetRecipients: activeTemplate.targetRecipients,
            deliveryTiming: activeTemplate.deliveryTiming,
            delayMinutes: activeTemplate.delayMinutes,
            conditions: activeTemplate.conditions,
            isActive: activeTemplate.isActive,
          }
        );

      setTemplates((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      setSaveNotice({
        type: "success",
        message: `Template "${updated.name}" berhasil disimpan!`,
      });
      setTimeout(() => setSaveNotice(null), 3500);
    } catch (err: any) {
      console.error("Failed to update template:", err);
      setSaveNotice({
        type: "error",
        message: err.message || "Gagal menyimpan perubahan template.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // CREATE TEMPLATE DIRECTLY (NO MODAL)
  const handleCreateInline = async () => {
    setIsCreatingInline(true);
    setSaveNotice(null);

    const defaultTitle = `Template Baru #${templates.length + 1}`;
    const defaultContent = `Halo {{customer_name}},\n\nDapatkan penawaran promo spesial dari {{workshop_name}}!\n\nJika ada pertanyaan, silakan hubungi kami.`;

    try {
      const created =
        await NotificationTemplateService.createNotificationTemplate({
          name: defaultTitle,
          category: "CUSTOM",
          triggerEvent: "Broadcast Promosi",
          message: defaultContent,
          targetRecipients: ["all_customers"],
          deliveryTiming: "direct",
          delayMinutes: 0,
          conditions: {
            targetSegment: "all_customers",
            sendTime: "09:00",
            sendDays: "Senin - Sabtu",
            operationalHoursOnly: true,
            skipHolidays: true,
          },
          isActive: true,
        });

      setTemplates((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setSaveNotice({
        type: "success",
        message: `Template baru telah dibuat! Silakan atur kategori & pesan di editor tengah.`,
      });
      setTimeout(() => setSaveNotice(null), 4000);
    } catch (err: any) {
      console.error("Failed to create template:", err);
      setSaveNotice({
        type: "error",
        message: err.message || "Gagal membuat template baru.",
      });
    } finally {
      setIsCreatingInline(false);
    }
  };

  // Duplicate Template
  const handleDuplicateTemplate = async () => {
    if (!activeTemplate) return;
    setShowMenu(false);
    setIsSaving(true);
    try {
      const duplicated =
        await NotificationTemplateService.createNotificationTemplate({
          name: `${activeTemplate.name} (Salinan)`,
          category: activeTemplate.category,
          triggerEvent: activeTemplate.triggerEvent,
          message: activeTemplate.message,
          targetRecipients: activeTemplate.targetRecipients,
          deliveryTiming: activeTemplate.deliveryTiming,
          delayMinutes: activeTemplate.delayMinutes,
          conditions: activeTemplate.conditions,
          isActive: activeTemplate.isActive,
        });

      setTemplates((prev) => [duplicated, ...prev]);
      setSelectedId(duplicated.id);
      setSaveNotice({
        type: "success",
        message: `Template "${activeTemplate.name}" berhasil diduplikasi!`,
      });
      setTimeout(() => setSaveNotice(null), 3500);
    } catch (err: any) {
      setSaveNotice({
        type: "error",
        message: err.message || "Gagal menduplikasi template.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle IsActive Status
  const handleToggleActive = async (
    t: NotificationTemplate,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      const updated = await NotificationTemplateService.toggleActive(
        t.id,
        !t.isActive
      );
      setTemplates((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err: any) {
      console.error("Failed to toggle template active status:", err);
    }
  };

  // Confirm & Delete Template
  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      await NotificationTemplateService.deleteNotificationTemplate(
        templateToDelete.id
      );

      const remaining = templates.filter((t) => t.id !== templateToDelete.id);
      setTemplates(remaining);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
      }
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete template:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Templates List
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-slate-800">
      {/* 3-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-5 items-start">
        {/* ================================================================= */}
        {/* KOLOM KIRI (Library) */}
        {/* ================================================================= */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Template Library
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                {templates.length} template terdaftar
              </p>
            </div>
            <button
              type="button"
              disabled={isCreatingInline}
              onClick={handleCreateInline}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-emerald-600 text-white shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isCreatingInline ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{isCreatingInline ? "..." : "Tambah"}</span>
            </button>
          </div>

          {/* Search & Category Chips */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau isi pesan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
              {[
                { id: "all", label: "Semua" },
                { id: "CUSTOM", label: "Promosi" },
                { id: "WORK_ORDER_CREATED", label: "Pekerjaan" },
                { id: "WORK_ORDER_COMPLETED", label: "Selesai" },
                { id: "SERVICE_REMINDER", label: "Reminder" },
                { id: "PAYMENT_RECEIVED", label: "Pembayaran" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                    filterCategory === cat.id
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-[#25D366]" />
              <span className="text-xs font-medium">Memuat template...</span>
            </div>
          )}

          {/* Error State */}
          {!isLoading && errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Template Cards List */}
          {!isLoading && !errorMsg && (
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredTemplates.map((t) => {
                const isSelected = t.id === selectedId;
                const catLabel =
                  CATEGORY_DISPLAY_MAP[t.category] || t.category;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? "bg-emerald-50/50 border-[#25D366] shadow-xs ring-1 ring-[#25D366]/30"
                        : "bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-[#128C7E] truncate font-sans">
                            {t.name}
                          </span>
                          {t.isActive ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              Active
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                              Inactive
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 font-normal line-clamp-2 leading-relaxed">
                          {t.message}
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {catLabel}
                          </span>
                        </div>
                      </div>

                      {/* Active Toggle Switch */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleToggleActive(t, e)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            t.isActive ? "bg-[#25D366]" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              t.isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada template yang cocok.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* KOLOM TENGAH (Editor) */}
        {/* ================================================================= */}
        {activeTemplate ? (
          <div className="lg:col-span-8 xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-6">
            {/* Header Editor */}
            <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1.5 flex-1 min-w-0">
                <input
                  type="text"
                  value={activeTemplate.name}
                  onChange={(e) => updateActiveField("name", e.target.value)}
                  className="text-base font-bold text-slate-900 font-sans border-b border-transparent hover:border-slate-300 focus:border-[#25D366] focus:outline-none bg-transparent w-full truncate"
                />
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      activeTemplate.isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {activeTemplate.isActive ? "Active" : "Inactive"}
                  </span>

                  {/* Inline Category Select */}
                  <select
                    value={activeTemplate.category}
                    onChange={(e) =>
                      updateActiveField(
                        "category",
                        e.target.value as NotificationCategory
                      )
                    }
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#25D366] cursor-pointer max-w-[160px] sm:max-w-[190px] truncate shrink-0"
                  >
                    <option value="CUSTOM">Custom (Broadcast)</option>
                    <option value="WORK_ORDER_CREATED">Pekerjaan Masuk</option>
                    <option value="WORK_ORDER_COMPLETED">Selesai Servis</option>
                    <option value="VEHICLE_READY">Unit Ready</option>
                    <option value="SERVICE_REMINDER">Reminder Servis</option>
                    <option value="INVOICE_CREATED">Invoice</option>
                    <option value="PAYMENT_RECEIVED">Pembayaran</option>
                    <option value="WORK_ORDER_UPDATED">Update Status</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons: Save & Dropdown Menu */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60 shrink-0"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? "Menyimpan..." : "Simpan"}</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-30 font-sans text-xs animate-fadeIn">
                        <button
                          type="button"
                          onClick={handleDuplicateTemplate}
                          className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Duplikasi Template</span>
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            setTemplateToDelete(activeTemplate);
                            setShowDeleteModal(true);
                          }}
                          className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus Template</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Save Notice */}
            {saveNotice && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
                  saveNotice.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {saveNotice.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{saveNotice.message}</span>
              </div>
            )}

            {/* MESSAGE TEXTAREA EDITOR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Isi Pesan Template WhatsApp
                </h4>
              </div>

              <textarea
                rows={7}
                value={activeTemplate.message}
                onChange={(e) => updateActiveField("message", e.target.value)}
                placeholder="Ketik pesan template WhatsApp..."
                className="w-full p-3.5 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition-all"
              />

              {/* DYNAMIC VARIABLE BUTTONS */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
                    Sisipkan Variabel Dinamis
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Klik untuk menyisipkan
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    "{{customer_name}}",
                    "{{customer_phone}}",
                    "{{vehicle_plate}}",
                    "{{vehicle_brand}}",
                    "{{vehicle_model}}",
                    "{{work_order_number}}",
                    "{{service_date}}",
                    "{{workshop_name}}",
                  ].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 text-xs font-mono font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* INLINE BROADCAST CONFIGURATION (SPECIAL FOR PROMOSI / CUSTOM) */}
            {/* ================================================================= */}
            {activeTemplate.category === "CUSTOM" && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-sans">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Konfigurasi Broadcast Promosi & Target
                  </h4>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                    Fitur Broadcast
                  </span>
                </div>

                {/* 1. Target Penerima Broadcast */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Ke Mana Saja Akan Dikirim (Target Segment)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      {
                        id: "all_customers",
                        label: "Semua Customer Terdaftar",
                        desc: "Kirim ke seluruh database pelanggan",
                      },
                      {
                        id: "active_customers",
                        label: "Customer Aktif (30 Hari)",
                        desc: "Servis dalam 30 hari terakhir",
                      },
                      {
                        id: "inactive_customers",
                        label: "Customer Inaktif (> 60 Hari)",
                        desc: "Belum servis lebih dari 60 hari",
                      },
                      {
                        id: "motorcycle_owners",
                        label: "Pemilik Sepeda Motor",
                        desc: "Segmen pelanggan motor",
                      },
                      {
                        id: "car_owners",
                        label: "Pemilik Mobil",
                        desc: "Segmen pelanggan mobil",
                      },
                    ].map((seg) => {
                      const currentSegment =
                        activeTemplate.conditions?.targetSegment ||
                        activeTemplate.targetRecipients?.[0] ||
                        "all_customers";
                      const isSelected = currentSegment === seg.id;

                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => {
                            updateActiveField("targetRecipients", [seg.id]);
                            updateConditionField("targetSegment", seg.id);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#25D366] bg-white font-bold text-slate-900 shadow-2xs ring-1 ring-[#25D366]"
                              : "border-slate-200 bg-white/60 text-slate-600 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{seg.label}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                            {seg.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Waktu Pengiriman (Delivery Timing) */}
                <div className="space-y-3 pt-2 border-t border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Waktu Pengiriman Pesan (Delivery Timing)
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateActiveField("deliveryTiming", "direct")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activeTemplate.deliveryTiming === "direct"
                          ? "border-[#25D366] bg-white font-bold text-slate-900 ring-1 ring-[#25D366]"
                          : "border-slate-200 bg-white/60 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Kirim Langsung</span>
                        {activeTemplate.deliveryTiming === "direct" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                        Broadcast terkirim saat tombol di-trigger
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateActiveField("deliveryTiming", "scheduled")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activeTemplate.deliveryTiming === "scheduled"
                          ? "border-[#25D366] bg-white font-bold text-slate-900 ring-1 ring-[#25D366]"
                          : "border-slate-200 bg-white/60 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Terjadwal Otomatis</span>
                        {activeTemplate.deliveryTiming === "scheduled" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                        Kirim sesuai jadwal jam & hari yang ditentukan
                      </span>
                    </button>
                  </div>

                  {/* Options Terjadwal */}
                  {activeTemplate.deliveryTiming === "scheduled" && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Jam Pengiriman
                          </label>
                          <input
                            type="time"
                            value={activeTemplate.conditions?.sendTime || "09:00"}
                            onChange={(e) =>
                              updateConditionField("sendTime", e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Hari Aktif Kirim
                          </label>
                          <select
                            value={activeTemplate.conditions?.sendDays || "Senin - Sabtu"}
                            onChange={(e) =>
                              updateConditionField("sendDays", e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                          >
                            <option value="Senin - Sabtu">Senin - Sabtu</option>
                            <option value="Setiap Hari">Setiap Hari</option>
                            <option value="Senin - Jumat">Senin - Jumat (Weekday)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-1">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeTemplate.conditions?.operationalHoursOnly ?? true}
                            onChange={(e) =>
                              updateConditionField("operationalHoursOnly", e.target.checked)
                            }
                            className="rounded text-[#25D366] focus:ring-[#25D366]"
                          />
                          <span>Batasi di Jam Operasional (08:00 - 17:00)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeTemplate.conditions?.skipHolidays ?? true}
                            onChange={(e) =>
                              updateConditionField("skipHolidays", e.target.checked)
                            }
                            className="rounded text-[#25D366] focus:ring-[#25D366]"
                          />
                          <span>Lewati Hari Libur Nasional</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-sans">
            Pilih atau buat template baru untuk mengedit.
          </div>
        )}

        {/* ================================================================= */}
        {/* KOLOM KANAN (Preview) */}
        {/* ================================================================= */}
        {activeTemplate && (
          <div className="lg:col-span-12 xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  Preview WhatsApp Chat
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tampilan realtime ke pelanggan.
                </p>
              </div>
            </div>

            {/* WHATSAPP MOCKUP BUBBLE */}
            <div className="rounded-2xl border border-slate-300 shadow-md overflow-hidden bg-[#E5DDD5]">
              <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white text-[#075E54] font-extrabold text-xs flex items-center justify-center">
                    BB
                  </div>
                  <div>
                    <h5 className="text-xs font-bold font-sans">
                      POS Bengkel Baik
                    </h5>
                    <span className="text-[10px] text-emerald-200">online</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 space-y-3 min-h-[300px] bg-[radial-[#00000008]_1px,transparent_1px] [background-size:12px_12px]">
                <div className="max-w-[92%] bg-white rounded-lg p-3 text-xs shadow-xs text-slate-800 font-sans leading-relaxed space-y-2 ml-auto border-l-4 border-[#25D366]">
                  <p className="whitespace-pre-wrap text-[11px]">
                    {activeTemplate.message
                      .replace(/\{\{customer_name\}\}/g, "Budi Santoso")
                      .replace(/\{\{customer_phone\}\}/g, "081234567890")
                      .replace(/\{\{vehicle_plate\}\}/g, "B 1234 ABC")
                      .replace(/\{\{vehicle_brand\}\}/g, "Honda")
                      .replace(/\{\{vehicle_model\}\}/g, "Vario 125")
                      .replace(/\{\{work_order_number\}\}/g, "WO-250701-001")
                      .replace(/\{\{service_date\}\}/g, "1 Juli 2026")
                      .replace(/\{\{workshop_name\}\}/g, "POS Bengkel Baik")}
                  </p>

                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                    <span>09:00</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI HAPUS TEMPLATE */}
      {/* ========================================================================= */}
      {showDeleteModal && templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4 z-10 font-sans">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Template Notifikasi?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Template <strong className="text-slate-900">{templateToDelete.name}</strong> akan di-soft-delete dari database secara aman. Riwayat pengiriman terdahulu tetap tersimpan di Notification History.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Hapus..." : "Ya, Hapus"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
