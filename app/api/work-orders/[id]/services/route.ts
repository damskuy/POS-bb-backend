import { z } from "zod";
import { UserRole } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { addServiceToWorkOrder } from "@/lib/work_order/add-service";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

const bodySchema = z.object({
  serviceId: z.number().int().positive("Invalid Service ID"),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
});

/**
 * @swagger
 * /api/work-orders/{id}/services:
 *   post:
 *     summary: Add Service to Work Order
 *     description: Menambahkan jasa servis ke Work Order tertentu dan menghitung ulang grand total.
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
 *             $ref: '#/components/schemas/WorkOrderServiceInput'
 *     responses:
 *       201:
 *         description: Jasa servis berhasil ditambahkan ke Work Order
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
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Work Order atau Servis tidak ditemukan
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

    const { serviceId, quantity } = result.data;
    const workOrderService = await addServiceToWorkOrder(workOrderId, serviceId, quantity);

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "ADD_SERVICE",
      entity: "WorkOrderService",
      entityId: workOrderService.id,
      newData: workOrderService,
      ipAddress,
      userAgent,
    });

    return success(workOrderService, 201);
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
    return error("Failed to add service to work order");
  }
}
