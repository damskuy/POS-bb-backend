import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(3),
  phone: z.string().min(8),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});