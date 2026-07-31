import { z } from "zod";

export const updateNotificationAutomationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama automation minimal 2 karakter")
    .max(100, "Nama automation maksimal 100 karakter")
    .optional(),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter")
    .nullable()
    .optional(),
  isEnabled: z.boolean().optional(),
  templateId: z.number().int().positive("templateId harus berupa integer positif").nullable().optional(),
});

export const toggleNotificationAutomationSchema = z.object({
  isEnabled: z.boolean({ message: "Status isEnabled wajib diisi dan harus berupa boolean" }),
});

export type UpdateNotificationAutomationInput = z.infer<
  typeof updateNotificationAutomationSchema
>;

export type ToggleNotificationAutomationInput = z.infer<
  typeof toggleNotificationAutomationSchema
>;
