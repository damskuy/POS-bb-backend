import { prisma } from "@/lib/prisma";
import { Prisma, Transmission, UserRole } from "@prisma/client";
import { getPagination } from "@/lib/pagination";
import { success, error, validationError } from "@/lib/response";
import { vehicleSchema } from "@/lib/validators/vehicle";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: List Vehicles
 *     description: Mengambil daftar kendaraan dengan paginasi, pencarian plat nomor/merek/model, dan filter customerId.
 *     tags:
 *       - Vehicle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kata kunci plat nomor, merek, atau model
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan ID pelanggan
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar kendaraan
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
 *                     $ref: '#/components/schemas/Vehicle'
 *   post:
 *     summary: Create Vehicle
 *     description: Tambah data kendaraan baru untuk pelanggan.
 *     tags:
 *       - Vehicle
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleInput'
 *     responses:
 *       201:
 *         description: Kendaraan berhasil dibuat
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
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Nomor plat sudah ada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
      UserRole.MECHANIC,
    ]);

    const { searchParams } = new URL(request.url);

    const { skip, limit } = getPagination(searchParams);

    const search = searchParams.get("search") || "";
    const customerId = searchParams.get("customerId");
    const transmission = searchParams.get("transmission");

    const allowedSortFields = [
      "createdAt",
      "plateNumber",
      "brand",
      "year",
    ];
    const sortParam = searchParams.get("sort") || "createdAt";
    const sort = allowedSortFields.includes(sortParam) ? sortParam : "createdAt";

    const order =
      searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.VehicleWhereInput = {
      deletedAt: null,
    };

    if (customerId) {
      const parsedCustomerId = Number(customerId);
      if (!isNaN(parsedCustomerId)) {
        where.customerId = parsedCustomerId;
      }
    }

    if (transmission) {
      const validTransmissions = ["MANUAL", "AUTOMATIC"];
      if (validTransmissions.includes(transmission)) {
        where.transmission = transmission as Transmission;
      }
    }

    if (search) {
      where.OR = [
        {
          plateNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          brand: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          model: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: {
        [sort]: order,
      },
      skip,
      take: limit,
    });

    return success(vehicles);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch vehicles");
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
    ]);

    const json = await request.json();

    const result = vehicleSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const vehicle = await prisma.vehicle.create({
      data: result.data,
      include: {
        customer: true,
      },
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "Vehicle",
      entityId: vehicle.id,
      newData: vehicle,
      ipAddress,
      userAgent,
    });

    return success(vehicle, 201);
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

    return error("Failed to create vehicle");
  }
}