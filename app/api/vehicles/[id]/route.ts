import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { success, error, validationError, notFound } from "@/lib/response";
import { vehicleSchema } from "@/lib/validators/vehicle";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get Vehicle Details
 *     description: Mengambil rincian data kendaraan berdasarkan ID beserta info pemiliknya.
 *     tags:
 *       - Vehicle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kendaraan
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail kendaraan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Kendaraan tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update Vehicle
 *     description: Perbarui data kendaraan berdasarkan ID.
 *     tags:
 *       - Vehicle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kendaraan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleInput'
 *     responses:
 *       200:
 *         description: Kendaraan berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Kendaraan tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete Vehicle
 *     description: Soft delete data kendaraan berdasarkan ID.
 *     tags:
 *       - Vehicle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kendaraan
 *     responses:
 *       200:
 *         description: Kendaraan berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Kendaraan tidak ditemukan
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

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
      include: {
        customer: true,
      },
    });

    if (!vehicle) {
      return notFound("Vehicle");
    }

    return success(vehicle);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch vehicle");
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

    const existing = await prisma.vehicle.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Vehicle");
    }

    const json = await request.json();

    const result = vehicleSchema.partial().safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const vehicle = await prisma.vehicle.update({
      where: {
        id: Number(id),
      },
      data: result.data,
      include: {
        customer: true,
      },
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "UPDATE",
      entity: "Vehicle",
      entityId: vehicle.id,
      oldData: existing,
      newData: vehicle,
      ipAddress,
      userAgent,
    });

    return success(vehicle);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return error("Plate number already exists", 409);
    }

    return error("Failed to update vehicle");
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

    const existing = await prisma.vehicle.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Vehicle");
    }

    const vehicle = await prisma.vehicle.update({
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
      entity: "Vehicle",
      entityId: vehicle.id,
      oldData: existing,
      newData: vehicle,
      ipAddress,
      userAgent,
    });

    return success(vehicle);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to delete vehicle");
  }
}