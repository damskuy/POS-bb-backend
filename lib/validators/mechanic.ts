import { z } from "zod";

export const mechanicSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
  address: z.string().nullable().optional(),
});
