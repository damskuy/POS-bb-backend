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
  MessageSquare,
  Save,
  Loader2,
  AlertCircle,
  History,
  X,
  FlaskConical,
  Eye,
  FileText,
} from "lucide-react";
import { ReminderRule, ReminderCategory, ReminderTriggerType } from "@/types/reminderRule";
import { ReminderRuleService } from "@/services/reminderRule.service";
import { ReminderRunService, ReminderRunSummary, DryRunItem } from "@/services/reminderRun.service";

interface AutomationItem {
  id: number | null;
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
  localId: string;
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
  if (item.useDays) return `${item.daysInterval} hari setelah servis selesai`;
  if (item.useKm) return `${item.kmInterval.toLocaleString()} KM sebelum jatuh tempo`;
  return `${item.daysInterval} hari setelah servis selesai`;
}

export const ReminderSettingsTab: React.FC = () => {
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
  ];

  // Data state
  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Manual Evaluation Run state (LIVE)
  const [isRunningManual, setIsRunningManual] = useState(false);
  const [runSummary, setRunSummary] = useState<ReminderRunSummary | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);

  // Simulation State (DRY_RUN)
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [simulationSummary, setSimulationSummary] = useState<ReminderRunSummary | null>(null);
  const [showSimulationModal, setShowSimulationModal] = useState(false);

  // Dev Test Tool state
  const [showTestWoModal, setShowTestWoModal] = useState(false);
  const [testWoIdInput, setTestWoIdInput] = useState("");
  const [isMarkingWo, setIsMarkingWo] = useState(false);

  // UI state
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Live Simulation State
  const [simCustomer] = useState<CustomerSample>(customersSample[0]);
  const [simKm] = useState<number>(2985);
  const [simDate] = useState<string>("2026-07-12");

  // Fetch on mount
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
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const activeAutomation = automations.find((a) => a.localId === selectedLocalId) ?? null;

  const filteredAutomations = automations.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      filterCategory === "all" || a.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const showSuccess = (msg: string) => {
    setSaveNotice(msg);
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorNotice(msg);
    setTimeout(() => setErrorNotice(null), 4000);
  };

  // Update field
  const updateActiveField = (field: keyof AutomationItem, value: any) => {
    setAutomations((prev) =>
      prev.map((item) => {
        if (item.localId === selectedLocalId) {
          const updated = { ...item, [field]: value };
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

  // Toggle active
  const toggleAutomationActive = async (localId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const item = automations.find((a) => a.localId === localId);
    if (!item) return;

    setAutomations((prev) =>
      prev.map((a) =>
        a.localId === localId ? { ...a, isActive: !a.isActive } : a
      )
    );

    if (item.id !== null) {
      try {
        await ReminderRuleService.toggleActive(item.id, !item.isActive);
      } catch {
        setAutomations((prev) =>
          prev.map((a) =>
            a.localId === localId ? { ...a, isActive: item.isActive } : a
          )
        );
        showError("Gagal mengubah status automation.");
      }
    }
  };

  // Save active automation
  const handleSaveAutomation = async () => {
    if (!activeAutomation) return;
    setIsSaving(true);
    try {
      const payload = {
        name: activeAutomation.name,
        description: null,
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

      let savedRule: ReminderRule;
      if (activeAutomation.id === null) {
        savedRule = await ReminderRuleService.createReminderRule(payload);
      } else {
        savedRule = await ReminderRuleService.updateReminderRule(activeAutomation.id, payload);
      }

      const updatedItem = fromApiRule(savedRule);
      setAutomations((prev) =>
        prev.map((a) => (a.localId === activeAutomation.localId ? updatedItem : a))
      );
      setSelectedLocalId(updatedItem.localId);
      showSuccess(`Automation "${savedRule.name}" berhasil disimpan!`);
    } catch (err: any) {
      showError(err?.message || "Gagal menyimpan data automation.");
    } finally {
      setIsSaving(false);
    }
  };

  // Create new rule inline
  const handleCreateNewRule = async () => {
    setIsSaving(true);
    try {
      const created = await ReminderRuleService.createReminderRule({
        name: `Reminder Servis #${automations.length + 1}`,
        description: null,
        category: "SERVIS",
        triggerType: "DAYS",
        daysInterval: 30,
        kmInterval: null,
        messageTemplate: `Halo {{customer_name}},\n\nServis kendaraan {{vehicle_name}} nopol {{vehicle_plate}} Anda jatuh tempo. Hubungi {{workshop_name}} untuk booking servis!`,
        sendTime: "09:00",
        timezone: "Asia/Jakarta",
        sendDays: "Senin - Sabtu",
        skipHolidays: true,
        retryOnFailure: true,
        isActive: true,
      });

      const newItem = fromApiRule(created);
      setAutomations((prev) => [newItem, ...prev]);
      setSelectedLocalId(newItem.localId);
      showSuccess(`Automation baru "${created.name}" berhasil dibuat.`);
    } catch (err: any) {
      showError(err?.message || "Gagal membuat automation baru.");
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate automation
  const handleDuplicateAutomation = async () => {
    if (!activeAutomation) return;
    setIsSaving(true);
    setShowMenu(false);
    try {
      const created = await ReminderRuleService.createReminderRule({
        name: `${activeAutomation.name} (Salinan)`,
        description: null,
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
      });

      const newItem = fromApiRule(created);
      setAutomations((prev) => [newItem, ...prev]);
      setSelectedLocalId(newItem.localId);
      showSuccess(`Automation "${created.name}" berhasil diduplikasi.`);
    } catch (err: any) {
      showError(err?.message || "Gagal menduplikasi automation.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete automation
  const handleDeleteAutomation = async (localId: string) => {
    const item = automations.find((a) => a.localId === localId);
    if (!item) return;

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
        setAutomations((prev) => [...prev, item]);
        setSelectedLocalId(localId);
        showError(err?.message || "Gagal menghapus automation.");
      }
    }
  };

  // DRY_RUN Reminder Simulation Handler
  const handleRunSimulation = async () => {
    setIsRunningSimulation(true);
    setSimulationSummary(null);
    try {
      const res = await ReminderRunService.runReminders({ mode: "DRY_RUN" });
      setSimulationSummary(res.data);
      setShowSimulationModal(true);
    } catch (err: any) {
      showError(err?.message || "Gagal menjalankan simulasi reminder.");
    } finally {
      setIsRunningSimulation(false);
    }
  };

  // Manual Evaluation Run (LIVE)
  const handleRunManualCheck = async () => {
    setIsRunningManual(true);
    setRunSummary(null);
    try {
      const res = await ReminderRunService.runReminders({ mode: "LIVE" });
      setRunSummary(res.data);
      setShowRunModal(true);
    } catch (err: any) {
      showError(err?.message || "Gagal menjalankan evaluasi reminder.");
    } finally {
      setIsRunningManual(false);
    }
  };

  // Dev Test Tool Handler
  const handleMarkWoEligible = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testWoIdInput.trim()) return;

    setIsMarkingWo(true);
    try {
      const res = await ReminderRunService.markWoEligibleForTest(
        Number(testWoIdInput.trim())
      );
      showSuccess(
        `✓ ${res.message || `WO ID ${res.workOrderId} (${res.customerName}) siap untuk reminder test!`}`
      );
      setShowTestWoModal(false);
      setTestWoIdInput("");
    } catch (err: any) {
      showError(err?.message || "Gagal merubah status tanggal Work Order test.");
    } finally {
      setIsMarkingWo(false);
    }
  };

  const insertVariable = (variableTag: string) => {
    if (!activeAutomation) return;
    updateActiveField(
      "messageTemplate",
      activeAutomation.messageTemplate + " " + variableTag
    );
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn text-slate-800">
      {/* Notifications */}
      {saveNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
            <span>{saveNotice}</span>
          </div>
          <button onClick={() => setSaveNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================================================================= */}
        {/* KOLOM KIRI (30%) - DAFTAR ATURAN REMINDER */}
        {/* ================================================================= */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Aturan Reminder
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                {automations.length} aturan terdaftar
              </p>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCreateNewRule}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-emerald-600 text-white shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama aturan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] bg-slate-50/50"
              />
            </div>
          </div>

          {/* List items */}
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#25D366]" />
              <span className="text-xs font-medium">Memuat data rules...</span>
            </div>
          ) : fetchError ? (
            <div className="p-3 text-xs text-rose-600 bg-rose-50 rounded-xl">
              {fetchError}
            </div>
          ) : (
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
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
                          <span className="font-bold text-xs text-slate-900 truncate font-sans">
                            {item.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal truncate">
                          {item.triggerText}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => toggleAutomationActive(item.localId, e)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
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
                );
              })}

              {filteredAutomations.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada aturan reminder.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* KOLOM TENGAH (45%) - EDITOR SETTINGS REMINDER */}
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
                <div className="flex items-center gap-2">
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

              {/* Action Buttons: Save */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveAutomation}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>

            {/* TRIGGER INTERVAL FORM */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Pengaturan Interval Reminder
              </h4>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Interval Hari Setelah Servis Selesai
                  </label>
                  <span className="text-xs font-bold text-emerald-700">
                    {activeAutomation.daysInterval} Hari
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  value={activeAutomation.daysInterval}
                  onChange={(e) =>
                    updateActiveField("daysInterval", Math.max(1, Number(e.target.value)))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
                />
                <p className="text-[11px] text-slate-500">
                  Pengingat akan dievaluasi saat selisih hari tanggal komputasi Work Order mencapai interval ini.
                </p>
              </div>
            </div>

            {/* MESSAGE TEMPLATE EDITOR */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Template Pesan WhatsApp
              </h4>

              <textarea
                rows={7}
                value={activeAutomation.messageTemplate}
                onChange={(e) => updateActiveField("messageTemplate", e.target.value)}
                placeholder="Ketik isi pesan pengingat..."
                className="w-full p-3.5 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
              />

              {/* DYNAMIC VARIABLE CHIPS */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
                  Sisipkan Variabel Dinamis
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "{{customer_name}}",
                    "{{customer_phone}}",
                    "{{vehicle_name}}",
                    "{{vehicle_plate}}",
                    "{{service_date}}",
                    "{{service_name}}",
                    "{{current_km}}",
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
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
            Pilih aturan reminder untuk mengedit.
          </div>
        )}

        {/* ================================================================= */}
        {/* KOLOM KANAN (45%) - REALTIME WHATSAPP PREVIEW */}
        {/* ================================================================= */}
        {activeAutomation && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  Preview WhatsApp Chat
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tampilan realtime pengingat servis.
                </p>
              </div>
            </div>

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
                    {activeAutomation.messageTemplate
                      .replace(/\{\{customer_name\}\}/g, simCustomer.name)
                      .replace(/\{\{customerPhone\}\}/g, simCustomer.phone)
                      .replace(/\{\{vehicle_name\}\}/g, simCustomer.vehicleName)
                      .replace(/\{\{vehicle_plate\}\}/g, simCustomer.vehiclePlate)
                      .replace(/\{\{service_date\}\}/g, simCustomer.lastServiceDate)
                      .replace(/\{\{service_name\}\}/g, "Servis Berkala & Ganti Oli")
                      .replace(/\{\{current_km\}\}/g, simKm.toLocaleString())
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
      {/* MODAL HASIL SIMULASI REMINDER (DRY_RUN MODE) */}
      {/* ========================================================================= */}
      {showSimulationModal && simulationSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => setShowSimulationModal(false)}
          />

          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl p-6 space-y-5 z-10 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 text-amber-400 shrink-0">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-sans">
                      Hasil Simulasi Reminder
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      SIMULASI — Belum Dikirim
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Evaluasi pencarian customer eligible tanpa memanggil Fonnte
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSimulationModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STATS SUMMARY GRID CARDS */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Rules</span>
                <span className="text-base font-extrabold text-slate-800">{simulationSummary.rulesChecked}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">WO Checked</span>
                <span className="text-base font-extrabold text-slate-800">{simulationSummary.workOrdersChecked}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Eligible</span>
                <span className="text-base font-extrabold text-emerald-800">{simulationSummary.eligible}</span>
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[10px] text-blue-800 font-bold uppercase block">Akan Dikirim</span>
                <span className="text-base font-extrabold text-blue-800">{simulationSummary.wouldSend}</span>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-amber-800 font-bold uppercase block">Dilewati</span>
                <span className="text-base font-extrabold text-amber-800">{simulationSummary.skipped}</span>
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[10px] text-rose-800 font-bold uppercase block">Gagal Validasi</span>
                <span className="text-base font-extrabold text-rose-800">{simulationSummary.failedValidation}</span>
              </div>
            </div>

            {/* CANDIDATES ITEMS LIST */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Kandidat Reminder ({simulationSummary.items?.length || 0})
              </h4>

              {simulationSummary.items && simulationSummary.items.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {simulationSummary.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.customerName}</span>
                          <span className="text-slate-400 font-mono text-[11px]">({item.recipientPhone})</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border">
                          WO #{item.workOrderId}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-500">Aturan: </span>
                          <span className="font-bold text-slate-800">{item.templateName}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Jatuh Tempo: </span>
                          <span className="font-bold text-slate-800">
                            {new Date(item.dueDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] leading-relaxed text-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1 font-sans">
                          PREVIEW PESAN FINAL:
                        </span>
                        {item.renderedMessage}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl bg-slate-50">
                  Tidak ada kandidat reminder yang memenuhi syarat saat ini.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowSimulationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
              >
                Tutup Simulasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL HASIL PENGECEKAN MANUAL (LIVE MODE) */}
      {/* ========================================================================= */}
      {showRunModal && runSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => setShowRunModal(false)}
          />

          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4 z-10 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#128C7E]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Hasil Pengecekan Reminder
                  </h3>
                  <p className="text-xs text-slate-500">Evaluasi Reminder Engine Real</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRunModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500 font-medium block">Rules Diperiksa</span>
                <span className="text-base font-bold text-slate-900">{runSummary.rulesChecked}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500 font-medium block">WO Diperiksa</span>
                <span className="text-base font-bold text-slate-900">{runSummary.workOrdersChecked}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-800 font-medium block">Terkirim</span>
                <span className="text-base font-bold text-emerald-800">{runSummary.sent ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-amber-800 font-medium block">Dilewati (Duplikat)</span>
                <span className="text-base font-bold text-amber-800">{runSummary.skipped}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowRunModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
