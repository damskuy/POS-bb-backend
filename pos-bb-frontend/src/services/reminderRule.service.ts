import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { ReminderRule, ReminderRuleInput } from "@/types/reminderRule";

export const ReminderRuleService = {
  /**
   * Fetch all active reminder rules.
   */
  getReminderRules: async (): Promise<ReminderRule[]> => {
    const res = await api.get<ApiResponse<ReminderRule[]>>(
      "/api/reminder-rules"
    );
    return res.data ?? [];
  },

  /**
   * Fetch a single reminder rule by ID.
   */
  getReminderRuleById: async (id: number): Promise<ReminderRule> => {
    const res = await api.get<ApiResponse<ReminderRule>>(
      `/api/reminder-rules/${id}`
    );
    if (!res.data) throw new Error("Reminder rule tidak ditemukan");
    return res.data;
  },

  /**
   * Create a new reminder rule.
   */
  createReminderRule: async (data: ReminderRuleInput): Promise<ReminderRule> => {
    const res = await api.post<ApiResponse<ReminderRule>>(
      "/api/reminder-rules",
      data
    );
    if (!res.data) throw new Error("Gagal membuat reminder rule");
    return res.data;
  },

  /**
   * Partially update an existing reminder rule.
   */
  updateReminderRule: async (
    id: number,
    data: Partial<ReminderRuleInput>
  ): Promise<ReminderRule> => {
    const res = await api.patch<ApiResponse<ReminderRule>>(
      `/api/reminder-rules/${id}`,
      data
    );
    if (!res.data) throw new Error("Gagal memperbarui reminder rule");
    return res.data;
  },

  /**
   * Toggle the isActive status of a reminder rule.
   */
  toggleActive: async (
    id: number,
    isActive: boolean
  ): Promise<ReminderRule> => {
    const res = await api.patch<ApiResponse<ReminderRule>>(
      `/api/reminder-rules/${id}`,
      { isActive }
    );
    if (!res.data) throw new Error("Gagal mengubah status reminder rule");
    return res.data;
  },

  /**
   * Soft-delete a reminder rule.
   */
  deleteReminderRule: async (id: number): Promise<ReminderRule> => {
    const res = await api.delete<ApiResponse<ReminderRule>>(
      `/api/reminder-rules/${id}`
    );
    if (!res.data) throw new Error("Gagal menghapus reminder rule");
    return res.data;
  },
};
