import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { reminderRuleSchema } from "@/lib/validators/reminderRule";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * GET /api/reminder-rules
 * List all active reminder rules (not paginated — typically small set).
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

    const rules = await prisma.reminderRule.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    });

    return success(rules);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch reminder rules");
  }
}

/**
 * POST /api/reminder-rules
 * Create a new reminder rule.
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    const json = await request.json();
    const result = reminderRuleSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const rule = await prisma.reminderRule.create({
      data: result.data,
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "ReminderRule",
      entityId: rule.id,
      newData: rule,
      ipAddress,
      userAgent,
    });

    return success(rule, 201);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to create reminder rule");
  }
}
