import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Recalculates the total of a Work Order by summing all its non-deleted services and parts,
 * and updates the subtotal and grandTotal in the database.
 * 
 * @param workOrderId - The ID of the Work Order to recalculate.
 * @param tx - Optional Prisma transaction client
 * @returns The updated grandTotal.
 */
export async function recalculateWorkOrderTotal(
  workOrderId: number,
  tx?: Prisma.TransactionClient
): Promise<number> {
  const client = tx || prisma;

  // Fetch Work Order to get discount and tax values
  const workOrder = await client.workOrder.findUnique({
    where: { id: workOrderId },
  });

  if (!workOrder) {
    throw new Error(`Work Order with ID ${workOrderId} not found`);
  }

  // Fetch non-deleted services
  const services = await client.workOrderService.findMany({
    where: {
      workOrderId,
      deletedAt: null,
    },
    select: {
      subtotal: true,
    },
  });

  // Fetch non-deleted parts
  const parts = await client.workOrderPart.findMany({
    where: {
      workOrderId,
      deletedAt: null,
    },
    select: {
      subtotal: true,
    },
  });

  // Sum subtotals
  const servicesSubtotal = services.reduce((sum, s) => sum + s.subtotal, 0);
  const partsSubtotal = parts.reduce((sum, p) => sum + p.subtotal, 0);
  const newSubtotal = servicesSubtotal + partsSubtotal;

  // Calculate new grandTotal (subtotal - discount + tax, capped at 0)
  const newGrandTotal = Math.max(0, newSubtotal - workOrder.discount + workOrder.tax);

  // Update Work Order record
  await client.workOrder.update({
    where: { id: workOrderId },
    data: {
      subtotal: newSubtotal,
      grandTotal: newGrandTotal,
    },
  });

  return newGrandTotal;
}
