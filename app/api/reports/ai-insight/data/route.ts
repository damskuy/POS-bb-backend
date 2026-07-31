import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { getAiInsightData } from "@/lib/reports/ai-insight-data";

/**
 * GET /api/reports/ai-insight/data
 * Fetch aggregated business metrics & period comparisons for AI Insight.
 * Strict Anti-PII: Returns only anonymized numbers and aggregated metrics.
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
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await getAiInsightData(startDate, endDate);

    return success(data);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error fetching AI insight data:", err);
    return error(err.message || "Gagal mengambil data AI insight", 400);
  }
}
