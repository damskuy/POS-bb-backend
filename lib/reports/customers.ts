import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CustomersReportFilter {
  limit?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export async function getCustomersReport(filter: CustomersReportFilter = {}) {
  const limit = filter.limit && filter.limit > 0 ? filter.limit : 10;

  const woWhere: Prisma.WorkOrderWhereInput = {
    deletedAt: null,
    customer: {
      deletedAt: null,
    },
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
    woWhere.createdAt = dateFilter;
  }

  const grouped = await prisma.workOrder.groupBy({
    by: ["customerId"],
    _sum: {
      grandTotal: true,
    },
    _count: {
      id: true,
    },
    where: woWhere,
    orderBy: {
      _sum: {
        grandTotal: "desc",
      },
    },
    take: limit,
  });

  const customerIds = grouped.map((g) => g.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
  });

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const reports = grouped.map((g) => {
    const customer = customerMap.get(g.customerId);
    return {
      customerId: g.customerId,
      customerName: customer?.name || "",
      customer: customer || null,
      totalVisit: g._count.id || 0,
      totalSpent: g._sum.grandTotal || 0,
    };
  });

  return reports;
}
