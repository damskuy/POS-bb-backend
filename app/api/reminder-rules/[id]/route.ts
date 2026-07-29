import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { reminderRuleSchema } from "@/lib/validators/reminderRule";
import { success, error, validationError, notFound } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * GET /api/reminder-rules/:id
 * Get a single reminder rule by ID.
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

    const rule = await prisma.reminderRule.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!rule) {
      return notFound("Reminder rule");
    }

    return success(rule);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch reminder rule");
  }
}

/**
 * PATCH /api/reminder-rules/:id
 * Partially update a reminder rule.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const { id } = await params;

    const existing = await prisma.reminderRule.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existing) {
      return notFound("Reminder rule");
    }

    const json = await request.json();
    const result = reminderRuleSchema.partial().safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const rule = await prisma.reminderRule.update({
      where: { id: Number(id) },
      data: result.data,
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "UPDATE",
      entity: "ReminderRule",
      entityId: rule.id,
      oldData: existing,
      newData: rule,
      ipAddress,
      userAgent,
    });

    return success(rule);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to update reminder rule");
  }
}

/**
 * DELETE /api/reminder-rules/:id
 * Soft-delete a reminder rule.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const { id } = await params;

    const existing = await prisma.reminderRule.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existing) {
      return notFound("Reminder rule");
    }

    const rule = await prisma.reminderRule.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "DELETE",
      entity: "ReminderRule",
      entityId: rule.id,
      oldData: existing,
      newData: rule,
      ipAddress,
      userAgent,
    });

    return success(rule);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to delete reminder rule");
  }
}
