import { prisma } from "../lib/prisma";

async function main() {
  console.log("Restoring all soft-deleted records in the database...");

  const customerRes = await prisma.customer.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });

  const vehicleRes = await prisma.vehicle.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });

  const mechanicRes = await prisma.mechanic.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });

  const serviceRes = await prisma.service.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });

  const sparePartRes = await prisma.sparePart.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });

  const servicePackageRes = await prisma.servicePackage.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });

  const servicePackageItemRes = await prisma.servicePackageItem.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });

  const userRes = await prisma.user.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });

  const workOrderRes = await prisma.workOrder.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null }
  });

  console.log("Database restore complete!");
  console.log(`- Customers restored: ${customerRes.count}`);
  console.log(`- Vehicles restored: ${vehicleRes.count}`);
  console.log(`- Mechanics restored: ${mechanicRes.count}`);
  console.log(`- Services restored: ${serviceRes.count}`);
  console.log(`- Spare Parts restored: ${sparePartRes.count}`);
  console.log(`- Service Packages restored: ${servicePackageRes.count}`);
  console.log(`- Service Package Items restored: ${servicePackageItemRes.count}`);
  console.log(`- Users restored: ${userRes.count}`);
  console.log(`- Work Orders restored: ${workOrderRes.count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
