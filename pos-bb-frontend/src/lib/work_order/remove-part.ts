import { prisma } from "@/lib/prisma";
import { recalculateWorkOrderTotal } from "./total";

/**
 * Soft deletes a spare part from a Work Order, restores inventory stock,
 * and recalculates the Work Order's total.
 * Uses a Prisma transaction for atomic execution.
 * 
 * @param workOrderId - The ID of the Work Order.
 * @param sparePartId - The ID of the Spare Part to remove.
 * @returns The soft-deleted WorkOrderPart record.
 */
export async function removePartFromWorkOrder(
  workOrderId: number,
  sparePartId: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find if the spare part item exists in the Work Order
    const partItem = await tx.workOrderPart.findFirst({
      where: {
        workOrderId,
        sparePartId,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!partItem || partItem.deletedAt !== null) {
      throw new Error(`Spare Part with ID ${sparePartId} not found in Work Order ${workOrderId}`);
    }

    // 2. Restore stock
    await tx.sparePart.update({
      where: { id: sparePartId },
      data: {
        stock: {
          increment: partItem.quantity,
        },
      },
    });

    // 3. Soft delete it
    const softDeletedPart = await tx.workOrderPart.update({
      where: { id: partItem.id },
      data: {
        deletedAt: new Date(),
      },
    });

    // 4. Recalculate total
    await recalculateWorkOrderTotal(workOrderId, tx);

    // 5. Return the soft deleted record
    return softDeletedPart;
  });
}
