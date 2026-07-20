import { prisma } from "@/lib/prisma";
import { recalculateWorkOrderTotal } from "./total";

/**
 * Updates the quantity of a service in a Work Order, updates its subtotal,
 * recalculates the Work Order total, and returns the updated WorkOrderService record.
 * 
 * @param workOrderId - ID of the Work Order
 * @param serviceId - ID of the Service
 * @param quantity - New quantity
 * @returns Updated WorkOrderService record
 */
export async function updateServiceQuantityInWorkOrder(
  workOrderId: number,
  serviceId: number,
  quantity: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find active service record
    const serviceItem = await tx.workOrderService.findFirst({
      where: {
        workOrderId,
        serviceId,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!serviceItem || serviceItem.deletedAt !== null) {
      throw new Error(`Service with ID ${serviceId} not found in Work Order ${workOrderId}`);
    }

    // 2. Calculate new subtotal
    const subtotal = serviceItem.price * quantity;

    // 3. Update quantity and subtotal
    const updated = await tx.workOrderService.update({
      where: { id: serviceItem.id },
      data: {
        quantity,
        subtotal,
      },
    });

    // 4. Recalculate Work Order total
    await recalculateWorkOrderTotal(workOrderId, tx);

    return updated;
  });
}
