import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { servicePackageItemSchema } from "@/lib/validators/servicePackageItem";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";

/**
 * @swagger
 * /api/service_package_items:
 *   get:
 *     summary: List Service Package Items
 *     description: Mengambil daftar item paket servis dengan filter servicePackageId.
 *     tags:
 *       - Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: servicePackageId
 *         schema:
 *           type: integer
 *         description: ID Paket Servis
 *     responses:
 *       200:
 *         description: Berhasil mengambil item paket servis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServicePackageItem'
 *   post:
 *     summary: Create Service Package Item
 *     description: Tambah item (servis/sparepart) ke dalam paket servis.
 *     tags:
 *       - Service
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServicePackageItemInput'
 *     responses:
 *       201:
 *         description: Item paket servis berhasil ditambahkan
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
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
    ]);

    const { searchParams } = new URL(request.url);
    const servicePackageId = searchParams.get("servicePackageId");

    const items = await prisma.servicePackageItem.findMany({
      where: servicePackageId
        ? { servicePackageId: parseInt(servicePackageId) }
        : {},
      include: {
        servicePackage: true,
        service: true,
        sparePart: true,
      },
    });

    return success(items);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch service package items");
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
    ]);

    const json = await request.json();

    const result = servicePackageItemSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const servicePackageItem = await prisma.servicePackageItem.create({
      data: result.data,
      include: {
        servicePackage: true,
        service: true,
        sparePart: true,
      },
    });

    return success(servicePackageItem, 201);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to create service package item");
  }
}
