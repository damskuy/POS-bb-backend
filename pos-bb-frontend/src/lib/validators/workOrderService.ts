import { z } from "zod";

export const workOrderServiceSchema = z.object({
  workOrderId: z.number().int().positive("Invalid Work Order ID"),
  serviceId: z.number().int().positive("Invalid Service ID"),
  price: z.number().int().nonnegative("Price must be non-negative"),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
  subtotal: z.number().int().nonnegative().optional(),
});
