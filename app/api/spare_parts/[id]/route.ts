import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { success, error, validationError, notFound } from "@/lib/response";
import { sparePartSchema } from "@/lib/validators/sparePart";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/spare_parts/{id}:
 *   get:
 *     summary: Get Spare Part Details
 *     description: Mengambil rincian data suku cadang berdasarkan ID.
 *     tags:
 *       - SparePart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Suku Cadang
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail suku cadang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SparePart'
 *       404:
 *         description: Suku cadang tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update Spare Part
 *     description: Perbarui data suku cadang (harga, stok, nama, dll) berdasarkan ID.
 *     tags:
 *       - SparePart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Suku Cadang
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SparePartInput'
 *     responses:
 *       200:
 *         description: Suku cadang berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SparePart'
 *       404:
 *         description: Suku cadang tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete Spare Part
 *     description: Soft delete data suku cadang berdasarkan ID.
 *     tags:
 *       - SparePart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                   $ref: '#/components/schemas/SparePart'
 *       404:
 *         description: Suku cadang tidak ditemukan
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

    const sparePart = await prisma.sparePart.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
      include: {
        packageItems: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!sparePart) {
      return notFound("Spare part");
    }

    return success(sparePart);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch spare part");
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
    ]);

    const { id } = await params;

    const existing = await prisma.sparePart.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Spare part");
    }

    const json = await request.json();

    const result = sparePartSchema.partial().safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const sparePart = await prisma.sparePart.update({
      where: {
        id: Number(id),
      },
      data: result.data,
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "UPDATE",
      entity: "SparePart",
      entityId: sparePart.id,
      oldData: existing,
      newData: sparePart,
      ipAddress,
      userAgent,
    });

    return success(sparePart);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return error("SKU already exists", 409);
    }

    return error("Failed to update spare part");
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
    ]);

    const { id } = await params;

    const existing = await prisma.sparePart.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Spare part");
    }

    const sparePart = await prisma.sparePart.update({
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
      entity: "SparePart",
      entityId: sparePart.id,
      oldData: existing,
      newData: sparePart,
      ipAddress,
      userAgent,
    });

    return success(sparePart);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to delete spare part");
  }
}
