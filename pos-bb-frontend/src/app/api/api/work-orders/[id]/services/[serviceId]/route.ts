import { z } from "zod";
import { UserRole } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { removeServiceFromWorkOrder } from "@/lib/work_order/remove-service";
import { updateServiceQuantityInWorkOrder } from "@/lib/work_order/update-service-quantity";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";

const updateQuantitySchema = z.object({
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

/**
 * @swagger
 * /api/work-orders/{id}/services/{serviceId}:
 *   delete:
 *     summary: Remove Service from Work Order
 *     description: Menghapus item jasa servis dari Work Order.
 *     tags:
 *       - WorkOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Work Order
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Servis
 *     responses:
 *       200:
 *         description: Jasa servis berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WorkOrderService'
 *       404:
 *         description: Work Order Service tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update Service Quantity in Work Order
 *     description: Perbarui kuantitas jasa servis dalam Work Order.
 *     tags:
 *       - WorkOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Work Order
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Servis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Kuantitas jasa servis berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WorkOrderService'
 *       404:
 *         description: Work Order Service tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
    ]);

    const { id, serviceId } = await params;
    const workOrderId = Number(id);
    const targetServiceId = Number(serviceId);

    if (isNaN(workOrderId) || isNaN(targetServiceId)) {
      return error("Invalid work order ID or service ID", 400);
    }

    const result = await removeServiceFromWorkOrder(workOrderId, targetServiceId);
    return success(result);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    if (err instanceof Error) {
      if (err.message.includes("not found")) {
        return error(err.message, 404);
      }
      return error(err.message, 400);
    }
    return error("Failed to remove service from work order");
  }
}

/**
 * PATCH /api/work-orders/[id]/services/[serviceId]
 * Updates the quantity of a service in the specified Work Order and updates totals.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
    ]);

    const { id, serviceId } = await params;
    const workOrderId = Number(id);
    const targetServiceId = Number(serviceId);

    if (isNaN(workOrderId) || isNaN(targetServiceId)) {
      return error("Invalid work order ID or service ID", 400);
    }

    const json = await request.json();
    const result = updateQuantitySchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const updated = await updateServiceQuantityInWorkOrder(
      workOrderId,
      targetServiceId,
      result.data.quantity
    );
    return success(updated);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    if (err instanceof Error) {
      if (err.message.includes("not found")) {
        return error(err.message, 404);
      }
      return error(err.message, 400);
    }
    return error("Failed to update service quantity");
  }
}

