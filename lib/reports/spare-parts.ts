import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface SparePartsReportFilter {
  limit?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export async function getSparePartsReport(filter: SparePartsReportFilter = {}) {
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

  const grouped = await prisma.workOrderPart.groupBy({
    by: ["sparePartId"],
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

  const sparePartIds = grouped.map((g) => g.sparePartId);
  const spareParts = await prisma.sparePart.findMany({
    where: { id: { in: sparePartIds } },
  });

  const partMap = new Map(spareParts.map((p) => [p.id, p]));

  const reports = grouped.map((g) => {
    const sparePart = partMap.get(g.sparePartId);
    return {
      sparePartId: g.sparePartId,
      sparePartName: sparePart?.name || "",
      sparePart: sparePart || null,
      totalQuantity: g._sum.quantity || 0,
      totalRevenue: g._sum.subtotal || 0,
      salesCount: g._count.id || 0,
    };
  });

  return reports;
}
