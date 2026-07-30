import { NextResponse } from "next/server";
import { NotificationHistoryService } from "@/lib/services/notification-history.service";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { UserRole } from "@prisma/client";
import { success, error, notFound } from "@/lib/response";
import { ForbiddenError } from "@/lib/auth/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
      UserRole.MECHANIC,
    ]);

    const { id } = await params;

    const log = await NotificationHistoryService.getHistoryById(id);

    if (!log) {
      return notFound("Log notifikasi");
    }

    return success(log);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error fetching notification log detail:", err);
    return error("Failed to fetch notification log detail");
  }
}
