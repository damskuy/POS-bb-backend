import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedUsers(prisma: PrismaClient) {
  console.log("Seeding users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const usersData = [
    {
      name: "Owner Bengkel",
      email: "owner@bengkelbaik.com",
      password: hashedPassword,
      role: UserRole.OWNER,
    },
    {
      name: "Admin Bengkel",
      email: "admin@bengkelbaik.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
    {
      name: "Kasir 1",
      email: "cashier@bengkelbaik.com",
      password: hashedPassword,
      role: UserRole.CASHIER,
    },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, password: u.password, role: u.role },
      create: u,
    });
    users.push(user);
  }

  console.log(`Seeded ${users.length} users.`);
  return users;
}
