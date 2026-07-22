import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { getSparePartsReport } from "@/lib/reports/spare-parts";

/**
 * @swagger
 * /api/reports/spare-parts:
 *   get:
 *     summary: Spare Parts Inventory Report
 *     description: Laporan suku cadang terlaris, sisa stok, dan bagian yang perlu restock.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Berhasil mengambil laporan spare parts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 10;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const report = await getSparePartsReport({ limit, startDate, endDate });

    return success(report);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to generate spare parts report");
  }
}
