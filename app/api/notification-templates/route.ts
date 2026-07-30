import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { notificationTemplateSchema } from "@/lib/validators/notificationTemplate";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * GET /api/notification-templates
 * List all active notification templates.
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

    const templates = await prisma.notificationTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return success(templates);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch notification templates");
  }
}

/**
 * POST /api/notification-templates
 * Create a new notification template.
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const json = await request.json();
    const result = notificationTemplateSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const { conditions, ...rest } = result.data;
    const template = await prisma.notificationTemplate.create({
      data: {
        ...rest,
        ...(conditions ? { conditions } : {}),
      },
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "NotificationTemplate",
      entityId: template.id,
      newData: template,
      ipAddress,
      userAgent,
    });

    return success(template, 201);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to create notification template");
  }
}
