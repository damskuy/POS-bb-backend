import { api } from "@/lib/api";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import {
  NotificationHistoryLog,
  NotificationStats,
  NotificationHistoryQuery,
} from "@/types/notificationHistory";

export const NotificationHistoryService = {
  /**
   * Fetch paginated notification history logs with query filters.
   */
  getHistory: async (
    query: NotificationHistoryQuery = {}
  ): Promise<PaginatedResponse<NotificationHistoryLog>> => {
    const res = await api.get<PaginatedResponse<NotificationHistoryLog>>(
      "/api/notifications/history",
      {
        params: {
          page: query.page,
          limit: query.limit,
          search: query.search,
          status: query.status,
          category: query.category,
          startDate: query.startDate,
          endDate: query.endDate,
        },
      }
    );
    return res;
  },

  /**
   * Fetch real-time notification statistics.
   */
  getStats: async (): Promise<NotificationStats> => {
    const res = await api.get<ApiResponse<NotificationStats>>(
      "/api/notifications/history/stats"
    );
    return (
      res.data ?? {
        totalToday: 0,
        sentToday: 0,
        pending: 0,
        failed: 0,
      }
    );
  },

  /**
   * Fetch single notification history detail by ID.
   */
  getHistoryById: async (id: string): Promise<NotificationHistoryLog> => {
    const res = await api.get<ApiResponse<NotificationHistoryLog>>(
      `/api/notifications/history/${id}`
    );
    if (!res.data) throw new Error("Log notifikasi tidak ditemukan");
    return res.data;
  },

  /**
   * Retry sending a failed notification.
   */
  retryNotification: async (id: string): Promise<NotificationHistoryLog> => {
    const res = await api.post<ApiResponse<NotificationHistoryLog>>(
      `/api/notifications/history/${id}/retry`
    );
    if (!res.data) throw new Error("Gagal mengirim ulang notifikasi");
    return res.data;
  },

  /**
   * Send test WhatsApp message to POST /api/notifications/test
   */
  sendTestNotification: async (
    phone: string,
    message?: string
  ): Promise<{ success: boolean; provider?: string; historyId?: string; error?: string }> => {
    const res = await api.post<{ success: boolean; provider?: string; historyId?: string; error?: string }>(
      "/api/notifications/test",
      {
        phone,
        message: message || "Pesan uji coba WhatsApp dari POS Bengkel Baik",
        recipientName: "Target Uji Coba",
      }
    );
    return res;
  },
};
