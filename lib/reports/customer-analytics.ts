import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CustomerAnalyticsReport {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    newCustomersThisMonth: number;
    returningCustomersPercent: number;
  };
  growth: Array<{
    monthKey: string;
    label: string;
    count: number;
  }>;
  topCustomers: Array<{
    customerId: number;
    name: string;
    phone: string;
    totalVisits: number;
    totalSpending: number;
    lastVisit: string | null;
    averageInvoice: number;
  }>;
  inactiveCustomers: Array<{
    id: number;
    name: string;
    phone: string;
    lastVisit: string | null;
    daysSinceLastVisit: number;
  }>;
  spendingDistribution: Array<{
    bracket: string;
    count: number;
  }>;
  visitFrequency: {
    averageVisits: number;
    oneTimeCustomers: number;
    repeatCustomers: number;
  };
  popularServices: Array<{
    serviceName: string;
    totalUsage: number;
  }>;
}

export async function getCustomerAnalytics(): Promise<CustomerAnalyticsReport> {
  const now = new Date();

  // 1. Fetch all active (non-deleted) customers
  const allCustomers = await prisma.customer.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
    },
  });

  const totalCustomers = allCustomers.length;

  // 2. Fetch all non-deleted Work Orders to compute statistics
  const allWorkOrders = await prisma.workOrder.findMany({
    where: {
      deletedAt: null,
      customer: { deletedAt: null },
    },
    select: {
      id: true,
      customerId: true,
      grandTotal: true,
      createdAt: true,
    },
  });

  // Helper map: customerId -> array of their work orders
  const customerWoMap = new Map<number, typeof allWorkOrders>();
  allWorkOrders.forEach((wo) => {
    if (!customerWoMap.has(wo.customerId)) {
      customerWoMap.set(wo.customerId, []);
    }
    customerWoMap.get(wo.customerId)!.push(wo);
  });

  // 3. Calculate active vs inactive customers
  // Active = visited (has a work order) in the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  let activeCustomersCount = 0;
  const inactiveCustomersList: CustomerAnalyticsReport["inactiveCustomers"] = [];

  allCustomers.forEach((cust) => {
    const wos = customerWoMap.get(cust.id) || [];
    let lastVisitDate: Date | null = null;

    for (const wo of wos) {
      const woDate = new Date(wo.createdAt);
      if (!lastVisitDate || woDate > lastVisitDate) {
        lastVisitDate = woDate;
      }
    }

    let daysSinceLastVisit = 9999;
    if (lastVisitDate) {
      const diffTime = Math.abs(now.getTime() - lastVisitDate.getTime());
      daysSinceLastVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const isActive = lastVisitDate && lastVisitDate >= sixMonthsAgo;
    if (isActive) {
      activeCustomersCount++;
    } else {
      inactiveCustomersList.push({
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        lastVisit: lastVisitDate ? lastVisitDate.toISOString() : null,
        daysSinceLastVisit,
      });
    }
  });

  const inactiveCustomersCount = totalCustomers - activeCustomersCount;

  // 4. Calculate new customers this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const newCustomersThisMonth = allCustomers.filter(
    (c) => new Date(c.createdAt) >= startOfMonth
  ).length;

  // 5. Returning Customers % (visited >= 2 times)
  const repeatCustomersCount = Array.from(customerWoMap.values()).filter(
    (wos) => wos.length >= 2
  ).length;
  const returningCustomersPercent =
    totalCustomers > 0 ? Math.round((repeatCustomersCount / totalCustomers) * 100) : 0;

  // 6. Customer Growth over the last 12 months
  const growthData: CustomerAnalyticsReport["growth"] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    // Locale formatting for Indonesian month abbreviation e.g., "Jul 26"
    const monthLabel = d.toLocaleString("id-ID", { month: "short", year: "2-digit" });
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    growthData.push({ monthKey, label: monthLabel, count: 0 });
  }

  allCustomers.forEach((cust) => {
    const custDate = new Date(cust.createdAt);
    const key = `${custDate.getFullYear()}-${String(custDate.getMonth() + 1).padStart(2, "0")}`;
    const growthItem = growthData.find((g) => g.monthKey === key);
    if (growthItem) {
      growthItem.count++;
    }
  });

  // 7. Top Customers
  const topCustomers: CustomerAnalyticsReport["topCustomers"] = [];
  allCustomers.forEach((cust) => {
    const wos = customerWoMap.get(cust.id) || [];
    if (wos.length === 0) return;

    let totalSpending = 0;
    let lastVisitDate: Date | null = null;

    for (const wo of wos) {
      totalSpending += wo.grandTotal;
      const woDate = new Date(wo.createdAt);
      if (!lastVisitDate || woDate > lastVisitDate) {
        lastVisitDate = woDate;
      }
    }

    const totalVisits = wos.length;
    const averageInvoice = totalVisits > 0 ? Math.round(totalSpending / totalVisits) : 0;

    topCustomers.push({
      customerId: cust.id,
      name: cust.name,
      phone: cust.phone,
      totalVisits,
      totalSpending,
      lastVisit: lastVisitDate ? (lastVisitDate as Date).toISOString() : null,
      averageInvoice,
    });
  });

  // Default sorting: spending descending
  topCustomers.sort((a, b) => b.totalSpending - a.totalSpending);

  // 8. Customer Spending Distribution
  let bracketUnder500k = 0;
  let bracket500kTo1M = 0;
  let bracket1MTo5M = 0;
  let bracketOver5M = 0;

  topCustomers.forEach((tc) => {
    if (tc.totalSpending < 500000) {
      bracketUnder500k++;
    } else if (tc.totalSpending <= 1000000) {
      bracket500kTo1M++;
    } else if (tc.totalSpending <= 5000000) {
      bracket1MTo5M++;
    } else {
      bracketOver5M++;
    }
  });

  // Add customers who have never visited (they have spent 0)
  const neverVisitedCount = totalCustomers - topCustomers.length;
  bracketUnder500k += Math.max(0, neverVisitedCount);

  const spendingDistribution = [
    { bracket: "< Rp500K", count: bracketUnder500k },
    { bracket: "Rp500K–1M", count: bracket500kTo1M },
    { bracket: "Rp1M–5M", count: bracket1MTo5M },
    { bracket: "> Rp5M", count: bracketOver5M },
  ];

  // 9. Visit Frequency Metrics
  const oneTimeCustomersCount = allCustomers.filter((cust) => {
    const visits = (customerWoMap.get(cust.id) || []).length;
    return visits === 1 || visits === 0; // include 0 or exactly 1 visit
  }).length;

  const totalVisitsCount = allWorkOrders.length;
  const averageVisits = totalCustomers > 0 ? Number((totalVisitsCount / totalCustomers).toFixed(1)) : 0;

  const visitFrequency = {
    averageVisits,
    oneTimeCustomers: oneTimeCustomersCount,
    repeatCustomers: repeatCustomersCount,
  };

  // 10. Most Popular Services
  const popularServicesGroup = await prisma.workOrderService.groupBy({
    by: ["serviceId"],
    _sum: {
      quantity: true,
    },
    where: {
      deletedAt: null,
      workOrder: { deletedAt: null },
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 10,
  });

  const popularServiceIds = popularServicesGroup.map((ps) => ps.serviceId);
  const dbServices = await prisma.service.findMany({
    where: { id: { in: popularServiceIds } },
    select: { id: true, name: true },
  });
  const serviceNameMap = new Map(dbServices.map((s) => [s.id, s.name]));

  const popularServices = popularServicesGroup.map((ps) => ({
    serviceName: serviceNameMap.get(ps.serviceId) || `Service #${ps.serviceId}`,
    totalUsage: ps._sum.quantity || 0,
  }));

  return {
    summary: {
      totalCustomers,
      activeCustomers: activeCustomersCount,
      inactiveCustomers: inactiveCustomersCount,
      newCustomersThisMonth,
      returningCustomersPercent,
    },
    growth: growthData,
    topCustomers,
    inactiveCustomers: inactiveCustomersList,
    spendingDistribution,
    visitFrequency,
    popularServices,
  };
}
