import { z } from "zod";

export const notificationCategoryEnum = z.enum([
  "SERVICE_REMINDER",
  "WORK_ORDER_CREATED",
  "WORK_ORDER_UPDATED",
  "WORK_ORDER_COMPLETED",
  "VEHICLE_READY",
  "INVOICE_CREATED",
  "PAYMENT_RECEIVED",
  "CUSTOM",
]);

export const notificationTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama template wajib diisi")
    .max(100, "Nama template maksimal 100 karakter"),
  category: notificationCategoryEnum.default("CUSTOM"),
  triggerEvent: z.string().optional(),
  message: z.string().trim().min(1, "Isi pesan WhatsApp wajib diisi"),
  targetRecipients: z.array(z.string()).default(["customer"]),
  deliveryTiming: z.string().default("direct"),
  delayMinutes: z.number().int().nonnegative().default(0),
  conditions: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().default(true),
});

export type NotificationTemplateInput = z.infer<
  typeof notificationTemplateSchema
>;
