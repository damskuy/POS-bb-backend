import { z } from "zod";

export const servicePackageItemSchema = z.object({
  servicePackageId: z.number().int().positive("Invalid Service Package ID"),
  serviceId: z.number().int().positive("Invalid Service ID").nullable().optional(),
  sparePartId: z.number().int().positive("Invalid Spare Part ID").nullable().optional(),
  quantity: z.number().int().positive("Quantity must be at least 1").optional(),
});
