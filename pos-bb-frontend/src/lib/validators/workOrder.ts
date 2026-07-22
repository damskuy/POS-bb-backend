import { z } from "zod";

export const workOrderServiceSchema = z.object({
  serviceId: z.number().int().positive("Invalid Service ID"),
  price: z.number().int().nonnegative("Price must be non-negative"),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
});

export const workOrderPartSchema = z.object({
  sparePartId: z.number().int().positive("Invalid Spare Part ID"),
  price: z.number().int().nonnegative("Price must be non-negative"),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
});

export const workOrderSchema = z.object({
  code: z.any().refine((val) => val === undefined, { message: "Code field is not allowed" }).optional(),
  customerId: z.number().int().positive("Invalid Customer ID"),
  vehicleId: z.number().int().positive("Invalid Vehicle ID"),
  mechanicId: z.number().int().positive("Invalid Mechanic ID").nullable().optional(),
  userId: z.number().int().positive("Invalid User ID").nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "WAITING_PART", "READY", "COMPLETED", "CANCELLED", "PAID"]).default("PENDING").optional(),
  complaint: z.string().nullable().optional(),
  odometer: z.number().int().nonnegative("Odometer must be non-negative").nullable().optional(),
  notes: z.string().nullable().optional(),
  subtotal: z.number().int().nonnegative("Subtotal must be non-negative").default(0),
  discount: z.number().int().nonnegative("Discount must be non-negative").default(0),
  tax: z.number().int().nonnegative("Tax must be non-negative").default(0),
  grandTotal: z.number().int().nonnegative("Grand total must be non-negative").default(0),
  checkInAt: z.coerce.date().nullable().optional(),
  finishedAt: z.coerce.date().nullable().optional(),
  scheduleDate: z.coerce.date().nullable().optional(),
  services: z.array(workOrderServiceSchema).optional(),
  parts: z.array(workOrderPartSchema).optional(),
});
