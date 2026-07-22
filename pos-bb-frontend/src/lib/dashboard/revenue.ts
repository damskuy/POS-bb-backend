import { prisma } from "@/lib/prisma";

export async function getRevenue() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [todayAgg, monthlyAgg, totalAgg] = await Promise.all([
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "PAID",
        deletedAt: null,
        OR: [
          { paidAt: { gte: startOfToday, lte: endOfToday } },
          { createdAt: { gte: startOfToday, lte: endOfToday } },
        ],
      },
    }),
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "PAID",
        deletedAt: null,
        OR: [
          { paidAt: { gte: startOfMonth, lte: endOfMonth } },
          { createdAt: { gte: startOfMonth, lte: endOfMonth } },
        ],
      },
    }),
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "PAID",
        deletedAt: null,
      },
    }),
  ]);

  return {
    todayRevenue: todayAgg._sum.amount ?? 0,
    monthlyRevenue: monthlyAgg._sum.amount ?? 0,
    totalRevenue: totalAgg._sum.amount ?? 0,
  };
}
