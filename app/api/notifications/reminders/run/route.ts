import { NextResponse } from "next/server";
import { ReminderEngineService } from "@/lib/services/reminder-engine.service";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { ForbiddenError } from "@/lib/auth/errors";

/**
 * POST /api/notifications/reminders/run
 * Manual evaluation run for active reminder rules.
 * Accepts optional body: { mode: "DRY_RUN" | "LIVE" }
 * Default mode is "DRY_RUN" for safe testing without dispatching Fonnte HTTP requests.
 * Protected for ADMIN and OWNER roles only.
 * Supports optional REMINDER_TEST_WORK_ORDER_ID env variable.
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const body = await request.json().catch(() => ({}));
    const mode = body.mode === "LIVE" ? "LIVE" : "DRY_RUN";

    let testWorkOrderId: number | null = null;
    const rawTestWoId = process.env.REMINDER_TEST_WORK_ORDER_ID;

    if (rawTestWoId !== undefined && rawTestWoId !== null && rawTestWoId.trim() !== "") {
      const parsed = Number(rawTestWoId.trim());
      if (!Number.isInteger(parsed) || parsed <= 0) {
        console.error(
          `[RemindersRun] Invalid REMINDER_TEST_WORK_ORDER_ID environment variable value: "${rawTestWoId}"`
        );
        return error(
          "Konfigurasi REMINDER_TEST_WORK_ORDER_ID tidak valid. Harus berupa integer positif.",
          500
        );
      }
      testWorkOrderId = parsed;
      console.log(
        `[RemindersRun] SAFE TEST FILTER IS ACTIVE! Strictly processing WorkOrder ID: ${testWorkOrderId}`
      );
    }

    const result = await ReminderEngineService.runReminderEngine({
      mode,
      testWorkOrderId,
    });

    return success(result);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error executing reminder evaluation:", err);
    return error(err.message || "Failed to execute reminder evaluation");
  }
}
