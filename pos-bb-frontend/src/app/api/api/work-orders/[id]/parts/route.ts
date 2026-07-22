import { z } from "zod";
import { UserRole } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { addPartToWorkOrder } from "@/lib/work_order/add-part";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

const bodySchema = z.object({
  sparePartId: z.number().int().positive("Invalid Spare Part ID"),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
});

/**
 * @swagger
 * /api/work-orders/{id}/parts:
 *   post:
 *     summary: Add Spare Part to Work Order
 *     description: Menambahkan suku cadang ke Work Order, mengurangi stok inventory, dan menghitung ulang grand total.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkOrderPartInput'
 *     responses:
 *       201:
 *         description: Suku cadang berhasil ditambahkan ke Work Order
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
 *       400:
 *         description: Validasi gagal atau stok tidak mencukupi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Work Order atau Spare Part tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
    ]);

    const { id } = await params;
    const workOrderId = Number(id);
    if (isNaN(workOrderId)) {
      return error("Invalid work order ID", 400);
    }

    const json = await request.json();
    const result = bodySchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const { sparePartId, quantity } = result.data;
    const workOrderPart = await addPartToWorkOrder(workOrderId, sparePartId, quantity);

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "ADD_PART",
      entity: "WorkOrderPart",
      entityId: workOrderPart.id,
      newData: workOrderPart,
      ipAddress,
      userAgent,
    });

    return success(workOrderPart, 201);
  } catch (err) {
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
    return error("Failed to add spare part to work order");
  }
}
