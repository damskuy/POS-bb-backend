export type NotificationChannel = "WHATSAPP";

export type NotificationStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "FAILED";

export type NotificationCategory =
  | "TEST"
  | "SERVICE_REMINDER"
  | "WORK_ORDER_CREATED"
  | "WORK_ORDER_UPDATED"
  | "WORK_ORDER_COMPLETED"
  | "VEHICLE_READY"
  | "INVOICE_CREATED"
  | "INVOICE"
  | "PAYMENT_RECEIVED"
  | "PAYMENT"
  | "CUSTOM";

export interface NotificationHistoryLog {
  id: string;
  recipientName: string | null;
  recipientPhone: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  message: string;
  status: NotificationStatus;
  provider: string | null;
  providerMessageId: string | null;
  providerResponse: any;
  errorMessage: string | null;
  retryCount: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  totalToday: number;
  sentToday: number;
  pending: number;
  failed: number;
}

export interface NotificationHistoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}
