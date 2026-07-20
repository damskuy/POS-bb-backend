import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { workOrderServiceSchema } from "@/lib/validators/workOrderService";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";

/**
 * @swagger
 * /api/work_order_services:
 *   post:
 *     summary: Create Work Order Service Item
 *     description: Tambah item jasa servis langsung ke Work Order.
 *     tags:
 *       - WorkOrder
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [workOrderId, serviceId, price, quantity]
 *             properties:
 *               workOrderId:
 *                 type: integer
 *               serviceId:
 *                 type: integer
 *               price:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Item jasa servis berhasil ditambahkan
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
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
    ]);

    const json = await request.json();

    const result = workOrderServiceSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const { workOrderId, serviceId, price, quantity } = result.data;

    const workOrderService = await prisma.workOrderService.create({
      data: {
        workOrderId,
        serviceId,
        price,
        quantity,
        subtotal: price * quantity,
      },
      include: {
        service: true,
        workOrder: true,
      },
    });

    return success(workOrderService, 201);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to create work order service");
  }
}
