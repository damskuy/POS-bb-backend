import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { success, error, validationError, notFound } from "@/lib/response";
import { serviceSchema } from "@/lib/validators/service";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get Service Details
 *     description: Mengambil rincian data jasa servis berdasarkan ID.
 *     tags:
 *       - Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Servis
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail servis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Servis tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update Service
 *     description: Perbarui data jasa servis berdasarkan ID.
 *     tags:
 *       - Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Servis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceInput'
 *     responses:
 *       200:
 *         description: Servis berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Servis tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete Service
 *     description: Soft delete data jasa servis berdasarkan ID.
 *     tags:
 *       - Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Servis
 *     responses:
 *       200:
 *         description: Servis berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Servis tidak ditemukan
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

    const service = await prisma.service.findFirst({
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

    if (!service) {
      return notFound("Service");
    }

    return success(service);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch service");
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

    const existing = await prisma.service.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Service");
    }

    const json = await request.json();

    const result = serviceSchema.partial().safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const service = await prisma.service.update({
      where: {
        id: Number(id),
      },
      data: result.data,
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "UPDATE",
      entity: "Service",
      entityId: service.id,
      oldData: existing,
      newData: service,
      ipAddress,
      userAgent,
    });

    return success(service);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to update service");
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

    const existing = await prisma.service.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Service");
    }

    const service = await prisma.service.update({
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
      entity: "Service",
      entityId: service.id,
      oldData: existing,
      newData: service,
      ipAddress,
      userAgent,
    });

    return success(service);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to delete service");
  }
}
