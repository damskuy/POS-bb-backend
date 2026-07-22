import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { success, error, validationError, notFound } from "@/lib/response";
import { workOrderServiceSchema } from "@/lib/validators/workOrderService";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";

/**
 * @swagger
 * /api/work_order_services/{id}:
 *   get:
 *     summary: Get Work Order Service Details
 *     description: Mengambil detail item jasa servis dalam Work Order berdasarkan ID.
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
 *         description: ID Work Order Service
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail Work Order Service
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
 *         description: Item tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update Work Order Service
 *     description: Perbarui harga atau kuantitas item jasa servis dalam Work Order.
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
 *         description: ID Work Order Service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item berhasil diperbarui
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
 *         description: Item tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete Work Order Service
 *     description: Soft delete item jasa servis dari Work Order.
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
 *         description: ID Work Order Service
 *     responses:
 *       200:
 *         description: Item berhasil dihapus
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
 *         description: Item tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
      UserRole.MECHANIC,
    ]);

    const { id } = await params;

    const workOrderService = await prisma.workOrderService.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
      include: {
        service: true,
        workOrder: true,
      },
    });

    if (!workOrderService) {
      return notFound("Work order service");
    }

    return success(workOrderService);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch work order service");
  }
}

export async function PATCH(
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

    const existing = await prisma.workOrderService.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Work order service");
    }

    const json = await request.json();

    const result = workOrderServiceSchema.partial().safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const price = result.data.price !== undefined ? result.data.price : existing.price;
    const quantity = result.data.quantity !== undefined ? result.data.quantity : existing.quantity;

    const workOrderService = await prisma.workOrderService.update({
      where: {
        id: Number(id),
      },
      data: {
        ...result.data,
        subtotal: price * quantity,
      },
      include: {
        service: true,
        workOrder: true,
      },
    });

    return success(workOrderService);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to update work order service");
  }
}

export async function DELETE(
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

    const existing = await prisma.workOrderService.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Work order service");
    }

    const workOrderService = await prisma.workOrderService.update({
      where: {
        id: Number(id),
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return success(workOrderService);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to delete work order service");
  }
}
