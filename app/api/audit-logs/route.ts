import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { getPagination } from "@/lib/pagination";
import { success, error } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: List Audit Logs
 *     description: Mengambil riwayat log audit aktivitas pengguna dengan paginasi, pencarian, & filter berdasarkan aksi/entitas/userId.
 *     tags:
 *       - Audit Logs
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
 *         description: Kata kunci pencarian aksi, entitas, atau pengguna
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter nama aksi (LOGIN, CREATE, UPDATE, DELETE, dll)
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Filter nama entitas (Customer, Vehicle, WorkOrder, dll)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter ID Pengguna
 *     responses:
 *       200:
 *         description: Berhasil mengambil log audit
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
 *                     $ref: '#/components/schemas/AuditLog'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPagination(searchParams);

    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";
    const entity = searchParams.get("entity") || "";
    const userId = searchParams.get("userId");

    const allowedSortFields = ["createdAt", "action", "entity"];
    const sortParam = searchParams.get("sort") || "createdAt";
    const sort = allowedSortFields.includes(sortParam) ? sortParam : "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.AuditLogWhereInput = {};

    if (action) {
      where.action = { equals: action, mode: "insensitive" };
    }

    if (entity) {
      where.entity = { equals: entity, mode: "insensitive" };
    }

    if (userId) {
      const parsedUserId = Number(userId);
      if (!isNaN(parsedUserId)) {
        where.userId = parsedUserId;
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        [sort]: order,
      },
      skip,
      take: limit,
    });

    return success(auditLogs);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch audit logs");
  }
}
