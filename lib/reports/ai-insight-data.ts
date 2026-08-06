import { prisma } from "@/lib/prisma";
import { getRevenueReport } from "./revenue";
import { getWorkOrdersReport } from "./work-orders";
import { getCustomerAnalytics } from "./customer-analytics";
import { getSparePartsReport } from "./spare-parts";
import {
  calculatePeriodRange,
  calculateMetricChange,
  MetricChange,
  PeriodRangeResult,
} from "./period-comparison";

export interface TopServiceItem {
  id: number | string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface DecliningServiceItem {
  id: number | string;
  name: string;
  currentQuantity: number;
  previousQuantity: number;
  absoluteChange: number;
  changePercent: number | null;
}

export interface FastMovingInventoryItem {
  name: string;
  totalSold: number;
  revenue: number;
}

export interface SlowMovingInventoryItem {
  id: number;
  name: string;
  stock: number;
  daysSinceLastSold: number;
}

export interface MechanicWorkloadItem {
  id: number;
  name: string;
  completedWorkOrders: number;
  revenue: number;
}

export interface AiInsightDataReport {
  period: {
    label: string;
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
    durationDays: number;
  };
  revenue: MetricChange;
  workOrders: MetricChange;
  averageTicket: MetricChange;
  customers: {
    newCustomers: number;
    returningCustomers: number;
    inactiveCustomers: number;
  };
  services: {
    topServices: TopServiceItem[];
    decliningServices: DecliningServiceItem[];
  };
  inventory: {
    lowStockCount: number;
    outOfStockCount: number;
    fastMovingItems: FastMovingInventoryItem[];
    slowMovingItems: SlowMovingInventoryItem[];
  };
  mechanics: {
    workloads: MechanicWorkloadItem[];
    maxWorkload: number;
    avgWorkload: number;
    imbalanceRatio: number;
  };
}

/**
 * Fetch aggregated business insight data comparing current period against previous period.
 * Strict Anti-PII: Returns only anonymized numbers and aggregated categories.
 */
export async function getAiInsightData(
  startDateStr?: string | null,
  endDateStr?: string | null
): Promise<AiInsightDataReport> {
  const period: PeriodRangeResult = calculatePeriodRange(startDateStr, endDateStr);

  // Execute parallel queries for current and previous period report services
  const [
    currentRevReport,
    prevRevReport,
    currentWoReport,
    prevWoReport,
    customerAnalytics,
    sparePartsReport,
    currentWoServices,
    prevWoServices,
    newCustomersCount,
    currentWoMechanics,
  ] = await Promise.all([
    getRevenueReport({
      startDate: period.startDate,
      endDate: period.endDate,
    }),
    getRevenueReport({
      startDate: period.previousStartDate,
      endDate: period.previousEndDate,
    }),
    getWorkOrdersReport({
      startDate: period.startDate,
      endDate: period.endDate,
    }),
    getWorkOrdersReport({
      startDate: period.previousStartDate,
      endDate: period.previousEndDate,
    }),
    getCustomerAnalytics(),
    getSparePartsReport({
      startDate: period.startDate,
      endDate: period.endDate,
    }),
    prisma.workOrderService.findMany({
      where: {
        deletedAt: null,
        workOrder: {
          deletedAt: null,
          createdAt: {
            gte: period.currentPeriod.startObj,
            lte: period.currentPeriod.endObj,
          },
        },
      },
      include: {
        service: true,
      },
    }),
    prisma.workOrderService.findMany({
      where: {
        deletedAt: null,
        workOrder: {
          deletedAt: null,
          createdAt: {
            gte: period.previousPeriod.startObj,
            lte: period.previousPeriod.endObj,
          },
        },
      },
      include: {
        service: true,
      },
    }),
    prisma.customer.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: period.currentPeriod.startObj,
          lte: period.currentPeriod.endObj,
        },
      },
    }),
    prisma.workOrder.findMany({
      where: {
        deletedAt: null,
        status: "COMPLETED",
        createdAt: {
          gte: period.currentPeriod.startObj,
          lte: period.currentPeriod.endObj,
        },
        mechanicId: { not: null },
      },
      select: {
        mechanicId: true,
        grandTotal: true,
        mechanic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  // 1. Metric Calculations
  const revenueMetrics = calculateMetricChange(
    currentRevReport.totalRevenue,
    prevRevReport.totalRevenue
  );

  const currentCompletedWoCount = currentWoReport.summary.completed ?? 0;
  const prevCompletedWoCount = prevWoReport.summary.completed ?? 0;

  const workOrderMetrics = calculateMetricChange(
    currentCompletedWoCount,
    prevCompletedWoCount
  );

  const averageTicketMetrics = calculateMetricChange(
    currentRevReport.averageTransaction,
    prevRevReport.averageTransaction
  );

  // 2. Customer Aggregations
  const customersData = {
    newCustomers: newCustomersCount,
    returningCustomers: customerAnalytics.visitFrequency.repeatCustomers,
    inactiveCustomers: customerAnalytics.summary.inactiveCustomers,
  };

  // 3. Service Analytics (Current vs Previous Period)
  const currentServiceMap: Record<
    number,
    { name: string; quantity: number; revenue: number }
  > = {};
  for (const item of currentWoServices) {
    const sId = item.serviceId;
    if (!currentServiceMap[sId]) {
      currentServiceMap[sId] = {
        name: item.service?.name || `Service #${sId}`,
        quantity: 0,
        revenue: 0,
      };
    }
    currentServiceMap[sId].quantity += item.quantity;
    currentServiceMap[sId].revenue += item.subtotal;
  }

  const prevServiceMap: Record<
    number,
    { name: string; quantity: number; revenue: number }
  > = {};
  for (const item of prevWoServices) {
    const sId = item.serviceId;
    if (!prevServiceMap[sId]) {
      prevServiceMap[sId] = {
        name: item.service?.name || `Service #${sId}`,
        quantity: 0,
        revenue: 0,
      };
    }
    prevServiceMap[sId].quantity += item.quantity;
    prevServiceMap[sId].revenue += item.subtotal;
  }

  // Top services by revenue in current period
  const topServices: TopServiceItem[] = Object.entries(currentServiceMap)
    .map(([sId, data]) => ({
      id: Number(sId),
      name: data.name,
      quantity: data.quantity,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Declining Services Calculation:
  // Threshold rules:
  // - Must have prior data: previousQuantity >= 3
  // - Material decrease: currentQuantity < previousQuantity and absoluteChange <= -2
  // - Significant drop: changePercent <= -10%
  const decliningServices: DecliningServiceItem[] = [];

  for (const [sIdStr, prevData] of Object.entries(prevServiceMap)) {
    const sId = Number(sIdStr);
    const currData = currentServiceMap[sId] || { quantity: 0, revenue: 0 };
    const currQty = currData.quantity;
    const prevQty = prevData.quantity;

    if (prevQty >= 3 && currQty < prevQty) {
      const metricChange = calculateMetricChange(currQty, prevQty);
      if (
        metricChange.changePercent !== null &&
        metricChange.changePercent <= -10 &&
        metricChange.absoluteChange <= -2
      ) {
        decliningServices.push({
          id: sId,
          name: prevData.name,
          currentQuantity: currQty,
          previousQuantity: prevQty,
          absoluteChange: metricChange.absoluteChange,
          changePercent: metricChange.changePercent,
        });
      }
    }
  }

  decliningServices.sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0));

  // 4. Inventory Aggregations
  const fastMovingItems: FastMovingInventoryItem[] = sparePartsReport.topSelling.map(
    (item) => ({
      name: item.sparePartName,
      totalSold: item.totalQuantity,
      revenue: item.revenue,
    })
  );

  const slowMovingItems: SlowMovingInventoryItem[] = sparePartsReport.slowMoving.map(
    (item) => ({
      id: item.id,
      name: item.name,
      stock: item.stock,
      daysSinceLastSold: item.lastSold
        ? Math.floor((Date.now() - new Date(item.lastSold).getTime()) / (1000 * 60 * 60 * 24))
        : 999,
    })
  );

  // 5. Mechanics Workload Aggregations
  const mechanicMap: Record<number, { name: string; completedWorkOrders: number; revenue: number }> = {};
  for (const wo of currentWoMechanics) {
    if (!wo.mechanicId || !wo.mechanic) continue;
    const mId = wo.mechanicId;
    if (!mechanicMap[mId]) {
      mechanicMap[mId] = {
        name: wo.mechanic.name,
        completedWorkOrders: 0,
        revenue: 0,
      };
    }
    mechanicMap[mId].completedWorkOrders += 1;
    mechanicMap[mId].revenue += wo.grandTotal;
  }

  const mechanicWorkloads: MechanicWorkloadItem[] = Object.entries(mechanicMap).map(
    ([idStr, data]) => ({
      id: Number(idStr),
      name: data.name,
      completedWorkOrders: data.completedWorkOrders,
      revenue: data.revenue,
    })
  );

  const workloadsList = mechanicWorkloads.map((m) => m.completedWorkOrders);
  const maxWorkload = workloadsList.length > 0 ? Math.max(...workloadsList) : 0;
  const avgWorkload = workloadsList.length > 0 ? workloadsList.reduce((a, b) => a + b, 0) / workloadsList.length : 0;
  const imbalanceRatio = avgWorkload > 0 ? maxWorkload / avgWorkload : 0;

  return {
    period: {
      label: period.label,
      startDate: period.startDate,
      endDate: period.endDate,
      previousStartDate: period.previousStartDate,
      previousEndDate: period.previousEndDate,
      durationDays: period.durationDays,
    },
    revenue: revenueMetrics,
    workOrders: workOrderMetrics,
    averageTicket: averageTicketMetrics,
    customers: customersData,
    services: {
      topServices,
      decliningServices,
    },
    inventory: {
      lowStockCount: sparePartsReport.summary.lowStockCount,
      outOfStockCount: sparePartsReport.summary.outOfStockCount,
      fastMovingItems,
      slowMovingItems,
    },
    mechanics: {
      workloads: mechanicWorkloads,
      maxWorkload,
      avgWorkload,
      imbalanceRatio,
    },
  };
}

function NordstromDate(str: string): string {
  return str;
}
