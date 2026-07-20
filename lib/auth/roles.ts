import { UserRole } from "@prisma/client";

import { ForbiddenError } from "./errors";

export function hasRole(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(userRole);
}

export function requireRole(
  userRole: UserRole,
  allowedRoles: UserRole[]
) {
  if (!hasRole(userRole, allowedRoles)) {
    throw new ForbiddenError("Forbidden");
  }
}

export function isAdmin(role: UserRole | string): boolean {
  return role === UserRole.ADMIN || role === "ADMIN";
}

export function isOwner(role: UserRole | string): boolean {
  return role === UserRole.OWNER || role === "OWNER";
}

export function isCashier(role: UserRole | string): boolean {
  return role === UserRole.CASHIER || role === "CASHIER";
}

export function isMechanic(role: UserRole | string): boolean {
  return role === UserRole.MECHANIC || role === "MECHANIC";
}