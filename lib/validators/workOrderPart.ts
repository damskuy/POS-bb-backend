import { z } from "zod";

export const workOrderPartSchema = z.object({
  workOrderId: z.number().int().positive("Invalid Work Order ID"),
  sparePartId: z.number().int().positive("Invalid Spare Part ID"),
  price: z.number().int().nonnegative("Price must be non-negative"),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
  subtotal: z.number().int().nonnegative().optional(),
});
