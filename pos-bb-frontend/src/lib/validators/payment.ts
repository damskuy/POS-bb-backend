import { z } from "zod";

export const paymentSchema = z.object({
  workOrderId: z.number().int().positive("Invalid Work Order ID"),
  method: z.enum(["CASH", "QRIS", "TRANSFER", "EWALLET"]),
  amount: z.number().int().nonnegative("Amount must be non-negative"),
  status: z.enum(["UNPAID", "PARTIAL", "PAID"]).default("UNPAID").optional(),
  referenceNumber: z.string().nullable().optional(),
  paidAt: z.coerce.date().nullable().optional(),
});
