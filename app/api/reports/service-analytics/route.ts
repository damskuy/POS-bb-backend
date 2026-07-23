import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { getServiceAnalytics } from "@/lib/reports/service-analytics";

/**
 * @swagger
 * /api/reports/service-analytics:
 *   get:
 *     summary: Complete Service Analytics Report
 *     description: Laporan analitik mendalam kinerja jasa service, popularitas, kontribusi pendapatan, performa mekanik, dan kombinasi jasa.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil laporan analitik jasa service
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

    const report = await getServiceAnalytics();

    return success(report);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to generate service analytics report");
  }
}
