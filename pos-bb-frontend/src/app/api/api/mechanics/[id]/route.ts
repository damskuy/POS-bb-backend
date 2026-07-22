import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { success, error, validationError, notFound } from "@/lib/response";
import { mechanicSchema } from "@/lib/validators/mechanic";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/mechanics/{id}:
 *   get:
 *     summary: Get Mechanic Details
 *     description: Mengambil detail mekanik berdasarkan ID beserta riwayat work order-nya.
 *     tags:
 *       - Mechanic
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Mekanik
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail mekanik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Mechanic'
 *       404:
 *         description: Mekanik tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update Mechanic
 *     description: Perbarui data mekanik berdasarkan ID.
 *     tags:
 *       - Mechanic
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Mekanik
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MechanicInput'
 *     responses:
 *       200:
 *         description: Mekanik berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Mechanic'
 *       404:
 *         description: Mekanik tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete Mechanic
 *     description: Soft delete data mekanik berdasarkan ID.
 *     tags:
 *       - Mechanic
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Mekanik
 *     responses:
 *       200:
 *         description: Mekanik berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Mechanic'
 *       404:
 *         description: Mekanik tidak ditemukan
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
    ]);

    const { id } = await params;

    const mechanic = await prisma.mechanic.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
      include: {
        workOrders: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!mechanic) {
      return notFound("Mechanic");
    }

    return success(mechanic);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch mechanic");
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

    const existing = await prisma.mechanic.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Mechanic");
    }

    const json = await request.json();

    const result = mechanicSchema.partial().safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const mechanic = await prisma.mechanic.update({
      where: {
        id: Number(id),
      },
      data: result.data,
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "UPDATE",
      entity: "Mechanic",
      entityId: mechanic.id,
      oldData: existing,
      newData: mechanic,
      ipAddress,
      userAgent,
    });

    return success(mechanic);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to update mechanic");
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

    const existing = await prisma.mechanic.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Mechanic");
    }

    const mechanic = await prisma.mechanic.update({
      where: {
        id: Number(id),
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "DELETE",
      entity: "Mechanic",
      entityId: mechanic.id,
      oldData: existing,
      newData: mechanic,
      ipAddress,
      userAgent,
    });

    return success(mechanic);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to delete mechanic");
  }
}
