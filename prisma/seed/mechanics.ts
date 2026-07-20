import { PrismaClient } from "@prisma/client";

export async function seedMechanics(prisma: PrismaClient) {
  console.log("Seeding mechanics...");

  const mechanicsData = [
    { name: "Budi Santoso", phone: "081234567801", address: "Jl. Merdeka No. 10" },
    { name: "Agus Pratama", phone: "081234567802", address: "Jl. Sudirman No. 45" },
    { name: "Eko Prasetyo", phone: "081234567803", address: "Jl. Gatot Subroto No. 12" },
    { name: "Rudi Hermawan", phone: "081234567804", address: "Jl. Ahmad Yani No. 8" },
  ];

  const mechanics = [];
  for (const m of mechanicsData) {
    const existing = await prisma.mechanic.findFirst({ where: { phone: m.phone } });
    if (existing) {
      const updated = await prisma.mechanic.update({
        where: { id: existing.id },
        data: m,
      });
      mechanics.push(updated);
    } else {
      const created = await prisma.mechanic.create({ data: m });
      mechanics.push(created);
    }
  }

  console.log(`Seeded ${mechanics.length} mechanics.`);
  return mechanics;
}
