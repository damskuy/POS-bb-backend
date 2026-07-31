import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { success, error, validationError, notFound } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";
import { toggleNotificationAutomationSchema } from "@/lib/validators/notificationAutomation";
import { NotificationAutomationService } from "@/lib/services/notification-automation.service";

/**
 * PATCH /api/notifications/automations/[id]/toggle
 * Enable or disable a notification automation.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const { id } = await params;
    const automationId = Number(id);

    if (isNaN(automationId)) {
      return error("ID automation tidak valid", 400);
    }

    const existing = await NotificationAutomationService.getById(automationId);
    if (!existing) {
      return notFound("Notification automation");
    }

    const json = await request.json().catch(() => ({}));
    const result = toggleNotificationAutomationSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const updated = await NotificationAutomationService.toggle(
      automationId,
      result.data.isEnabled
    );

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "TOGGLE",
      entity: "NotificationAutomation",
      entityId: updated.id,
      oldData: existing,
      newData: updated,
      ipAddress,
      userAgent,
    });

    return success(updated);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error toggling notification automation:", err);
    return error(err.message || "Failed to toggle notification automation");
  }
}
