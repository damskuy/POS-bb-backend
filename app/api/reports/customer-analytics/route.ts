import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { getCustomerAnalytics } from "@/lib/reports/customer-analytics";

/**
 * @swagger
 * /api/reports/customer-analytics:
 *   get:
 *     summary: Complete Customer Behavior & Retention Analytics
 *     description: Laporan analitik mendalam perilaku pelanggan, retensi, pengeluaran, frekuensi kunjungan, dan pelanggan tidak aktif.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil laporan analitik pelanggan
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

    const report = await getCustomerAnalytics();

    return success(report);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to generate customer analytics report");
  }
}
