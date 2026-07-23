import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface RevenueReportFilter {
  startDate?: string | null;
  endDate?: string | null;
}

export async function getRevenueReport(filter: RevenueReportFilter = {}) {
  const where: Prisma.PaymentWhereInput = {
    status: "PAID",
    deletedAt: null,
  };

  if (filter.startDate || filter.endDate) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filter.startDate) {
      dateFilter.gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      const end = new Date(filter.endDate);
      if (filter.endDate.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
      dateFilter.lte = end;
    }

    where.OR = [
      { paidAt: dateFilter },
      { paidAt: null, createdAt: dateFilter },
    ];
  }

  const [aggregateResult, payments] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where,
    }),
    prisma.payment.findMany({
      where,
      select: {
        amount: true,
        paidAt: true,
        createdAt: true,
        method: true,
      },
      orderBy: [
        { paidAt: "asc" },
        { createdAt: "asc" },
      ],
    }),
  ]);

  const totalRevenue = aggregateResult._sum.amount ?? 0;
  const totalTransactions = aggregateResult._count.id ?? 0;
  const averageTransaction =
    totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  const dailyMap: Record<
    string,
    { date: string; revenue: number; transactions: number }
  > = {};

  const methodMap: Record<string, number> = {};

  for (const p of payments) {
    const dateObj = p.paidAt || p.createdAt;
    const dateStr = dateObj.toISOString().split("T")[0];

    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = {
        date: dateStr,
        revenue: 0,
        transactions: 0,
      };
    }
    dailyMap[dateStr].revenue += p.amount;
    dailyMap[dateStr].transactions += 1;

    methodMap[p.method] = (methodMap[p.method] || 0) + p.amount;
  }

  const dailyRevenue = Object.values(dailyMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const methodColors: Record<string, string> = {
    CASH: "#10b981",
    QRIS: "#3b82f6",
    TRANSFER: "#f59e0b",
    EWALLET: "#7c3aed",
  };

  const paymentMethods = Object.entries(methodMap).map(([method, amount]) => {
    const percentage = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
    return {
      method,
      amount,
      percentage,
      color: methodColors[method] || "#64748b",
    };
  });

  return {
    totalRevenue,
    totalTransactions,
    averageTransaction,
    dailyRevenue,
    paymentMethods,
  };
}
