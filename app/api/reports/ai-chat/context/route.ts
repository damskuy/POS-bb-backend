import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { getAiInsightData } from "@/lib/reports/ai-insight-data";

/**
 * GET /api/reports/ai-chat/context
 * Returns the exact aggregated dataset used for AI Business Insight.
 * Strictly free of PII (no customer names, phone numbers, plate numbers, or addresses).
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

    const aggregatedData = await getAiInsightData(startDate, endDate);

    return success(aggregatedData);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error fetching AI chat context:", err);
    return error(err.message || "Gagal mengambil konteks data AI", 400);
  }
}
