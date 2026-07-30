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
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const body = await request.json().catch(() => ({}));
    const mode = body.mode === "LIVE" ? "LIVE" : "DRY_RUN";

    const result = await ReminderEngineService.runReminderEngine({ mode });

    return success(result);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error executing reminder evaluation:", err);
    return error(err.message || "Failed to execute reminder evaluation");
  }
}
