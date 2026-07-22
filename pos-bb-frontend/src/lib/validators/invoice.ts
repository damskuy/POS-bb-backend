import { z } from "zod";

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(3, "Invoice number must be at least 3 characters").optional(),
  workOrderId: z.number().int().positive("Invalid Work Order ID"),
  printedAt: z.coerce.date().nullable().optional(),
  status: z.string().default("DRAFT").optional(),
  issuedAt: z.coerce.date().nullable().optional(),
});
