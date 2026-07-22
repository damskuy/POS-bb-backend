import { prisma } from "@/lib/prisma";
import { recalculateWorkOrderTotal } from "./total";

/**
 * Updates the quantity of a spare part in a Work Order, updates its subtotal,
 * updates inventory stock count atomically, recalculates the Work Order total,
 * and returns the updated WorkOrderPart record.
 * 
 * @param workOrderId - ID of the Work Order
 * @param sparePartId - ID of the Spare Part
 * @param quantity - New quantity
 * @returns Updated WorkOrderPart record
 */
export async function updatePartQuantityInWorkOrder(
  workOrderId: number,
  sparePartId: number,
  quantity: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find active part record
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

    // 2. Find spare part details
    const sparePart = await tx.sparePart.findUnique({
      where: { id: sparePartId },
    });

    if (!sparePart) {
      throw new Error(`Spare Part with ID ${sparePartId} not found`);
    }

    // 3. Calculate quantity difference and validate stock
    const diff = quantity - partItem.quantity;
    if (diff > 0) {
      if (sparePart.stock < diff) {
        throw new Error("Insufficient stock");
      }
    }

    // 4. Update spare part stock (subtract diff)
    await tx.sparePart.update({
      where: { id: sparePartId },
      data: {
        stock: {
          decrement: diff,
        },
      },
    });

    // 5. Calculate new subtotal
    const subtotal = partItem.price * quantity;

    // 6. Update quantity and subtotal
    const updated = await tx.workOrderPart.update({
      where: { id: partItem.id },
      data: {
        quantity,
        subtotal,
      },
    });

    // 7. Recalculate Work Order total
    await recalculateWorkOrderTotal(workOrderId, tx);

    return updated;
  });
}
