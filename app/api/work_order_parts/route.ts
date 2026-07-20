import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { workOrderPartSchema } from "@/lib/validators/workOrderPart";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";

/**
 * @swagger
 * /api/work_order_parts:
 *   post:
 *     summary: Create Work Order Part Item
 *     description: Tambah item suku cadang langsung ke Work Order.
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
 *             required: [workOrderId, sparePartId, price, quantity]
 *             properties:
 *               workOrderId:
 *                 type: integer
 *               sparePartId:
 *                 type: integer
 *               price:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Item suku cadang berhasil ditambahkan
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

    const result = workOrderPartSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const { workOrderId, sparePartId, price, quantity } = result.data;

    const workOrderPart = await prisma.workOrderPart.create({
      data: {
        workOrderId,
        sparePartId,
        price,
        quantity,
        subtotal: price * quantity,
      },
      include: {
        sparePart: true,
        workOrder: true,
      },
    });

    return success(workOrderPart, 201);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to create work order part");
  }
}
