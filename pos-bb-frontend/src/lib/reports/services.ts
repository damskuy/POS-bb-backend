import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ServicesReportFilter {
  limit?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export async function getServicesReport(filter: ServicesReportFilter = {}) {
  const limit = filter.limit && filter.limit > 0 ? filter.limit : 10;

  const woWhere: Prisma.WorkOrderWhereInput = {
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
    woWhere.createdAt = dateFilter;
  }

  const grouped = await prisma.workOrderService.groupBy({
    by: ["serviceId"],
    _sum: {
      quantity: true,
      subtotal: true,
    },
    _count: {
      id: true,
    },
    where: {
      deletedAt: null,
      workOrder: woWhere,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  const serviceIds = grouped.map((g) => g.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  });

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const reports = grouped.map((g) => {
    const service = serviceMap.get(g.serviceId);
    return {
      serviceId: g.serviceId,
      serviceName: service?.name || "",
      service: service || null,
      totalQuantity: g._sum.quantity || 0,
      totalRevenue: g._sum.subtotal || 0,
      usageCount: g._count.id || 0,
    };
  });

  return reports;
}
