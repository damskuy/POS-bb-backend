import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./seed/users";
import { seedMechanics } from "./seed/mechanics";
import { seedCustomers } from "./seed/customers";
import { seedVehicles } from "./seed/vehicles";
import { seedServices } from "./seed/services";
import { seedSpareParts } from "./seed/spareparts";
import { seedWorkOrders } from "./seed/workorders";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  const users = await seedUsers(prisma);
  const mechanics = await seedMechanics(prisma);
  const customers = await seedCustomers(prisma);
  const vehicles = await seedVehicles(prisma, customers);
  const services = await seedServices(prisma);
  const spareparts = await seedSpareParts(prisma);

  await seedWorkOrders(prisma, {
    customers,
    vehicles,
    mechanics,
    services,
    spareparts,
    users,
  });

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
