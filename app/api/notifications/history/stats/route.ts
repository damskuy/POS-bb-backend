import { NextResponse } from "next/server";
import { NotificationHistoryService } from "@/lib/services/notification-history.service";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { ForbiddenError } from "@/lib/auth/errors";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
      UserRole.MECHANIC,
    ]);

    const stats = await NotificationHistoryService.getStats();

    return success(stats);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error fetching notification stats:", err);
    return error("Failed to fetch notification stats");
  }
}
