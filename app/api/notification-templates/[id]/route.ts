import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { notificationTemplateSchema } from "@/lib/validators/notificationTemplate";
import { success, error, validationError, notFound } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * GET /api/notification-templates/:id
 * Get a single notification template by ID.
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

    const template = await prisma.notificationTemplate.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!template) {
      return notFound("Notification template");
    }

    return success(template);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch notification template");
  }
}

/**
 * PATCH /api/notification-templates/:id
 * Partially update a notification template.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const { id } = await params;

    const existing = await prisma.notificationTemplate.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existing) {
      return notFound("Notification template");
    }

    const json = await request.json();
    const result = notificationTemplateSchema.partial().safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const { conditions, ...rest } = result.data;
    const template = await prisma.notificationTemplate.update({
      where: { id: Number(id) },
      data: {
        ...rest,
        ...(conditions ? { conditions } : {}),
      },
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "UPDATE",
      entity: "NotificationTemplate",
      entityId: template.id,
      oldData: existing,
      newData: template,
      ipAddress,
      userAgent,
    });

    return success(template);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to update notification template");
  }
}

/**
 * DELETE /api/notification-templates/:id
 * Soft-delete a notification template.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const { id } = await params;

    const existing = await prisma.notificationTemplate.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existing) {
      return notFound("Notification template");
    }

    const template = await prisma.notificationTemplate.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "DELETE",
      entity: "NotificationTemplate",
      entityId: template.id,
      oldData: existing,
      newData: template,
      ipAddress,
      userAgent,
    });

    return success(template);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to delete notification template");
  }
}
