import { prisma } from "@/lib/prisma";

export async function getOverview() {
  const [
    totalCustomers,
    totalVehicles,
    totalMechanics,
    totalServices,
    totalSpareParts,
    totalWorkOrders,
  ] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.vehicle.count({ where: { deletedAt: null } }),
    prisma.mechanic.count({ where: { deletedAt: null } }),
    prisma.service.count({ where: { deletedAt: null } }),
    prisma.sparePart.count({ where: { deletedAt: null } }),
    prisma.workOrder.count({ where: { deletedAt: null } }),
  ]);

  return {
    totalCustomers,
    totalVehicles,
    totalMechanics,
    totalServices,
    totalSpareParts,
    totalWorkOrders,
  };
}
