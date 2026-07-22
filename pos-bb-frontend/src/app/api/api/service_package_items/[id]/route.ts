import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { success, error, validationError, notFound } from "@/lib/response";
import { servicePackageItemSchema } from "@/lib/validators/servicePackageItem";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";

/**
 * @swagger
 * /api/service_package_items/{id}:
 *   get:
 *     summary: Get Service Package Item Details
 *     description: Mengambil detail item paket servis berdasarkan ID.
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
 *         description: ID Item Paket Servis
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail item paket servis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ServicePackageItem'
 *       404:
 *         description: Item paket servis tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update Service Package Item
 *     description: Perbarui item paket servis berdasarkan ID.
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
 *         description: ID Item Paket Servis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServicePackageItemInput'
 *     responses:
 *       200:
 *         description: Item paket servis berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ServicePackageItem'
 *       404:
 *         description: Item paket servis tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete Service Package Item
 *     description: Soft delete item paket servis berdasarkan ID.
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
 *         description: ID Item Paket Servis
 *     responses:
 *       200:
 *         description: Item paket servis berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ServicePackageItem'
 *       404:
 *         description: Item paket servis tidak ditemukan
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

    const servicePackageItem = await prisma.servicePackageItem.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
      include: {
        servicePackage: true,
        service: true,
        sparePart: true,
      },
    });

    if (!servicePackageItem) {
      return notFound("Service package item");
    }

    return success(servicePackageItem);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch service package item");
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

    const existing = await prisma.servicePackageItem.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Service package item");
    }

    const json = await request.json();

    const result = servicePackageItemSchema.partial().safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const servicePackageItem = await prisma.servicePackageItem.update({
      where: {
        id: Number(id),
      },
      data: result.data,
      include: {
        servicePackage: true,
        service: true,
        sparePart: true,
      },
    });

    return success(servicePackageItem);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to update service package item");
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

    const existing = await prisma.servicePackageItem.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Service package item");
    }

    const servicePackageItem = await prisma.servicePackageItem.update({
      where: {
        id: Number(id),
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return success(servicePackageItem);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to delete service package item");
  }
}
