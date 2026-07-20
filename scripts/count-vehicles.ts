import { prisma } from "../lib/prisma";

async function main() {
  const total = await prisma.vehicle.count();
  const active = await prisma.vehicle.count({
    where: {
      deletedAt: null
    }
  });
  const deleted = await prisma.vehicle.count({
    where: {
      deletedAt: { not: null }
    }
  });
  console.log(`Vehicles count - Total: ${total}, Active (deletedAt=null): ${active}, Deleted (deletedAt!=null): ${deleted}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
