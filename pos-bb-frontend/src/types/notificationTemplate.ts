export type NotificationCategory =
  | "SERVICE_REMINDER"
  | "WORK_ORDER_CREATED"
  | "WORK_ORDER_UPDATED"
  | "WORK_ORDER_COMPLETED"
  | "VEHICLE_READY"
  | "INVOICE_CREATED"
  | "PAYMENT_RECEIVED"
  | "CUSTOM";

export interface TemplateConditions {
  onlyFromBooking?: boolean;
  operationalHoursOnly?: boolean;
  attachPdfInvoice?: boolean;
  [key: string]: any;
}

export interface NotificationTemplate {
  id: number;
  name: string;
  category: NotificationCategory;
  triggerEvent: string | null;
  message: string;
  targetRecipients: string[];
  deliveryTiming: string;
  delayMinutes: number;
  conditions: TemplateConditions | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type NotificationTemplateInput = Omit<
  NotificationTemplate,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;
