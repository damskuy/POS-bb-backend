import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { AiAnomalyService } from "@/lib/ai/ai-anomaly.service";

/**
 * GET /api/reports/ai-anomalies
 * Surface business anomalies detected from aggregated report data.
 * Zero direct database queries by AI, zero customer PII.
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const result = await AiAnomalyService.getAnomalies(startDate, endDate);

    return success(result);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error generating AI anomalies:", err);
    return error(err.message || "Gagal mendeteksi anomali bisnis AI", 500);
  }
}
