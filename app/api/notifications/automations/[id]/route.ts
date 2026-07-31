import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { success, error, validationError, notFound } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";
import { updateNotificationAutomationSchema } from "@/lib/validators/notificationAutomation";
import { NotificationAutomationService } from "@/lib/services/notification-automation.service";

/**
 * GET /api/notifications/automations/[id]
 * Fetch detail of a single notification automation by ID.
 */
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
    const automationId = Number(id);

    if (isNaN(automationId)) {
      return error("ID automation tidak valid", 400);
    }

    const automation = await NotificationAutomationService.getById(automationId);

    if (!automation) {
      return notFound("Notification automation");
    }

    return success(automation);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error fetching notification automation:", err);
    return error(err.message || "Failed to fetch notification automation");
  }
}

/**
 * PATCH /api/notifications/automations/[id]
 * Update a notification automation (name, description, isEnabled, templateId).
 * Trigger cannot be modified.
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
    
    // Explicitly reject/strip trigger if provided
    delete json.trigger;
    delete json.createdAt;
    delete json.updatedAt;
    delete json.id;

    const result = updateNotificationAutomationSchema.safeParse(json);
    if (!result.success) {
      return validationError(result.error.flatten());
    }

    try {
      const updated = await NotificationAutomationService.update(
        automationId,
        result.data
      );

      const { ipAddress, userAgent } = getClientInfo(request);
      await createAuditLog({
        userId: currentUser.id,
        action: "UPDATE",
        entity: "NotificationAutomation",
        entityId: updated.id,
        oldData: existing,
        newData: updated,
        ipAddress,
        userAgent,
      });

      return success(updated);
    } catch (updateErr: any) {
      return error(updateErr.message || "Gagal memperbarui notification automation", 400);
    }
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error updating notification automation:", err);
    return error(err.message || "Failed to update notification automation");
  }
}
