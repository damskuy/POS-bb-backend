import { prisma } from "@/lib/prisma";

export async function getWorkOrders() {
  const [
    pendingCount,
    inProgressCount,
    completedCount,
    cancelledCount,
    latestWorkOrders,
  ] = await Promise.all([
    prisma.workOrder.count({
      where: { status: "PENDING", deletedAt: null },
    }),
    prisma.workOrder.count({
      where: { status: "IN_PROGRESS", deletedAt: null },
    }),
    prisma.workOrder.count({
      where: { status: "COMPLETED", deletedAt: null },
    }),
    prisma.workOrder.count({
      where: { status: "CANCELLED", deletedAt: null },
    }),
    prisma.workOrder.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        customer: true,
        vehicle: true,
      },
    }),
  ]);

  return {
    status: {
      PENDING: pendingCount,
      IN_PROGRESS: inProgressCount,
      COMPLETED: completedCount,
      CANCELLED: cancelledCount,
    },
    byStatus: {
      PENDING: pendingCount,
      IN_PROGRESS: inProgressCount,
      COMPLETED: completedCount,
      CANCELLED: cancelledCount,
    },
    latest: latestWorkOrders,
    recent: latestWorkOrders,
  };
}
