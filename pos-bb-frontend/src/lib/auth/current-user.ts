import { headers } from "next/headers";
import { UserRole } from "@prisma/client";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function getCurrentUser() {
  const headerList = await headers();

  let id = Number(headerList.get("x-user-id"));
  let email = headerList.get("x-user-email") || "";
  let role = headerList.get("x-user-role") as UserRole;

  if (!role || isNaN(id) || id <= 0) {
    const authHeader = headerList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const payload = await verifyAccessToken(token);
      if (payload) {
        id = payload.id;
        email = payload.email;
        role = payload.role as UserRole;
      }
    }
  }

  return {
    id,
    email,
    role,
  };
}