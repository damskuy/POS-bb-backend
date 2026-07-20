import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CreateAuditLogInput {
  userId?: number | null;
  action: string;
  entity: string;
  entityId?: number | null;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Extracts client IP address and user agent from a Request object.
 */
export function getClientInfo(request: Request) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") || null;
  return { ipAddress, userAgent };
}

/**
 * Creates an audit log entry in the database.
 * Supports being invoked with either a single params object or positional arguments.
 */
export async function createAuditLog(
  inputOrUserId: CreateAuditLogInput | number | null,
  action?: string,
  entity?: string,
  entityId?: number | null,
  oldData?: unknown,
  newData?: unknown,
  ipAddress?: string | null,
  userAgent?: string | null
) {
  try {
    let payload: CreateAuditLogInput;

    if (typeof inputOrUserId === "object" && inputOrUserId !== null) {
      payload = inputOrUserId;
    } else {
      payload = {
        userId: inputOrUserId,
        action: action!,
        entity: entity!,
        entityId,
        oldData,
        newData,
        ipAddress,
        userAgent,
      };
    }

    return await prisma.auditLog.create({
      data: {
        userId: payload.userId ?? null,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId ?? null,
        oldData: payload.oldData !== undefined && payload.oldData !== null ? (payload.oldData as Prisma.InputJsonValue) : Prisma.JsonNull,
        newData: payload.newData !== undefined && payload.newData !== null ? (payload.newData as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to create audit log:", err);
    return null;
  }
}
