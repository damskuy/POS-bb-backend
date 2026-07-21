import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { getPagination } from "@/lib/pagination";
import { success, error, validationError } from "@/lib/response";
import { sparePartSchema } from "@/lib/validators/sparePart";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/spare_parts:
 *   get:
 *     summary: List Spare Parts
 *     description: Mengambil daftar suku cadang/spare parts dengan paginasi dan pencarian nama/SKU.
 *     tags:
 *       - SparePart
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
 *         description: Kata kunci pencarian nama atau SKU
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar suku cadang
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
 *                     $ref: '#/components/schemas/SparePart'
 *   post:
 *     summary: Create Spare Part
 *     description: Tambah suku cadang baru ke dalam inventory.
 *     tags:
 *       - SparePart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SparePartInput'
 *     responses:
 *       201:
 *         description: Suku cadang berhasil ditambahkan
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
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: SKU sudah ada
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

    const { page, limit, skip } = getPagination(searchParams);

    const search = searchParams.get("search") || "";
    const lowStock = searchParams.get("lowStock");

    const allowedSortFields = [
      "createdAt",
      "name",
      "stock",
      "price",
    ];
    const sortParam = searchParams.get("sort") || "createdAt";
    const sort = allowedSortFields.includes(sortParam) ? sortParam : "createdAt";

    const order =
      searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.SparePartWhereInput = {
      deletedAt: null,
    };

    if (lowStock === "true") {
      where.stock = {
        lte: 5,
      };
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          sku: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [total, spareParts] = await Promise.all([
      prisma.sparePart.count({ where }),
      prisma.sparePart.findMany({
        where,
        orderBy: {
          [sort]: order,
        },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: spareParts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch spare parts");
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

    const result = sparePartSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const sparePart = await prisma.sparePart.create({
      data: result.data,
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "SparePart",
      entityId: sparePart.id,
      newData: sparePart,
      ipAddress,
      userAgent,
    });

    return success(sparePart, 201);
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

    return error("Failed to create spare part");
  }
}
