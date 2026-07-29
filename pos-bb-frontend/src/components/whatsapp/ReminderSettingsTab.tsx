"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Gauge,
  Calendar,
  Send,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Play,
  User,
  Zap,
  CheckCheck,
  Sparkles,
  ArrowRight,
  Trash2,
  Power,
  Check,
  ShieldCheck,
  Radio,
  MessageSquare,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ReminderRule, ReminderCategory, ReminderTriggerType } from "@/types/reminderRule";
import { ReminderRuleService } from "@/services/reminderRule.service";

// ── Local UI state shape that mirrors ReminderRule but keeps the
//    AutomationItem fields the UI already uses (useDays, useKm flags).
interface AutomationItem {
  // persisted fields
  id: number | null; // null when not yet saved to DB
  name: string;
  category: ReminderCategory;
  triggerType: ReminderTriggerType;
  daysInterval: number;
  kmInterval: number;
  useDays: boolean;
  useKm: boolean;
  isActive: boolean;
  sendTime: string;
  timezone: string;
  sendDays: string;
  skipHolidays: boolean;
  retryOnFailure: boolean;
  messageTemplate: string;
  // UI-only helpers
  localId: string; // stable key for React lists
  triggerText: string;
}

interface CustomerSample {
  id: string;
  name: string;
  phone: string;
  vehicleName: string;
  vehiclePlate: string;
  currentKm: number;
  lastServiceDate: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function categoryFromApi(cat: ReminderCategory): ReminderCategory {
  return cat;
}

function triggerTypeFromFlags(useDays: boolean, useKm: boolean): ReminderTriggerType {
  if (useDays && useKm) return "BOTH";
  if (useKm) return "KM";
  return "DAYS";
}

function fromApiRule(rule: ReminderRule): AutomationItem {
  const useDays = rule.triggerType === "DAYS" || rule.triggerType === "BOTH";
  const useKm = rule.triggerType === "KM" || rule.triggerType === "BOTH";
  const item: AutomationItem = {
    id: rule.id,
    name: rule.name,
    category: rule.category,
    triggerType: rule.triggerType,
    daysInterval: rule.daysInterval ?? 30,
    kmInterval: rule.kmInterval ?? 3000,
    useDays,
    useKm,
    isActive: rule.isActive,
    sendTime: rule.sendTime,
    timezone: rule.timezone,
    sendDays: rule.sendDays,
    skipHolidays: rule.skipHolidays,
    retryOnFailure: rule.retryOnFailure,
    messageTemplate: rule.messageTemplate,
    localId: `rule-${rule.id}`,
    triggerText: "",
  };
  item.triggerText = getTriggerTextFromItem(item);
  return item;
}

function getTriggerTextFromItem(item: AutomationItem): string {
  if (item.useDays && item.useKm) {
    return `${item.daysInterval} hari / ${item.kmInterval.toLocaleString()} KM`;
  }
  if (item.useDays) return `${item.daysInterval} hari sebelum jatuh tempo`;
  if (item.useKm) return `${item.kmInterval.toLocaleString()} KM sebelum jatuh tempo`;
  return `${item.daysInterval} hari sebelum jatuh tempo`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ReminderSettingsTab: React.FC = () => {
  // Sample Customers for Live Simulation
  const customersSample: CustomerSample[] = [
    {
      id: "c1",
      name: "Budi Santoso",
      phone: "+62 812-3456-7890",
      vehicleName: "Honda Vario 125",
      vehiclePlate: "B 1234 ABC",
      currentKm: 2985,
      lastServiceDate: "12 Juni 2026",
    },
    {
      id: "c2",
      name: "Siti Aminah",
      phone: "+62 813-9876-5432",
      vehicleName: "Toyota Avanza Veloz",
      vehiclePlate: "B 9876 XYZ",
      currentKm: 9950,
      lastServiceDate: "15 April 2026",
    },
    {
      id: "c3",
      name: "Rudi Hermawan",
      phone: "+62 857-1122-3344",
      vehicleName: "Yamaha NMAX 155",
      vehiclePlate: "D 4567 LMN",
      currentKm: 5400,
      lastServiceDate: "01 Mei 2026",
    },
  ];

  // ── Data state ──────────────────────────────────────────────────────────────
  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Live Simulation State
  const [simCustomer, setSimCustomer] = useState<CustomerSample>(customersSample[0]);
  const [simKm, setSimKm] = useState<number>(2985);
  const [simDate, setSimDate] = useState<string>("2026-07-12");

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const rules = await ReminderRuleService.getReminderRules();
      const items = rules.map(fromApiRule);
      setAutomations(items);
      if (items.length > 0 && !selectedLocalId) {
        setSelectedLocalId(items[0].localId);
      }
    } catch (err: any) {
      setFetchError(err?.message || "Gagal memuat data automation.");
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const activeAutomation = automations.find((a) => a.localId === selectedLocalId) ?? null;

  const filteredAutomations = automations.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      filterCategory === "all" || a.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const showSuccess = (msg: string) => {
    setSaveNotice(msg);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorNotice(msg);
    setTimeout(() => setErrorNotice(null), 4000);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  // Update a field in the local state (optimistic)
  const updateActiveField = (field: keyof AutomationItem, value: any) => {
    setAutomations((prev) =>
      prev.map((item) => {
        if (item.localId === selectedLocalId) {
          const updated = { ...item, [field]: value };
          // Keep triggerType in sync with useDays/useKm flags
          if (field === "useDays" || field === "useKm") {
            updated.triggerType = triggerTypeFromFlags(
              field === "useDays" ? value : updated.useDays,
              field === "useKm" ? value : updated.useKm
            );
          }
          updated.triggerText = getTriggerTextFromItem(updated);
          return updated;
        }
        return item;
      })
    );
  };

  // Toggle active — optimistic then call API
  const toggleAutomationActive = async (localId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const item = automations.find((a) => a.localId === localId);
    if (!item) return;

    // Optimistic update
    setAutomations((prev) =>
      prev.map((a) =>
        a.localId === localId ? { ...a, isActive: !a.isActive } : a
      )
    );

    if (item.id !== null) {
      try {
        await ReminderRuleService.toggleActive(item.id, !item.isActive);
      } catch {
        // Revert on failure
        setAutomations((prev) =>
          prev.map((a) =>
            a.localId === localId ? { ...a, isActive: item.isActive } : a
          )
        );
        showError("Gagal mengubah status automation.");
      }
    }
  };

  // Save (PATCH) the active automation
  const handleSaveAutomation = async () => {
    if (!activeAutomation) return;
    setIsSaving(true);
    try {
      const payload = {
        name: activeAutomation.name,
        category: activeAutomation.category,
        triggerType: triggerTypeFromFlags(activeAutomation.useDays, activeAutomation.useKm),
        daysInterval: activeAutomation.useDays ? activeAutomation.daysInterval : null,
        kmInterval: activeAutomation.useKm ? activeAutomation.kmInterval : null,
        messageTemplate: activeAutomation.messageTemplate,
        sendTime: activeAutomation.sendTime,
        timezone: activeAutomation.timezone,
        sendDays: activeAutomation.sendDays,
        skipHolidays: activeAutomation.skipHolidays,
        retryOnFailure: activeAutomation.retryOnFailure,
        isActive: activeAutomation.isActive,
      };

      if (activeAutomation.id !== null) {
        // Update existing
        const updated = await ReminderRuleService.updateReminderRule(activeAutomation.id, payload);
        setAutomations((prev) =>
          prev.map((a) =>
            a.localId === selectedLocalId ? fromApiRule(updated) : a
          )
        );
        showSuccess(`✓ Automation "${updated.name}" berhasil disimpan.`);
      } else {
        // Create new (this path shouldn't be reached normally since we POST on add)
        const created = await ReminderRuleService.createReminderRule({
          ...payload,
          description: null,
        });
        const newItem = fromApiRule(created);
        setAutomations((prev) =>
          prev.map((a) => (a.localId === selectedLocalId ? newItem : a))
        );
        setSelectedLocalId(newItem.localId);
        showSuccess(`✓ Automation "${created.name}" berhasil disimpan.`);
      }
    } catch (err: any) {
      showError(err?.message || "Gagal menyimpan automation.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add new automation — POST immediately with defaults
  const handleAddAutomation = async () => {
    const tempLocalId = `temp-${Date.now()}`;
    const defaultPayload = {
      name: "Automation Baru",
      description: null,
      category: "SERVIS" as ReminderCategory,
      triggerType: "DAYS" as ReminderTriggerType,
      daysInterval: 14,
      kmInterval: null,
      messageTemplate: "Halo {{customer_name}}, ini adalah pesan reminder otomatis.",
      sendTime: "09:00",
      timezone: "Asia/Jakarta",
      sendDays: "Senin - Sabtu",
      skipHolidays: true,
      retryOnFailure: true,
      isActive: true,
    };

    // Optimistic: add a placeholder item
    const placeholder: AutomationItem = {
      id: null,
      name: defaultPayload.name,
      category: defaultPayload.category,
      triggerType: defaultPayload.triggerType,
      daysInterval: defaultPayload.daysInterval,
      kmInterval: 2500,
      useDays: true,
      useKm: false,
      isActive: true,
      sendTime: defaultPayload.sendTime,
      timezone: defaultPayload.timezone,
      sendDays: defaultPayload.sendDays,
      skipHolidays: true,
      retryOnFailure: true,
      messageTemplate: defaultPayload.messageTemplate,
      localId: tempLocalId,
      triggerText: "14 hari sebelum jatuh tempo",
    };

    setAutomations((prev) => [placeholder, ...prev]);
    setSelectedLocalId(tempLocalId);
    setFilterCategory("all");
    setSearchQuery("");

    try {
      const created = await ReminderRuleService.createReminderRule(defaultPayload);
      const newItem = fromApiRule(created);
      // Replace placeholder with real item
      setAutomations((prev) =>
        prev.map((a) => (a.localId === tempLocalId ? newItem : a))
      );
      setSelectedLocalId(newItem.localId);
      showSuccess(`✓ Automation Baru berhasil ditambahkan ke Library.`);
    } catch (err: any) {
      // Remove placeholder on failure
      setAutomations((prev) => prev.filter((a) => a.localId !== tempLocalId));
      setSelectedLocalId(automations[0]?.localId ?? null);
      showError(err?.message || "Gagal membuat automation baru.");
    }
  };

  // Delete active automation
  const handleDeleteAutomation = async (localId: string) => {
    const item = automations.find((a) => a.localId === localId);
    if (!item) return;

    // Optimistic remove
    const updatedList = automations.filter((a) => a.localId !== localId);
    setAutomations(updatedList);
    setShowMenu(false);
    if (updatedList.length > 0) {
      setSelectedLocalId(updatedList[0].localId);
    } else {
      setSelectedLocalId(null);
    }

    if (item.id !== null) {
      try {
        await ReminderRuleService.deleteReminderRule(item.id);
        showSuccess(`Automation "${item.name}" berhasil dihapus.`);
      } catch (err: any) {
        // Revert
        setAutomations((prev) => [...prev, item]);
        setSelectedLocalId(localId);
        showError(err?.message || "Gagal menghapus automation.");
      }
    }
  };

  // Insert Variable to Template
  const insertVariable = (variableTag: string) => {
    if (!activeAutomation) return;
    updateActiveField(
      "messageTemplate",
      activeAutomation.messageTemplate + " " + variableTag
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* MAIN 3-COLUMN ENTERPRISE AUTOMATION BUILDER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================================================================= */}
        {/* KOLOM KIRI (30%) - AUTOMATION LIBRARY */}
        {/* ================================================================= */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Automation Library
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                {automations.length} alur automasi terdaftar
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddAutomation}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-emerald-600 text-white shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari automation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
              {["all", "SERVIS", "PERAWATAN", "BAN", "REM"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                    filterCategory === cat
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat === "all" ? "Semua" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#25D366]" />
              <span className="text-xs">Memuat automation...</span>
            </div>
          )}

          {/* Error State */}
          {!isLoading && fetchError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Automation List Items */}
          {!isLoading && !fetchError && (
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredAutomations.map((item) => {
                const isSelected = item.localId === selectedLocalId;

                return (
                  <div
                    key={item.localId}
                    onClick={() => setSelectedLocalId(item.localId)}
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
                            {item.name}
                          </span>
                          {item.id === null && (
                            <Loader2 className="w-3 h-3 animate-spin text-slate-400 shrink-0" />
                          )}
                          {item.isActive ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              Active
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                              Inactive
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 font-normal truncate">
                          {item.triggerText}
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {item.category.charAt(0) + item.category.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => toggleAutomationActive(item.localId, e)}
                          disabled={item.id === null}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                            item.isActive ? "bg-[#25D366]" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              item.isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredAutomations.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada automation yang ditemukan.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* KOLOM TENGAH (45%) - AUTOMATION BUILDER EDITOR */}
        {/* ================================================================= */}
        {activeAutomation ? (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
            {/* Header Editor */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1 flex-1 min-w-0">
                <input
                  type="text"
                  value={activeAutomation.name}
                  onChange={(e) => updateActiveField("name", e.target.value)}
                  className="text-base font-bold text-slate-900 font-sans border-b border-transparent hover:border-slate-300 focus:border-[#25D366] focus:outline-none bg-transparent w-full truncate"
                />
                <div className="pt-0.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      activeAutomation.isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {activeAutomation.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Save Button & 3-Dots Dropdown Menu */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveAutomation}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? "Menyimpan..." : "Simpan"}</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <>
                      {/* Backdrop dismiss */}
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 font-sans animate-fadeIn text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            updateActiveField("isActive", !activeAutomation.isActive);
                            setShowMenu(false);
                          }}
                          className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                        >
                          <Power className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {activeAutomation.isActive
                              ? "Nonaktifkan Automation"
                              : "Aktifkan Automation"}
                          </span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        <button
                          type="button"
                          onClick={() => handleDeleteAutomation(activeAutomation.localId)}
                          className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus Automation</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Success Toast Notice */}
            {saveNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>{saveNotice}</span>
              </div>
            )}

            {/* Error Toast Notice */}
            {errorNotice && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* SECTION 1: TRIGGER REMINDER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Trigger Reminder
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  Pilih metode jatuh tempo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Trigger Hari */}
                <div
                  onClick={() => updateActiveField("useDays", !activeAutomation.useDays)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    activeAutomation.useDays
                      ? "border-[#25D366] bg-emerald-50/30 shadow-2xs"
                      : "border-slate-200/80 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Berdasarkan Hari
                    </span>
                    <input
                      type="checkbox"
                      checked={activeAutomation.useDays}
                      onChange={(e) => updateActiveField("useDays", e.target.checked)}
                      className="rounded text-[#25D366] focus:ring-[#25D366]"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-slate-500">Kirim</span>
                    <input
                      type="number"
                      value={activeAutomation.daysInterval}
                      onChange={(e) =>
                        updateActiveField("daysInterval", Number(e.target.value))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                    />
                    <span className="text-xs text-slate-600 font-medium">
                      hari sebelum jatuh tempo
                    </span>
                  </div>
                </div>

                {/* Trigger Kilometer */}
                <div
                  onClick={() => updateActiveField("useKm", !activeAutomation.useKm)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    activeAutomation.useKm
                      ? "border-[#25D366] bg-emerald-50/30 shadow-2xs"
                      : "border-slate-200/80 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-blue-600" />
                      Berdasarkan Kilometer
                    </span>
                    <input
                      type="checkbox"
                      checked={activeAutomation.useKm}
                      onChange={(e) => updateActiveField("useKm", e.target.checked)}
                      className="rounded text-[#25D366] focus:ring-[#25D366]"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-slate-500">Kirim</span>
                    <input
                      type="number"
                      step="500"
                      value={activeAutomation.kmInterval}
                      onChange={(e) =>
                        updateActiveField("kmInterval", Number(e.target.value))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                    />
                    <span className="text-xs text-slate-600 font-medium">
                      KM sebelum jatuh tempo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: TARGET CUSTOMER */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <User className="w-4 h-4 text-emerald-600" />
                Target Customer (Penerima)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "SERVIS", label: "Servis Berkala", desc: "Jadwal servis rutin" },
                  { id: "PERAWATAN", label: "Perawatan", desc: "Perawatan kendaraan" },
                  { id: "BAN", label: "Ban & Velg", desc: "Rotasi & balancing ban" },
                  { id: "KELISTRIKAN", label: "Kelistrikan", desc: "Aki & sistem listrik" },
                  { id: "REM", label: "Rem & Suspensi", desc: "Kanvas rem & per" },
                ].map((chip) => {
                  const isSelected = activeAutomation.category === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => updateActiveField("category", chip.id as ReminderCategory)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-[#25D366] bg-emerald-50/50 text-[#128C7E] shadow-2xs font-bold"
                          : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <div className="text-xs flex items-center justify-between">
                        <span>{chip.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#25D366]" />}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">
                        {chip.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: CUSTOM MESSAGE TEMPLATE EDITOR */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Isi Pesan WhatsApp (Custom Template)
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  Kustomisasi teks pesan
                </span>
              </div>

              {/* Textarea for message template */}
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={activeAutomation.messageTemplate}
                  onChange={(e) => updateActiveField("messageTemplate", e.target.value)}
                  placeholder="Ketik isi pesan WhatsApp di sini..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition-all"
                />
              </div>

              {/* VARIABLE PICKER DIRECTLY BELOW TEXTAREA */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
                    Sisipkan Variabel Dinamis
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Klik tombol untuk menyisipkan ke teks
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">
                      Customer:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["{{customer_name}}", "{{customer_phone}}"].map((v) => (
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

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">
                      Kendaraan:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["{{vehicle_name}}", "{{vehicle_plate}}", "{{current_km}}"].map((v) => (
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

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">
                      Servis & Bengkel:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{service_name}}",
                        "{{next_service_date}}",
                        "{{workshop_name}}",
                        "{{booking_link}}",
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
              </div>
            </div>

            {/* SECTION 4: SCHEDULE & DISPATCH */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Clock className="w-4 h-4 text-emerald-600" />
                Waktu Pengiriman (Schedule)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Jam Kirim
                  </label>
                  <input
                    type="time"
                    value={activeAutomation.sendTime}
                    onChange={(e) => updateActiveField("sendTime", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Timezone
                  </label>
                  <select
                    value={activeAutomation.timezone}
                    onChange={(e) => updateActiveField("timezone", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  >
                    <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                    <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                    <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Hari Aktif
                  </label>
                  <select
                    value={activeAutomation.sendDays}
                    onChange={(e) => updateActiveField("sendDays", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
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
                    checked={activeAutomation.skipHolidays}
                    onChange={(e) => updateActiveField("skipHolidays", e.target.checked)}
                    className="rounded text-[#25D366] focus:ring-[#25D366]"
                  />
                  <span>Lewati Hari Libur Nasional</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeAutomation.retryOnFailure}
                    onChange={(e) => updateActiveField("retryOnFailure", e.target.checked)}
                    className="rounded text-[#25D366] focus:ring-[#25D366]"
                  />
                  <span>Retry Otomatis Jika Gagal</span>
                </label>
              </div>
            </div>

            {/* SECTION 5: ADVANCED RULES (Collapsible Accordion) */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  Advanced Rules (Batas & Anti-Spam)
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAdvanced && (
                <div className="p-4 mt-2 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Min. Transaksi Terakhir
                      </label>
                      <input
                        type="text"
                        defaultValue="Rp 50.000"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Max. Reminder per Customer
                      </label>
                      <input
                        type="number"
                        defaultValue={2}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Cooldown Interval (Hari)
                      </label>
                      <input
                        type="number"
                        defaultValue={14}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Jam Operasional Kirim
                      </label>
                      <input
                        type="text"
                        defaultValue="08:00 - 17:00"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-sans">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
                <span>Memuat automation...</span>
              </div>
            ) : (
              "Pilih atau buat automation baru untuk mulai mengkonfigurasi."
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* KOLOM KANAN (45%) - REALTIME WHATSAPP PREVIEW */}
        {/* ================================================================= */}
        {activeAutomation && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            {/* Header Preview WhatsApp */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  Preview Pesan WhatsApp
                </h3>
                <p className="text-[11px] text-slate-500">
                  Preview realtime tampilan pesan WhatsApp ke pelanggan.
                </p>
              </div>
            </div>

            {/* REALISTIC WHATSAPP CHAT MOCKUP */}
            <div className="rounded-2xl border border-slate-300 shadow-md overflow-hidden bg-[#E5DDD5]">
              {/* WA Header Bar */}
              <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white text-[#075E54] font-extrabold text-xs flex items-center justify-center border border-white/20">
                    BB
                  </div>
                  <div>
                    <h5 className="text-xs font-bold leading-tight font-sans">
                      POS Bengkel Baik
                    </h5>
                    <span className="text-[10px] text-emerald-200 font-normal">
                      online
                    </span>
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-white/80 cursor-pointer" />
              </div>

              {/* WA Chat Wallpaper Body */}
              <div className="p-3.5 space-y-3 min-h-[300px] bg-[radial-[#00000008]_1px,transparent_1px] [background-size:12px_12px]">
                {/* Timestamp divider */}
                <div className="text-center">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/80 text-[10px] font-semibold text-slate-600 shadow-2xs">
                    HARI INI
                  </span>
                </div>

                {/* Message Bubble */}
                <div className="max-w-[90%] bg-white rounded-lg p-3 text-xs shadow-xs text-slate-800 font-sans leading-relaxed space-y-2 relative ml-auto border-l-4 border-[#25D366]">
                  <p className="whitespace-pre-wrap text-[12px]">
                    {activeAutomation.messageTemplate
                      .replace(/\{\{customer_name\}\}/g, simCustomer.name)
                      .replace(/\{\{vehicle_name\}\}/g, simCustomer.vehicleName)
                      .replace(/\{\{vehicle_plate\}\}/g, simCustomer.vehiclePlate)
                      .replace(/\{\{next_service_date\}\}/g, simDate)
                      .replace(/\{\{current_km\}\}/g, simKm.toLocaleString())}
                  </p>

                  {/* Simulated CTA Button inside WhatsApp message */}
                  <div className="pt-1">
                    <div className="w-full py-2 px-3 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#128C7E] font-bold text-center text-xs cursor-pointer transition-colors flex items-center justify-center gap-1">
                      <span>Booking Servis Sekarang</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Timestamp & Read ticks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                    <span>{activeAutomation.sendTime}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                  </div>
                </div>
              </div>

              {/* WA Footer Typing Area */}
              <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2 border-t border-slate-200">
                <input
                  type="text"
                  disabled
                  placeholder="Ketik pesan..."
                  className="flex-1 px-3 py-1.5 rounded-full bg-white text-xs border border-slate-200 text-slate-400 cursor-not-allowed"
                />
                <div className="w-7 h-7 rounded-full bg-[#128C7E] text-white flex items-center justify-center shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
