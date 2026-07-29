import { z } from "zod";

export const reminderRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().nullable().optional(),
  category: z.enum(["SERVIS", "PERAWATAN", "BAN", "KELISTRIKAN", "REM"]),
  triggerType: z.enum(["DAYS", "KM", "BOTH"]),
  daysInterval: z.number().int().positive().nullable().optional(),
  kmInterval: z.number().int().positive().nullable().optional(),
  messageTemplate: z.string().min(1, "Message template is required"),
  sendTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").default("09:00"),
  timezone: z.string().default("Asia/Jakarta"),
  sendDays: z.string().default("Senin - Sabtu"),
  skipHolidays: z.boolean().default(true),
  retryOnFailure: z.boolean().default(true),
  isActive: z.boolean().default(true),
});
