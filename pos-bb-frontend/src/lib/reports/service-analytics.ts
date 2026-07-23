import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ServiceAnalyticsReport {
  summary: {
    totalServices: number;
    totalRevenue: number;
    averageValue: number;
    mostPopularService: string;
    leastPopularService: string;
  };
  dailyTrend: Array<{
    day: number;
    label: string;
    revenue: number;
  }>;
  monthlyTrend: Array<{
    monthKey: string;
    label: string;
    revenue: number;
  }>;
  popularity: Array<{
    serviceName: string;
    totalOrders: number;
  }>;
  revenueByService: Array<{
    serviceName: string;
    revenue: number;
  }>;
  performance: Array<{
    serviceId: number;
    serviceName: string;
    totalOrders: number;
    totalRevenue: number;
    averagePrice: number;
    lastOrdered: string | null;
  }>;
  frequentCombinations: Array<{
    combination: string;
    count: number;
  }>;
  trends: Array<{
    serviceName: string;
    changePercent: number;
    direction: "up" | "down" | "flat";
  }>;
  contribution: Array<{
    category: string;
    revenue: number;
    percentage: number;
    color: string;
  }>;
  mechanics: Array<{
    mechanicName: string;
    completedServices: number;
    revenue: number;
    averageValue: number;
  }>;
}

export async function getServiceAnalytics(): Promise<ServiceAnalyticsReport> {
  const now = new Date();

  // 1. Fetch all work order services
  const allWoServices = await prisma.workOrderService.findMany({
    where: {
      deletedAt: null,
      workOrder: { deletedAt: null },
    },
    include: {
      workOrder: {
        include: {
          mechanic: true,
        },
      },
      service: true,
    },
  });

  const totalServices = allWoServices.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = allWoServices.reduce((sum, item) => sum + item.subtotal, 0);
  const averageValue = totalServices > 0 ? Math.round(totalRevenue / totalServices) : 0;

  // 2. Count popularity & revenue per service
  const serviceCounts: Record<number, number> = {};
  const serviceRevenues: Record<number, number> = {};
  const serviceLastOrdered: Record<number, Date> = {};
  const serviceMap: Record<number, string> = {};

  allWoServices.forEach((ws) => {
    const sId = ws.serviceId;
    serviceMap[sId] = ws.service.name;
    serviceCounts[sId] = (serviceCounts[sId] || 0) + ws.quantity;
    serviceRevenues[sId] = (serviceRevenues[sId] || 0) + ws.subtotal;

    const wsDate = new Date(ws.createdAt);
    if (!serviceLastOrdered[sId] || wsDate > serviceLastOrdered[sId]) {
      serviceLastOrdered[sId] = wsDate;
    }
  });

  // Calculate Most and Least Popular
  let mostPopularService = "-";
  let leastPopularService = "-";
  let maxOrders = -1;
  let minOrders = Infinity;

  Object.entries(serviceCounts).forEach(([sIdStr, count]) => {
    const sId = Number(sIdStr);
    const name = serviceMap[sId] || `Service #${sId}`;
    if (count > maxOrders) {
      maxOrders = count;
      mostPopularService = name;
    }
    if (count < minOrders) {
      minOrders = count;
      leastPopularService = name;
    }
  });

  // 3. Trends: Daily (last 30 days) and Monthly (last 12 months)
  // Daily Trend
  const dailyTrend: ServiceAnalyticsReport["dailyTrend"] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    dailyTrend.push({ day: 30 - i, label, revenue: 0 });
  }

  allWoServices.forEach((ws) => {
    const wsDate = new Date(ws.createdAt);
    wsDate.setHours(0, 0, 0, 0);
    const trendItem = dailyTrend.find((item) => {
      const itemDate = new Date();
      return item.label === wsDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    });
    if (trendItem) {
      trendItem.revenue += ws.subtotal;
    }
  });

  // Monthly Trend
  const monthlyTrend: ServiceAnalyticsReport["monthlyTrend"] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString("id-ID", { month: "short", year: "2-digit" });
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyTrend.push({ monthKey, label, revenue: 0 });
  }

  allWoServices.forEach((ws) => {
    const wsDate = new Date(ws.createdAt);
    const key = `${wsDate.getFullYear()}-${String(wsDate.getMonth() + 1).padStart(2, "0")}`;
    const trendItem = monthlyTrend.find((item) => item.monthKey === key);
    if (trendItem) {
      trendItem.revenue += ws.subtotal;
    }
  });

  // 4. Service Popularity List (Top Services)
  const popularity = Object.entries(serviceCounts).map(([sIdStr, count]) => ({
    serviceName: serviceMap[Number(sIdStr)] || `Service #${sIdStr}`,
    totalOrders: count,
  }));
  popularity.sort((a, b) => b.totalOrders - a.totalOrders);

  // 5. Revenue by Service
  const revenueByService = Object.entries(serviceRevenues).map(([sIdStr, rev]) => ({
    serviceName: serviceMap[Number(sIdStr)] || `Service #${sIdStr}`,
    revenue: rev,
  }));
  revenueByService.sort((a, b) => b.revenue - a.revenue);

  // 6. Service Performance Table
  const performance = Object.entries(serviceCounts).map(([sIdStr, count]) => {
    const sId = Number(sIdStr);
    const rev = serviceRevenues[sId] || 0;
    return {
      serviceId: sId,
      serviceName: serviceMap[sId] || `Service #${sId}`,
      totalOrders: count,
      totalRevenue: rev,
      averagePrice: count > 0 ? Math.round(rev / count) : 0,
      lastOrdered: serviceLastOrdered[sId] ? serviceLastOrdered[sId].toISOString() : null,
    };
  });

  // 7. Frequently Combined Services
  const woServicesGroup: Record<number, number[]> = {};
  allWoServices.forEach((ws) => {
    if (!woServicesGroup[ws.workOrderId]) {
      woServicesGroup[ws.workOrderId] = [];
    }
    if (!woServicesGroup[ws.workOrderId].includes(ws.serviceId)) {
      woServicesGroup[ws.workOrderId].push(ws.serviceId);
    }
  });

  const pairCounts: Record<string, number> = {};
  Object.values(woServicesGroup).forEach((sIds) => {
    if (sIds.length < 2) return;
    const sortedIds = [...sIds].sort((a, b) => a - b);
    for (let i = 0; i < sortedIds.length; i++) {
      for (let j = i + 1; j < sortedIds.length; j++) {
        const pairKey = `${sortedIds[i]}+${sortedIds[j]}`;
        pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
      }
    }
  });

  const frequentCombinations = Object.entries(pairCounts).map(([pairKey, count]) => {
    const [idA, idB] = pairKey.split("+").map(Number);
    const nameA = serviceMap[idA] || `Service #${idA}`;
    const nameB = serviceMap[idB] || `Service #${idB}`;
    return {
      combination: `${nameA} + ${nameB}`,
      count,
    };
  });
  frequentCombinations.sort((a, b) => b.count - a.count);

  // 8. Service Trend comparing Current Month vs Previous Month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const currentMonthCounts: Record<number, number> = {};
  const previousMonthCounts: Record<number, number> = {};

  allWoServices.forEach((ws) => {
    const wsDate = new Date(ws.createdAt);
    const sId = ws.serviceId;
    if (wsDate >= currentMonthStart) {
      currentMonthCounts[sId] = (currentMonthCounts[sId] || 0) + ws.quantity;
    } else if (wsDate >= previousMonthStart && wsDate < currentMonthStart) {
      previousMonthCounts[sId] = (previousMonthCounts[sId] || 0) + ws.quantity;
    }
  });

  const trends = Object.keys(serviceMap).map((sIdStr) => {
    const sId = Number(sIdStr);
    const currentCount = currentMonthCounts[sId] || 0;
    const previousCount = previousMonthCounts[sId] || 0;
    const serviceName = serviceMap[sId];

    let changePercent = 0;
    let direction: "up" | "down" | "flat" = "flat";

    if (previousCount > 0) {
      changePercent = Math.round(((currentCount - previousCount) / previousCount) * 100);
    } else if (currentCount > 0) {
      changePercent = 100;
    }

    if (changePercent > 0) {
      direction = "up";
    } else if (changePercent < 0) {
      direction = "down";
    }

    return {
      serviceName,
      changePercent: Math.abs(changePercent),
      direction,
    };
  });

  // 9. Service Contribution
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#7c3aed", "#64748b"];
  const contribution = revenueByService.map((rs, idx) => {
    const percentage = totalRevenue > 0 ? Number(((rs.revenue / totalRevenue) * 100).toFixed(1)) : 0;
    return {
      category: rs.serviceName,
      revenue: rs.revenue,
      percentage,
      color: colors[idx % colors.length],
    };
  });

  // 10. Mechanics by Service Count
  const mechanicServices: Record<string, { completedServices: number; revenue: number }> = {};
  allWoServices.forEach((ws) => {
    const mechanicName = ws.workOrder?.mechanic?.name || "Unassigned";
    if (!mechanicServices[mechanicName]) {
      mechanicServices[mechanicName] = { completedServices: 0, revenue: 0 };
    }
    mechanicServices[mechanicName].completedServices += ws.quantity;
    mechanicServices[mechanicName].revenue += ws.subtotal;
  });

  const mechanics = Object.entries(mechanicServices).map(([name, data]) => {
    const averageValue = data.completedServices > 0 ? Math.round(data.revenue / data.completedServices) : 0;
    return {
      mechanicName: name,
      completedServices: data.completedServices,
      revenue: data.revenue,
      averageValue,
    };
  });
  mechanics.sort((a, b) => b.completedServices - a.completedServices);

  return {
    summary: {
      totalServices,
      totalRevenue,
      averageValue,
      mostPopularService,
      leastPopularService,
    },
    dailyTrend,
    monthlyTrend,
    popularity,
    revenueByService,
    performance,
    frequentCombinations,
    trends,
    contribution,
    mechanics,
  };
}
