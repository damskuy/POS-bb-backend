import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import {
  NotificationAutomation,
  NotificationAutomationUpdateInput,
} from "@/types/notificationAutomation";

export const NotificationAutomationService = {
  /**
   * Fetch all notification automations (includes linked templates).
   */
  getAll: async (): Promise<NotificationAutomation[]> => {
    const res = await api.get<ApiResponse<NotificationAutomation[]>>(
      "/api/notifications/automations"
    );
    return res.data ?? [];
  },

  /**
   * Fetch a single notification automation by ID.
   */
  getById: async (id: number): Promise<NotificationAutomation> => {
    const res = await api.get<ApiResponse<NotificationAutomation>>(
      `/api/notifications/automations/${id}`
    );
    if (!res.data) throw new Error("Automation tidak ditemukan");
    return res.data;
  },

  /**
   * Update automation fields (name, description, isEnabled, templateId).
   */
  update: async (
    id: number,
    data: NotificationAutomationUpdateInput
  ): Promise<NotificationAutomation> => {
    const res = await api.patch<ApiResponse<NotificationAutomation>>(
      `/api/notifications/automations/${id}`,
      data
    );
    if (!res.data) throw new Error("Gagal memperbarui automation");
    return res.data;
  },

  /**
   * Toggle automation isEnabled status.
   */
  toggle: async (
    id: number,
    isEnabled: boolean
  ): Promise<NotificationAutomation> => {
    const res = await api.patch<ApiResponse<NotificationAutomation>>(
      `/api/notifications/automations/${id}/toggle`,
      { isEnabled }
    );
    if (!res.data) throw new Error("Gagal mengubah status automation");
    return res.data;
  },
};
