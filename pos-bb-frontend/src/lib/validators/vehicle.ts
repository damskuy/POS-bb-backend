import { z } from "zod";

export const vehicleSchema = z.object({
  customerId: z.number().int().positive("Invalid Customer ID"),
  plateNumber: z.string().min(3, "Plate number must be at least 3 characters"),
  brand: z.string().min(2, "Brand must be at least 2 characters"),
  model: z.string().min(2, "Model must be at least 2 characters"),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
});
