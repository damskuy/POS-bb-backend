"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FilePlus2,
  Wrench,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Zap,
  FileText,
  ChevronRight,
  Loader2,
  Info,
  Lock,
} from "lucide-react";
import { CustomSelect, CustomSelectOption } from "../common/CustomSelect";
import { useToast } from "@/components/common/Toast";
import { useAuthContext } from "@/context/AuthContext";
import { NotificationAutomation, NotificationTrigger } from "@/types/notificationAutomation";
import { NotificationTemplate } from "@/types/notificationTemplate";
import { NotificationAutomationService } from "@/services/notificationAutomation.service";
import { NotificationTemplateService } from "@/services/notificationTemplate.service";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const TRIGGER_ORDER: NotificationTrigger[] = [
  "WORK_ORDER_CREATED",
  "WORK_ORDER_IN_PROGRESS",
  "WORK_ORDER_COMPLETED",
];

const TRIGGER_LABEL: Record<NotificationTrigger, string> = {
  WORK_ORDER_CREATED: "Work Order Dibuat",
  WORK_ORDER_IN_PROGRESS: "Pengerjaan Dimulai",
  WORK_ORDER_COMPLETED: "Pekerjaan Selesai",
};

const TRIGGER_DESCRIPTION: Record<NotificationTrigger, string> = {
  WORK_ORDER_CREATED:
    "Kirim notifikasi WhatsApp saat Work Order baru dibuat oleh bengkel.",
  WORK_ORDER_IN_PROGRESS:
    "Kirim notifikasi WhatsApp saat teknisi mulai mengerjakan kendaraan.",
  WORK_ORDER_COMPLETED:
    "Kirim notifikasi WhatsApp saat pekerjaan servis telah selesai.",
};

// Trigger matched to template category for filtering
const TRIGGER_CATEGORY_MAP: Record<NotificationTrigger, string> = {
  WORK_ORDER_CREATED: "WORK_ORDER_CREATED",
  WORK_ORDER_IN_PROGRESS: "WORK_ORDER_IN_PROGRESS",
  WORK_ORDER_COMPLETED: "WORK_ORDER_COMPLETED",
};

// Role access control
const CAN_EDIT_ROLES = ["OWNER", "ADMIN"];

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type ConfigStatus =
  | "ready"
  | "no_template"
  | "disabled"
  | "template_missing";

interface LocalAutomationState {
  selectedTemplateId: string; // "" = no selection
  isDirty: boolean;
  isSaving: boolean;
  isToggling: boolean;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getConfigStatus(automation: NotificationAutomation): ConfigStatus {
  if (!automation.isEnabled) return "disabled";
  if (automation.templateId === null) return "no_template";
  if (automation.template === null) return "template_missing";
  return "ready";
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

interface ConfigStatusBadgeProps {
  status: ConfigStatus;
}

const ConfigStatusBadge: React.FC<ConfigStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case "ready":
      return (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-800">Siap digunakan</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Automation aktif dan template sudah dikonfigurasi.
            </p>
          </div>
        </div>
      );
    case "no_template":
      return (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/80">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800">Template belum dipilih</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Pilih template agar automation dapat digunakan.
            </p>
          </div>
        </div>
      );
    case "disabled":
      return (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-700">Automation nonaktif</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Aktifkan automation untuk menjalankan pesan otomatis.
            </p>
          </div>
        </div>
      );
    case "template_missing":
      return (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200/80">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-rose-800">Template tidak tersedia</p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Template yang sebelumnya terhubung tidak ditemukan. Pilih template lain.
            </p>
          </div>
        </div>
      );
  }
};

// Icon per trigger
function TriggerIcon({ trigger }: { trigger: NotificationTrigger }) {
  const base = "w-5 h-5 shrink-0";
  switch (trigger) {
    case "WORK_ORDER_CREATED":
      return <FilePlus2 className={`${base} text-blue-500`} />;
    case "WORK_ORDER_IN_PROGRESS":
      return <Wrench className={`${base} text-amber-500`} />;
    case "WORK_ORDER_COMPLETED":
      return <CheckCircle2 className={`${base} text-emerald-500`} />;
  }
}

// CSS Toggle switch component
interface ToggleSwitchProps {
  enabled: boolean;
  loading: boolean;
  disabled: boolean;
  onToggle: () => void;
  label: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  loading,
  disabled,
  onToggle,
  label,
}) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled || loading}
    aria-label={label}
    aria-pressed={enabled}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60 ${
      enabled ? "bg-[#25D366]" : "bg-slate-300"
    } ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
        enabled ? "translate-x-5" : "translate-x-1"
      } ${loading ? "animate-pulse" : ""}`}
      style={{ width: "18px", height: "18px" }}
    />
    {loading && (
      <span className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
      </span>
    )}
  </button>
);

// Skeleton card for loading state
const AutomationCardSkeleton: React.FC = () => (
  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 animate-pulse">
    {/* Header */}
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded-lg w-40" />
          <div className="h-3 bg-slate-100 rounded-lg w-60" />
        </div>
      </div>
      <div className="w-11 h-6 rounded-full bg-slate-200 shrink-0" />
    </div>
    {/* Template row */}
    <div className="space-y-2 pt-1">
      <div className="h-3 bg-slate-100 rounded w-28" />
      <div className="h-9 bg-slate-100 rounded-xl w-full" />
    </div>
    {/* Status badge */}
    <div className="h-10 bg-slate-50 rounded-xl border border-slate-100" />
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

interface AutomationControlTabProps {
  onNavigateToTemplates?: () => void;
}

export const AutomationControlTab: React.FC<AutomationControlTabProps> = ({
  onNavigateToTemplates,
}) => {
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const canEdit = user ? CAN_EDIT_ROLES.includes(user.role) : false;

  // ── Data states ──
  const [automations, setAutomations] = useState<NotificationAutomation[]>([]);
  const [allTemplates, setAllTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Per-card local states (keyed by automation.id) ──
  const [localState, setLocalState] = useState<Record<number, LocalAutomationState>>({});

  // ─────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedAutomations, fetchedTemplates] = await Promise.all([
        NotificationAutomationService.getAll(),
        NotificationTemplateService.getNotificationTemplates(),
      ]);

      // Sort by defined trigger order
      const sorted = [...fetchedAutomations].sort(
        (a, b) =>
          TRIGGER_ORDER.indexOf(a.trigger) - TRIGGER_ORDER.indexOf(b.trigger)
      );

      setAutomations(sorted);
      setAllTemplates(fetchedTemplates);

      // Initialize local state per automation (only on first load)
      setLocalState((prev) => {
        const next: Record<number, LocalAutomationState> = { ...prev };
        for (const auto of sorted) {
          if (next[auto.id] === undefined) {
            next[auto.id] = {
              selectedTemplateId: auto.templateId ? String(auto.templateId) : "",
              isDirty: false,
              isSaving: false,
              isToggling: false,
            };
          }
        }
        return next;
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal memuat Automation Control.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─────────────────────────────────────────────
  // LOCAL STATE HELPERS
  // ─────────────────────────────────────────────

  const patchLocal = (id: number, patch: Partial<LocalAutomationState>) => {
    setLocalState((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────

  const handleToggle = async (automation: NotificationAutomation) => {
    if (!canEdit) return;
    const { id, isEnabled } = automation;
    const newEnabled = !isEnabled;

    patchLocal(id, { isToggling: true });

    // Optimistic update
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isEnabled: newEnabled } : a))
    );

    try {
      const updated = await NotificationAutomationService.toggle(id, newEnabled);
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...updated } : a))
      );
      showToast(
        newEnabled
          ? `Automation "${automation.name}" berhasil diaktifkan.`
          : `Automation "${automation.name}" berhasil dinonaktifkan.`,
        "success"
      );
    } catch (err: any) {
      // Revert optimistic update
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isEnabled } : a))
      );
      showToast(
        "Gagal mengubah status automation. Silakan coba lagi.",
        "error"
      );
    } finally {
      patchLocal(id, { isToggling: false });
    }
  };

  const handleTemplateChange = (automationId: number, templateId: string) => {
    const automation = automations.find((a) => a.id === automationId);
    if (!automation) return;

    const originalId = automation.templateId ? String(automation.templateId) : "";
    const isDirty = templateId !== originalId;

    patchLocal(automationId, { selectedTemplateId: templateId, isDirty });
  };

  const handleSave = async (automation: NotificationAutomation) => {
    const { id } = automation;
    const local = localState[id];
    if (!local || !local.isDirty) return;

    patchLocal(id, { isSaving: true });

    const newTemplateId = local.selectedTemplateId
      ? parseInt(local.selectedTemplateId, 10)
      : null;

    try {
      const updated = await NotificationAutomationService.update(id, {
        templateId: newTemplateId,
      });
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...updated } : a))
      );
      patchLocal(id, {
        selectedTemplateId: updated.templateId ? String(updated.templateId) : "",
        isDirty: false,
      });
      showToast("Template automation berhasil diperbarui.", "success");
    } catch (err: any) {
      // Keep dirty state so user doesn't lose their choice
      showToast("Gagal menyimpan template. Silakan coba lagi.", "error");
    } finally {
      patchLocal(id, { isSaving: false });
    }
  };

  // ─────────────────────────────────────────────
  // TEMPLATE OPTIONS PER TRIGGER
  // ─────────────────────────────────────────────

  const getTemplateOptions = (trigger: NotificationTrigger): CustomSelectOption[] => {
    const category = TRIGGER_CATEGORY_MAP[trigger];
    const filtered = allTemplates.filter(
      (t) => t.category === category && t.deletedAt === null
    );
    return filtered.map((t) => ({ value: String(t.id), label: t.name }));
  };

  // ─────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Page header skeleton */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 animate-pulse space-y-3">
          <div className="h-5 bg-slate-200 rounded-lg w-64" />
          <div className="h-3 bg-slate-100 rounded-lg w-80" />
        </div>
        {[0, 1, 2].map((i) => (
          <AutomationCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error
  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-rose-600" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">Gagal memuat Automation Control</p>
          <p className="text-slate-500 text-xs mt-1 max-w-xs">{errorMsg}</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // Empty
  if (automations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center">
          <Zap className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">
            Belum ada automation yang dikonfigurasi.
          </p>
          <p className="text-slate-500 text-xs mt-1 max-w-xs">
            Automation akan muncul setelah konfigurasi tersedia di sistem.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Muat Ulang
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="space-y-4 font-sans">
      {/* ── Page Header Info ── */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-4.5 h-4.5 text-[#25D366]" style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Automation Control</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Kelola pesan WhatsApp otomatis berdasarkan perubahan status Work Order.
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
              <Info className="w-3 h-3 shrink-0" />
              Pesan hanya dikirim jika automation aktif dan template sudah dikonfigurasi.
            </p>
          </div>
        </div>

        {/* Read-only notice for non-editor roles */}
        {!canEdit && (
          <div className="mt-3.5 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-[11px] text-slate-500 font-semibold">
              Hanya Owner atau Admin yang dapat mengubah Automation Control.
            </p>
          </div>
        )}
      </div>

      {/* ── Automation Cards ── */}
      {automations.map((automation) => {
        const local = localState[automation.id] ?? {
          selectedTemplateId: automation.templateId
            ? String(automation.templateId)
            : "",
          isDirty: false,
          isSaving: false,
          isToggling: false,
        };

        const templateOptions = getTemplateOptions(automation.trigger);
        const hasNoTemplatesForTrigger = templateOptions.length === 0;

        const configStatus = getConfigStatus({
          ...automation,
          // Reflect local selection in status calculation
          templateId: local.selectedTemplateId
            ? parseInt(local.selectedTemplateId, 10)
            : null,
          template:
            local.selectedTemplateId && !local.isDirty
              ? automation.template
              : local.selectedTemplateId
              ? ({ id: parseInt(local.selectedTemplateId, 10), name: "", category: "", message: "" })
              : null,
        });

        return (
          <div
            key={automation.id}
            className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs transition-shadow hover:shadow-sm"
          >
            <div className="p-5 space-y-4">
              {/* ── Card Header ── */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      automation.trigger === "WORK_ORDER_CREATED"
                        ? "bg-blue-50"
                        : automation.trigger === "WORK_ORDER_IN_PROGRESS"
                        ? "bg-amber-50"
                        : "bg-emerald-50"
                    }`}
                  >
                    <TriggerIcon trigger={automation.trigger} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {TRIGGER_LABEL[automation.trigger]}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {automation.description ?? TRIGGER_DESCRIPTION[automation.trigger]}
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <ToggleSwitch
                    enabled={automation.isEnabled}
                    loading={local.isToggling}
                    disabled={!canEdit}
                    onToggle={() => handleToggle(automation)}
                    label={`Toggle ${TRIGGER_LABEL[automation.trigger]}`}
                  />
                  <span
                    className={`text-[10px] font-bold ${
                      automation.isEnabled ? "text-[#25D366]" : "text-slate-400"
                    }`}
                  >
                    {automation.isEnabled ? "ON" : "OFF"}
                  </span>
                </div>
              </div>

              {/* ── Template Selector ── */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-slate-400" />
                  Template Pesan
                </label>

                {hasNoTemplatesForTrigger ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                    <span className="text-xs text-slate-400 italic">
                      Belum ada template yang sesuai.
                    </span>
                    {onNavigateToTemplates && (
                      <button
                        type="button"
                        onClick={onNavigateToTemplates}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#25D366] hover:text-emerald-700 transition-colors"
                      >
                        Kelola Template
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <CustomSelect
                    value={local.selectedTemplateId}
                    onChange={(val) => handleTemplateChange(automation.id, val)}
                    options={templateOptions}
                    placeholder="Pilih template..."
                    disabled={!canEdit}
                    className="w-full"
                    buttonClassName="w-full py-2.5 text-xs"
                  />
                )}

                {/* Current template indicator */}
                {!local.isDirty && automation.template && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    Terhubung ke:{" "}
                    <span className="font-semibold text-slate-600">
                      {automation.template.name}
                    </span>
                  </p>
                )}
              </div>

              {/* ── Config Status Badge ── */}
              <ConfigStatusBadge status={configStatus} />

              {/* ── Save Button (only for editors when dirty) ── */}
              {canEdit && local.isDirty && (
                <button
                  type="button"
                  onClick={() => handleSave(automation)}
                  disabled={local.isSaving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {local.isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
