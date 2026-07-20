import { headers } from "next/headers";
import { UserRole } from "@prisma/client";

export async function getCurrentUser() {
  const headerList = await headers();

  return {
    id: Number(headerList.get("x-user-id")),
    email: headerList.get("x-user-email") || "",
    role: headerList.get("x-user-role") as UserRole,
  };
}