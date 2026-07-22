import { prisma } from "@/lib/prisma";
import { recalculateWorkOrderTotal } from "./total";

/**
 * Soft deletes a service from a Work Order and recalculates the Work Order's total.
 * Uses a Prisma transaction for atomic execution.
 * 
 * @param workOrderId - The ID of the Work Order.
 * @param serviceId - The ID of the Service to remove.
 * @returns The soft-deleted WorkOrderService record.
 */
export async function removeServiceFromWorkOrder(
  workOrderId: number,
  serviceId: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find if the service item exists in the Work Order
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

    // 2. Soft delete it
    const softDeletedService = await tx.workOrderService.update({
      where: { id: serviceItem.id },
      data: {
        deletedAt: new Date(),
      },
    });

    // 3. Recalculate total
    await recalculateWorkOrderTotal(workOrderId, tx);

    // 4. Return the soft deleted record
    return softDeletedService;
  });
}
