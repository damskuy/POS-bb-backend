import { getOverview } from "@/lib/dashboard/overview";
import { getWorkOrders } from "@/lib/dashboard/work-orders";
import { getRevenue } from "@/lib/dashboard/revenue";
import { getInventory } from "@/lib/dashboard/inventory";
import { success, error } from "@/lib/response";

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get Dashboard Statistics
 *     description: Mengambil data ringkasan metrik dashboard termasuk overview, statistik work order, grafik pendapatan, dan status inventory.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardSummary'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET() {
  try {
    const [overview, workOrders, revenue, inventory] = await Promise.all([
      getOverview(),
      getWorkOrders(),
      getRevenue(),
      getInventory(),
    ]);

    return success({
      overview,
      workOrders,
      revenue,
      inventory,
    });
  } catch (err) {
    console.error(err);
    return error("Failed to fetch dashboard data");
  }
}
