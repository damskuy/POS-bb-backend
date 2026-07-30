import { NextResponse } from "next/server";
import { NotificationHistoryService } from "@/lib/services/notification-history.service";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { UserRole } from "@prisma/client";
import { success, error } from "@/lib/response";
import { ForbiddenError } from "@/lib/auth/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const { id } = await params;

    const updatedLog = await NotificationHistoryService.retryNotification(id);

    return success(updatedLog);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error retrying notification:", err);
    return error(err.message || "Failed to retry notification");
  }
}
