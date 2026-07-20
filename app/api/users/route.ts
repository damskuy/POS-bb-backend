import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { getPagination } from "@/lib/pagination";
import { success, error, validationError } from "@/lib/response";
import { userSchema } from "@/lib/validators/user";
import { hashPassword } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List Users
 *     description: Mengambil daftar pengguna sistem dengan paginasi dan pencarian (Khusus ADMIN/OWNER).
 *     tags:
 *       - User
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
 *         description: Kata kunci pencarian nama atau email
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar pengguna
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
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create User
 *     description: Tambah pengguna sistem baru.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Pengguna berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Email sudah digunakan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN]);

    const { searchParams } = new URL(request.url);

    const { skip, limit } = getPagination(searchParams);

    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");

    const allowedSortFields = [
      "createdAt",
      "name",
      "email",
    ];
    const sortParam = searchParams.get("sort") || "createdAt";
    const sort = allowedSortFields.includes(sortParam) ? sortParam : "createdAt";

    const order =
      searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (role) {
      const validRoles = ["OWNER", "ADMIN", "CASHIER", "MECHANIC"];
      if (validRoles.includes(role)) {
        where.role = role as UserRole;
      }
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
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: {
        [sort]: order,
      },
      skip,
      take: limit,
    });

    return success(users);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch users");
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN]);

    const json = await request.json();

    const result = userSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const hashedPassword = await hashPassword(result.data.password);
    const user = await prisma.user.create({
      data: {
        ...result.data,
        password: hashedPassword,
      },
    });

    const cleanUser = { ...user };
    delete (cleanUser as { password?: string }).password;
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      newData: cleanUser,
      ipAddress,
      userAgent,
    });

    return success(user, 201);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return error("Email already exists", 409);
    }

    return error("Failed to create user");
  }
}