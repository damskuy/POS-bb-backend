import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  price: z.number().int().nonnegative("Price must be a non-negative integer"),
  description: z.string().nullable().optional(),
});
