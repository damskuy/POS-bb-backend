import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";

export interface DryRunItem {
  workOrderId: number;
  customerName: string;
  recipientPhone: string;
  templateName: string;
  dueDate: string;
  renderedMessage: string;
  reason?: string;
}

export interface ReminderRunSummary {
  rulesChecked: number;
  workOrdersChecked: number;
  eligible: number;
  wouldSend: number;
  skipped: number;
  failedValidation: number;
  items: DryRunItem[];
  sent?: number;
  failed?: number;
  customersEligible?: number;
}

export interface ReminderRunResponse {
  success: boolean;
  mode: "DRY_RUN" | "LIVE";
  data: ReminderRunSummary;
}

export const ReminderRunService = {
  /**
   * Trigger manual evaluation run for active reminder rules.
   * Options mode: "DRY_RUN" (default, no Fonnte HTTP call) or "LIVE"
   */
  runReminders: async (payload: { mode?: "DRY_RUN" | "LIVE" } = {}): Promise<ReminderRunResponse> => {
    const res = await api.post<ApiResponse<ReminderRunResponse>>(
      "/api/notifications/reminders/run",
      payload
    );
    if (!res.data) throw new Error("Gagal menjalankan evaluasi reminder");
    return res.data;
  },

  /**
   * Legacy method for backward compatibility
   */
  runRemindersManual: async (): Promise<ReminderRunSummary> => {
    const res = await ReminderRunService.runReminders({ mode: "LIVE" });
    return res.data;
  },

  /**
   * Test utility to mark a specific WorkOrder finishedAt date to 1 day ago so it becomes eligible.
   */
  markWoEligibleForTest: async (workOrderId: number): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(
      "/api/notifications/reminders/test/mark-eligible",
      { workOrderId }
    );
    if (!res.data) throw new Error("Gagal mengubah status Work Order");
    return res.data;
  },
};
