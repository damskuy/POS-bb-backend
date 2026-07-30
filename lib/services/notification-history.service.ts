import { prisma } from "@/lib/prisma";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationCategory,
  Prisma,
} from "@prisma/client";
import { defaultNotificationService } from "@/lib/notifications/notification.service";

export interface CreateHistoryInput {
  recipientName?: string | null;
  recipientPhone: string;
  channel?: NotificationChannel;
  category: NotificationCategory;
  message: string;
  status?: NotificationStatus;
  provider?: string;
}

export interface GetHistoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: NotificationStatus | string;
  category?: NotificationCategory | string;
  startDate?: string;
  endDate?: string;
}

export class NotificationHistoryService {
  /**
   * Create an initial notification history record.
   */
  static async createHistory(input: CreateHistoryInput) {
    return prisma.notificationHistory.create({
      data: {
        recipientName: input.recipientName || null,
        recipientPhone: input.recipientPhone,
        channel: input.channel || NotificationChannel.WHATSAPP,
        category: input.category,
        message: input.message,
        status: input.status || NotificationStatus.PENDING,
        provider: input.provider || "fonnte",
      },
    });
  }

  /**
   * Update notification status to PROCESSING.
   */
  static async markProcessing(id: string) {
    return prisma.notificationHistory.update({
      where: { id },
      data: {
        status: NotificationStatus.PROCESSING,
      },
    });
  }

  /**
   * Update notification status to SENT.
   */
  static async markSent(
    id: string,
    providerMessageId?: string,
    providerResponse?: any
  ) {
    return prisma.notificationHistory.update({
      where: { id },
      data: {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        providerMessageId: providerMessageId || null,
        providerResponse: providerResponse ? providerResponse : Prisma.JsonNull,
      },
    });
  }

  /**
   * Update notification status to FAILED.
   */
  static async markFailed(
    id: string,
    errorMessage: string,
    providerResponse?: any
  ) {
    return prisma.notificationHistory.update({
      where: { id },
      data: {
        status: NotificationStatus.FAILED,
        errorMessage: errorMessage || "Unknown error",
        providerResponse: providerResponse ? providerResponse : Prisma.JsonNull,
      },
    });
  }

  /**
   * Fetch paginated notification history logs with filters.
   */
  static async getHistory(query: GetHistoryQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationHistoryWhereInput = {};

    // Filter by Status
    if (query.status && query.status !== "all" && query.status !== "ALL") {
      const upperStatus = query.status.toUpperCase();
      if (
        Object.values(NotificationStatus).includes(
          upperStatus as NotificationStatus
        )
      ) {
        where.status = upperStatus as NotificationStatus;
      }
    }

    // Filter by Category
    if (query.category && query.category !== "all" && query.category !== "ALL") {
      const upperCategory = query.category.toUpperCase();
      if (
        Object.values(NotificationCategory).includes(
          upperCategory as NotificationCategory
        )
      ) {
        where.category = upperCategory as NotificationCategory;
      }
    }

    // Search query across recipientName, recipientPhone, and message
    if (query.search && query.search.trim() !== "") {
      const searchTerm = query.search.trim();
      where.OR = [
        { recipientName: { contains: searchTerm, mode: "insensitive" } },
        { recipientPhone: { contains: searchTerm, mode: "insensitive" } },
        { message: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    // Date range filtering
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [data, total] = await Promise.all([
      prisma.notificationHistory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notificationHistory.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Fetch single notification history by ID.
   */
  static async getHistoryById(id: string) {
    return prisma.notificationHistory.findUnique({
      where: { id },
    });
  }

  /**
   * Get real-time notification statistics from database.
   */
  static async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalToday, sentToday, pending, failed] = await Promise.all([
      prisma.notificationHistory.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),
      prisma.notificationHistory.count({
        where: {
          createdAt: { gte: todayStart },
          status: { in: [NotificationStatus.SENT, NotificationStatus.DELIVERED] },
        },
      }),
      prisma.notificationHistory.count({
        where: {
          status: { in: [NotificationStatus.PENDING, NotificationStatus.PROCESSING] },
        },
      }),
      prisma.notificationHistory.count({
        where: {
          status: NotificationStatus.FAILED,
        },
      }),
    ]);

    return {
      totalToday,
      sentToday,
      pending,
      failed,
    };
  }

  /**
   * Retry sending a failed notification.
   */
  static async retryNotification(id: string) {
    const existing = await prisma.notificationHistory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Log notifikasi tidak ditemukan");
    }

    if (existing.status !== NotificationStatus.FAILED) {
      throw new Error("Hanya notifikasi dengan status FAILED yang dapat dikirim ulang");
    }

    // Increment retry count & update status to PROCESSING
    await prisma.notificationHistory.update({
      where: { id },
      data: {
        retryCount: existing.retryCount + 1,
        status: NotificationStatus.PROCESSING,
        errorMessage: null,
      },
    });

    // Send via Fonnte Provider
    const result = await defaultNotificationService.sendText({
      phone: existing.recipientPhone,
      message: existing.message,
    });

    if (result.success) {
      return prisma.notificationHistory.update({
        where: { id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          providerMessageId: result.messageId || null,
          providerResponse: result as any,
          errorMessage: null,
        },
      });
    } else {
      return prisma.notificationHistory.update({
        where: { id },
        data: {
          status: NotificationStatus.FAILED,
          errorMessage: result.error || "Gagal pada percobaan kirim ulang",
          providerResponse: result as any,
        },
      });
    }
  }
}
