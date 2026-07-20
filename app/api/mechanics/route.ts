import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { getPagination } from "@/lib/pagination";
import { success, error, validationError } from "@/lib/response";
import { mechanicSchema } from "@/lib/validators/mechanic";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/mechanics:
 *   get:
 *     summary: List Mechanics
 *     description: Mengambil daftar mekanik dengan paginasi dan pencarian nama/telepon.
 *     tags:
 *       - Mechanic
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
 *         description: Kata kunci pencarian nama atau nomor telepon
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar mekanik
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
 *                     $ref: '#/components/schemas/Mechanic'
 *   post:
 *     summary: Create Mechanic
 *     description: Tambah data mekanik baru.
 *     tags:
 *       - Mechanic
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MechanicInput'
 *     responses:
 *       201:
 *         description: Mekanik berhasil ditambahkan
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
      UserRole.CASHIER,
    ]);

    const { searchParams } = new URL(request.url);

    const { skip, limit } = getPagination(searchParams);

    const search = searchParams.get("search") || "";

    const allowedSortFields = [
      "createdAt",
      "name",
    ];
    const sortParam = searchParams.get("sort") || "createdAt";
    const sort = allowedSortFields.includes(sortParam) ? sortParam : "createdAt";

    const order =
      searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.MechanicWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const mechanics = await prisma.mechanic.findMany({
      where,
      orderBy: {
        [sort]: order,
      },
      skip,
      take: limit,
    });

    return success(mechanics);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch mechanics");
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

    const result = mechanicSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const mechanic = await prisma.mechanic.create({
      data: result.data,
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "Mechanic",
      entityId: mechanic.id,
      newData: mechanic,
      ipAddress,
      userAgent,
    });

    return success(mechanic, 201);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to create mechanic");
  }
}
