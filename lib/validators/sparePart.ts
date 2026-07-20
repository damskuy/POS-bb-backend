import { z } from "zod";

export const sparePartSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  sku: z.string().min(3, "SKU must be at least 3 characters").nullable().optional(),
  stock: z.number().int().nonnegative("Stock cannot be negative").optional(),
  price: z.number().int().nonnegative("Price cannot be negative").optional(),
});
