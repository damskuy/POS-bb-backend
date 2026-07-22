import { prisma } from "@/lib/prisma";
import { recalculateWorkOrderTotal } from "./total";

/**
 * Adds a service to a Work Order, updates the Work Order's total,
 * and returns the newly created WorkOrderService record.
 * 
 * @param workOrderId - The ID of the Work Order.
 * @param serviceId - The ID of the Service to add.
 * @param quantity - The quantity of the service.
 * @returns The newly created WorkOrderService record.
 */
export async function addServiceToWorkOrder(
  workOrderId: number,
  serviceId: number,
  quantity: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find Work Order
    const workOrder = await tx.workOrder.findUnique({
      where: { id: workOrderId },
    });
    if (!workOrder) {
      throw new Error(`Work Order with ID ${workOrderId} not found`);
    }

    // 2. Find Service
    const service = await tx.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new Error(`Service with ID ${serviceId} not found`);
    }

    // 3. Calculate subtotal
    const price = service.price;
    const subtotal = price * quantity;

    // 4. Insert into WorkOrderService
    const workOrderService = await tx.workOrderService.create({
      data: {
        workOrderId,
        serviceId,
        price,
        quantity,
        subtotal,
      },
    });

    // 5. Recalculate Work Order Total
    await recalculateWorkOrderTotal(workOrderId, tx);

    // 6. Return the created WorkOrderService
    return workOrderService;
  });
}
