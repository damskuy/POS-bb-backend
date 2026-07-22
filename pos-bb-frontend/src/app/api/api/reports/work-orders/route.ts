import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { getPagination } from "@/lib/pagination";
import { getWorkOrdersReport } from "@/lib/reports/work-orders";

/**
 * @swagger
 * /api/reports/work-orders:
 *   get:
 *     summary: Work Orders Analysis Report
 *     description: Laporan analisis perintah kerja (Work Order) dengan filter status, mekanik, pelanggan, dan rentang tanggal.
 *     tags:
 *       - Reports
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: mechanicId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mengambil laporan Work Order
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
    const { skip, limit } = getPagination(searchParams);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const mechanicId = searchParams.get("mechanicId");
    const customerId = searchParams.get("customerId");
    const search = searchParams.get("search");

    const report = await getWorkOrdersReport({
      startDate,
      endDate,
      status,
      mechanicId: mechanicId ? Number(mechanicId) : undefined,
      customerId: customerId ? Number(customerId) : undefined,
      search,
      skip,
      limit,
    });

    return success(report);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to generate work orders report");
  }
}
