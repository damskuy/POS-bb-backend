import { z } from "zod";
import { UserRole } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { removePartFromWorkOrder } from "@/lib/work_order/remove-part";
import { updatePartQuantityInWorkOrder } from "@/lib/work_order/update-part-quantity";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";

const updateQuantitySchema = z.object({
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

/**
 * @swagger
 * /api/work-orders/{id}/parts/{partId}:
 *   delete:
 *     summary: Remove Spare Part from Work Order
 *     description: Menghapus suku cadang dari Work Order, mengembalikan stok inventory, dan menghitung ulang total.
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
 *         name: partId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Suku Cadang
 *     responses:
 *       200:
 *         description: Suku cadang berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WorkOrderPart'
 *       404:
 *         description: Work Order Part tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update Spare Part Quantity in Work Order
 *     description: Perbarui kuantitas suku cadang dalam Work Order dan sesuaikan stok inventory.
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
 *         name: partId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Suku Cadang
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
 *         description: Kuantitas suku cadang berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WorkOrderPart'
 *       404:
 *         description: Work Order Part tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
    ]);

    const { id, partId } = await params;
    const workOrderId = Number(id);
    const targetPartId = Number(partId);

    if (isNaN(workOrderId) || isNaN(targetPartId)) {
      return error("Invalid work order ID or part ID", 400);
    }

    const result = await removePartFromWorkOrder(workOrderId, targetPartId);
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
    return error("Failed to remove spare part from work order");
  }
}

/**
 * PATCH /api/work-orders/[id]/parts/[partId]
 * Updates the quantity of a spare part in the specified Work Order, adjusts stock count, and updates totals.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
    ]);

    const { id, partId } = await params;
    const workOrderId = Number(id);
    const targetPartId = Number(partId);

    if (isNaN(workOrderId) || isNaN(targetPartId)) {
      return error("Invalid work order ID or part ID", 400);
    }

    const json = await request.json();
    const result = updateQuantitySchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const updated = await updatePartQuantityInWorkOrder(
      workOrderId,
      targetPartId,
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
    return error("Failed to update spare part quantity");
  }
}

