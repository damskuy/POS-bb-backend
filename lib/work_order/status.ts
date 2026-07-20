import { prisma } from "@/lib/prisma";
import { Prisma, WorkOrderStatus } from "@prisma/client";

/**
 * Validates whether a Work Order can transition from current status to next status.
 * Rules:
 * - PENDING -> IN_PROGRESS -> WAITING_PART -> COMPLETED -> PAID.
 * - Any status can transition to CANCELLED, except if the current status is COMPLETED, PAID, or CANCELLED.
 * 
 * @param current - Current status
 * @param next - Proposed next status
 * @returns boolean indicating if transition is valid
 */
export function canTransitionStatus(current: string, next: string): boolean {
  if (current === next) return true;

  // CANCELLED rule: Any status can go to CANCELLED, as long as it isn't COMPLETED, PAID, or already CANCELLED
  if (next === "CANCELLED") {
    return current !== "COMPLETED" && current !== "PAID" && current !== "CANCELLED";
  }

  // Allowed transitions map
  const validTransitions: Record<string, string[]> = {
    PENDING: ["IN_PROGRESS"],
    IN_PROGRESS: ["WAITING_PART", "COMPLETED"],
    WAITING_PART: ["COMPLETED"],
    COMPLETED: ["PAID"],
    PAID: [],
  };

  const allowed = validTransitions[current] || [];
  return allowed.includes(next);
}

/**
 * Validates and updates a Work Order's status.
 * Throws an error if the transition is invalid.
 * Handles PAID mapping to COMPLETED DB status and sets payment status to PAID.
 * 
 * @param workOrderId - ID of the Work Order
 * @param newStatus - New status
 * @param tx - Optional Prisma transaction client
 * @returns Updated Work Order record
 */
export async function updateWorkOrderStatus(
  workOrderId: number,
  newStatus: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;

  const workOrder = await client.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      payment: true,
    },
  });

  if (!workOrder) {
    throw new Error(`Work Order with ID ${workOrderId} not found`);
  }

  // Determine effective status: if DB status is COMPLETED and payment status is PAID, effective status is "PAID"
  let effectiveStatus: string = workOrder.status;
  if (workOrder.status === "COMPLETED" && workOrder.payment && workOrder.payment.status === "PAID") {
    effectiveStatus = "PAID";
  }

  if (!canTransitionStatus(effectiveStatus, newStatus)) {
    throw new Error("Invalid status transition");
  }

  if (newStatus === "PAID") {
    // Save as COMPLETED in DB status, and update/create payment to PAID
    const updatedWo = await client.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: "COMPLETED",
      },
    });

    const existingPayment = await client.payment.findUnique({
      where: { workOrderId },
    });

    if (existingPayment) {
      await client.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
    } else {
      await client.payment.create({
        data: {
          workOrderId,
          method: "CASH",
          amount: workOrder.grandTotal,
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    return updatedWo;
  } else {
    // Normal status update
    return await client.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: newStatus as WorkOrderStatus,
      },
    });
  }
}

