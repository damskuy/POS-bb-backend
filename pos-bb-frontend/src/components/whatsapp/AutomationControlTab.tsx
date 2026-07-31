"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FilePlus2,
  Wrench,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Zap,
  Loader2,
  Lock,
  Plus,
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

const TRIGGER_SHORT_DESC: Record<NotificationTrigger, string> = {
  WORK_ORDER_CREATED: "Pesan otomatis saat Work Order dibuat.",
  WORK_ORDER_IN_PROGRESS: "Pesan otomatis saat pengerjaan dimulai.",
  WORK_ORDER_COMPLETED: "Pesan otomatis saat pekerjaan selesai.",
};

const TRIGGER_CATEGORY_MAP: Record<NotificationTrigger, string> = {
  WORK_ORDER_CREATED: "WORK_ORDER_CREATED",
  WORK_ORDER_IN_PROGRESS: "WORK_ORDER_IN_PROGRESS",
  WORK_ORDER_COMPLETED: "WORK_ORDER_COMPLETED",
};

const CAN_EDIT_ROLES = ["OWNER", "ADMIN"];

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type ConfigStatus = "ready" | "no_template" | "disabled" | "template_missing";

interface LocalAutomationState {
  selectedTemplateId: string;
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

const StatusLine: React.FC<{ status: ConfigStatus }> = ({ status }) => {
  switch (status) {
    case "ready":
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Siap digunakan
        </span>
      );
    case "disabled":
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
          Automation nonaktif
        </span>
      );
    case "no_template":
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
          <AlertCircle className="w-3 h-3 shrink-0" />
          Template belum dipilih
        </span>
      );
    case "template_missing":
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
          <AlertCircle className="w-3 h-3 shrink-0" />
          Template tidak tersedia
        </span>
      );
  }
};

function TriggerIcon({ trigger }: { trigger: NotificationTrigger }) {
  const base = "w-4.5 h-4.5 shrink-0";
  const style = { width: "18px", height: "18px" };
  switch (trigger) {
    case "WORK_ORDER_CREATED":
      return <FilePlus2 className={base} style={style} />;
    case "WORK_ORDER_IN_PROGRESS":
      return <Wrench className={base} style={style} />;
    case "WORK_ORDER_COMPLETED":
      return <CheckCircle2 className={base} style={style} />;
  }
}

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
      className={`inline-block transform rounded-full bg-white shadow-md transition-transform duration-200 ${
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

const AutomationCardSkeleton: React.FC = () => (
  <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-4 animate-pulse space-y-3">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-100 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-4 bg-slate-200 rounded-lg w-36" />
          <div className="h-3 bg-slate-100 rounded-lg w-52" />
        </div>
      </div>
      <div className="w-11 h-6 rounded-full bg-slate-200 shrink-0" />
    </div>
    <div className="space-y-1.5">
      <div className="h-3 bg-slate-100 rounded w-16" />
      <div className="h-9 bg-slate-100 rounded-xl w-full" />
    </div>
    <div className="h-3 bg-slate-100 rounded w-28" />
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

      const sorted = [...fetchedAutomations].sort(
        (a, b) =>
          TRIGGER_ORDER.indexOf(a.trigger) - TRIGGER_ORDER.indexOf(b.trigger)
      );

      setAutomations(sorted);
      setAllTemplates(fetchedTemplates);

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

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="px-5 py-3.5 bg-white rounded-2xl border border-slate-200/80 animate-pulse space-y-2">
          <div className="h-4 bg-slate-200 rounded-lg w-48" />
          <div className="h-3 bg-slate-100 rounded-lg w-72" />
        </div>
        {[0, 1, 2].map((i) => (
          <AutomationCardSkeleton key={i} />
        ))}
      </div>
    );
  }

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
    <div className="space-y-3 font-sans">
      {/* ── Header ── */}
      <div className="px-5 py-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#25D366]/10 flex items-center justify-center shrink-0">
              <Zap className="text-[#25D366]" style={{ width: "16px", height: "16px" }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">Automation Control</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Atur pesan WhatsApp otomatis untuk setiap tahap Work Order.
              </p>
            </div>
          </div>

          {!canEdit && (
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold shrink-0">
              <Lock className="w-3 h-3" />
              Read-only
            </span>
          )}
        </div>
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
        const hasNoTemplates = templateOptions.length === 0;

        const configStatus = getConfigStatus({
          ...automation,
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

        const iconBg =
          automation.trigger === "WORK_ORDER_CREATED"
            ? "bg-blue-50 text-blue-500"
            : automation.trigger === "WORK_ORDER_IN_PROGRESS"
            ? "bg-amber-50 text-amber-500"
            : "bg-emerald-50 text-emerald-500";

        return (
          <div
            key={automation.id}
            className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs transition-shadow hover:shadow-sm"
          >
            <div className="px-5 py-4 space-y-3">
              {/* ── Row 1: Icon + Name + Toggle ── */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
                  >
                    <TriggerIcon trigger={automation.trigger} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-slate-900 truncate">
                      {TRIGGER_LABEL[automation.trigger]}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {TRIGGER_SHORT_DESC[automation.trigger]}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={automation.isEnabled}
                  loading={local.isToggling}
                  disabled={!canEdit}
                  onToggle={() => handleToggle(automation)}
                  label={`Toggle ${TRIGGER_LABEL[automation.trigger]}`}
                />
              </div>

              {/* ── Row 2: Template selector ── */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Template
                </label>

                {hasNoTemplates ? (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-400 italic">
                      Belum ada template tersedia.
                    </span>
                    {onNavigateToTemplates && (
                      <button
                        type="button"
                        onClick={onNavigateToTemplates}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#25D366] hover:text-emerald-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Buat Template
                      </button>
                    )}
                  </div>
                ) : (
                  <CustomSelect
                    value={local.selectedTemplateId}
                    onChange={(val) => handleTemplateChange(automation.id, val)}
                    options={templateOptions}
                    placeholder="+ Pilih template"
                    disabled={!canEdit}
                    className="w-full"
                    buttonClassName="w-full py-2 text-xs"
                  />
                )}
              </div>

              {/* ── Row 3: Status + Save ── */}
              <div className="flex items-center justify-between gap-3">
                <StatusLine status={configStatus} />

                {canEdit && local.isDirty && (
                  <button
                    type="button"
                    onClick={() => handleSave(automation)}
                    disabled={local.isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-emerald-600 text-white text-[11px] font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                  >
                    {local.isSaving ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        Simpan
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
