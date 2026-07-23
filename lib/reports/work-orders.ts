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

  const [pending, inProgress, completed, cancelled, workOrders, allWoForStats] =
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
      prisma.workOrder.findMany({
        where: baseWhere,
        include: {
          mechanic: true,
        },
      }),
    ]);

  const completedWos = allWoForStats.filter((wo) => wo.status === "COMPLETED" && wo.finishedAt);
  let totalDurationMs = 0;
  let minDurationMs = Infinity;
  let maxDurationMs = -1;

  completedWos.forEach((wo) => {
    const start = wo.checkInAt || wo.createdAt;
    const end = wo.finishedAt!;
    const dur = end.getTime() - start.getTime();
    if (dur > 0) {
      totalDurationMs += dur;
      if (dur < minDurationMs) minDurationMs = dur;
      if (dur > maxDurationMs) maxDurationMs = dur;
    }
  });

  const avgDurationMs = completedWos.length > 0 ? Math.round(totalDurationMs / completedWos.length) : 0;

  const formatDuration = (ms: number) => {
    if (ms <= 0 || ms === Infinity) return "-";
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}j ${minutes}m`;
    return `${minutes}m`;
  };

  const completionTime = {
    average: formatDuration(avgDurationMs),
    fastest: formatDuration(minDurationMs),
    longest: formatDuration(maxDurationMs),
  };

  // Daily Trend
  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dailyMap[dateStr] = 0;
  }

  allWoForStats.forEach((wo) => {
    const dateStr = wo.createdAt.toISOString().split("T")[0];
    if (dateStr in dailyMap) {
      dailyMap[dateStr]++;
    }
  });

  const dailyTrend = Object.entries(dailyMap)
    .map(([dateStr, count]) => {
      const d = new Date(dateStr);
      const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      return {
        date: dateStr,
        label,
        count,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Mechanic Performance
  const mechMap: Record<string, number> = {};
  allWoForStats.forEach((wo) => {
    if (wo.status === "COMPLETED" && wo.mechanic) {
      const name = wo.mechanic.name;
      mechMap[name] = (mechMap[name] || 0) + 1;
    }
  });

  const mechanicPerformance = Object.entries(mechMap)
    .map(([name, completed]) => ({
      name,
      completed,
    }))
    .sort((a, b) => b.completed - a.completed);

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
    completionTime,
    dailyTrend,
    mechanicPerformance,
  };
}
