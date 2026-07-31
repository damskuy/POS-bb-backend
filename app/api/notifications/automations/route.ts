import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { NotificationAutomationService } from "@/lib/services/notification-automation.service";

/**
 * GET /api/notifications/automations
 * Fetch all notification automations.
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

    const automations = await NotificationAutomationService.getAll();
    return success(automations);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error fetching notification automations:", err);
    return error(err.message || "Failed to fetch notification automations");
  }
}
