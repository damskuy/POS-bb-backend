import { prisma } from "@/lib/prisma";
import { Prisma, WorkOrderStatus } from "@prisma/client";

export interface WorkOrdersReportFilter {
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  mechanicId?: number | null;
  customerId?: number | null;
  search?: string | null;
  skip?: number;
  limit?: number;
}

export async function getWorkOrdersReport(filter: WorkOrdersReportFilter = {}) {
  const baseWhere: Prisma.WorkOrderWhereInput = {
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
    baseWhere.createdAt = dateFilter;
  }

  if (filter.mechanicId) {
    baseWhere.mechanicId = filter.mechanicId;
  }

  if (filter.customerId) {
    baseWhere.customerId = filter.customerId;
  }

  if (filter.search) {
    baseWhere.OR = [
      { code: { contains: filter.search, mode: "insensitive" } },
      { complaint: { contains: filter.search, mode: "insensitive" } },
      { customer: { name: { contains: filter.search, mode: "insensitive" } } },
      { vehicle: { plateNumber: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  const listWhere: Prisma.WorkOrderWhereInput = { ...baseWhere };
  if (filter.status) {
    const validStatuses = [
      "PENDING",
      "IN_PROGRESS",
      "WAITING_PART",
      "READY",
      "COMPLETED",
      "CANCELLED",
    ];
    if (validStatuses.includes(filter.status.toUpperCase())) {
      listWhere.status = filter.status.toUpperCase() as WorkOrderStatus;
    }
  }

  const [pending, inProgress, completed, cancelled, workOrders] =
    await Promise.all([
      prisma.workOrder.count({
        where: { ...baseWhere, status: "PENDING" },
      }),
      prisma.workOrder.count({
        where: { ...baseWhere, status: "IN_PROGRESS" },
      }),
      prisma.workOrder.count({
        where: { ...baseWhere, status: "COMPLETED" },
      }),
      prisma.workOrder.count({
        where: { ...baseWhere, status: "CANCELLED" },
      }),
      prisma.workOrder.findMany({
        where: listWhere,
        include: {
          customer: true,
          vehicle: true,
          mechanic: true,
        },
        orderBy: { createdAt: "desc" },
        skip: filter.skip ?? 0,
        take: filter.limit ?? 50,
      }),
    ]);

  return {
    summary: {
      pending,
      inProgress,
      completed,
      cancelled,
      PENDING: pending,
      IN_PROGRESS: inProgress,
      COMPLETED: completed,
      CANCELLED: cancelled,
    },
    workOrders,
  };
}
