import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import {
  NotificationTemplate,
  NotificationTemplateInput,
} from "@/types/notificationTemplate";

export const NotificationTemplateService = {
  /**
   * Fetch all active notification templates.
   */
  getNotificationTemplates: async (): Promise<NotificationTemplate[]> => {
    const res = await api.get<ApiResponse<NotificationTemplate[]>>(
      "/api/notification-templates"
    );
    return res.data ?? [];
  },

  /**
   * Fetch a single notification template by ID.
   */
  getNotificationTemplateById: async (
    id: number
  ): Promise<NotificationTemplate> => {
    const res = await api.get<ApiResponse<NotificationTemplate>>(
      `/api/notification-templates/${id}`
    );
    if (!res.data) throw new Error("Notification template tidak ditemukan");
    return res.data;
  },

  /**
   * Create a new notification template.
   */
  createNotificationTemplate: async (
    data: NotificationTemplateInput
  ): Promise<NotificationTemplate> => {
    const res = await api.post<ApiResponse<NotificationTemplate>>(
      "/api/notification-templates",
      data
    );
    if (!res.data) throw new Error("Gagal membuat notification template");
    return res.data;
  },

  /**
   * Partially update an existing notification template.
   */
  updateNotificationTemplate: async (
    id: number,
    data: Partial<NotificationTemplateInput>
  ): Promise<NotificationTemplate> => {
    const res = await api.patch<ApiResponse<NotificationTemplate>>(
      `/api/notification-templates/${id}`,
      data
    );
    if (!res.data) throw new Error("Gagal memperbarui notification template");
    return res.data;
  },

  /**
   * Toggle the isActive status of a notification template.
   */
  toggleActive: async (
    id: number,
    isActive: boolean
  ): Promise<NotificationTemplate> => {
    const res = await api.patch<ApiResponse<NotificationTemplate>>(
      `/api/notification-templates/${id}`,
      { isActive }
    );
    if (!res.data) throw new Error("Gagal mengubah status notification template");
    return res.data;
  },

  /**
   * Soft-delete a notification template.
   */
  deleteNotificationTemplate: async (
    id: number
  ): Promise<NotificationTemplate> => {
    const res = await api.delete<ApiResponse<NotificationTemplate>>(
      `/api/notification-templates/${id}`
    );
    if (!res.data) throw new Error("Gagal menghapus notification template");
    return res.data;
  },

  /**
   * Preview a notification template with real data context.
   */
  previewTemplate: async (
    id: number,
    payload: { customerId?: number; workOrderId?: number; variables?: Record<string, string> }
  ): Promise<{
    templateId: number;
    templateName: string;
    category: string;
    recipientName: string;
    recipientPhone: string;
    renderedMessage: string;
  }> => {
    const res = await api.post<ApiResponse<any>>(
      `/api/notification-templates/${id}/preview`,
      payload
    );
    if (!res.data) throw new Error("Gagal mengambil preview template");
    return res.data;
  },

  /**
   * Send a notification template to a real target via Fonnte Provider.
   */
  sendTemplate: async (
    id: number,
    payload: {
      customerId?: number;
      workOrderId?: number;
      phone?: string;
      recipientName?: string;
      variables?: Record<string, string>;
    }
  ): Promise<{
    sent: boolean;
    historyId: string;
    recipientName: string;
    recipientPhone: string;
    message: string;
  }> => {
    const res = await api.post<ApiResponse<any>>(
      `/api/notification-templates/${id}/send`,
      payload
    );
    if (!res.data) throw new Error("Gagal mengirim WhatsApp template");
    return res.data;
  },
};
