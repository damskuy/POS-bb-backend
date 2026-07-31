import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { getAiInsightData } from "@/lib/reports/ai-insight-data";
import { AiInsightGeneratorService } from "@/lib/ai/ai-insight-generator.service";

/**
 * GET /api/reports/ai-insight
 * Main entry point for AI Business Insight generation.
 * Consumes aggregated metrics from Fase AI-1A data service and returns validated structured insights.
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

    // 1. Fetch aggregated report metrics (Fase AI-1A)
    const aggregatedData = await getAiInsightData(startDate, endDate);

    // 2. Generate Insight (AI or Deterministic Fallback)
    const { output, meta } = await AiInsightGeneratorService.generateInsight(aggregatedData);

    return success({
      ...output,
      meta,
    });
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error generating AI insight:", err);
    return error(err.message || "Gagal menghasilkan insight bisnis AI", 400);
  }
}
