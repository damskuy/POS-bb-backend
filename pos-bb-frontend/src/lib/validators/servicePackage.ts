import { z } from "zod";

export const servicePackageSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  price: z.number().int().nonnegative("Price cannot be negative").optional(),
  description: z.string().nullable().optional(),
});
