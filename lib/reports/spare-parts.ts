import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface SparePartsReportFilter {
  limit?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface InventoryAnalyticsReport {
  summary: {
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalRevenue: number;
  };
  topSelling: Array<{
    sparePartName: string;
    totalQuantity: number;
    revenue: number;
  }>;
  distribution: Array<{
    category: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  movement: Array<{
    date: string;
    label: string;
    count: number;
  }>;
  lowStockList: Array<{
    id: number;
    name: string;
    sku: string | null;
    stock: number;
    price: number;
  }>;
  slowMoving: Array<{
    id: number;
    name: string;
    sku: string | null;
    stock: number;
    price: number;
    lastSold: string | null;
  }>;
  insights: Array<{
    id: number;
    type: "success" | "info" | "warning";
    text: string;
  }>;
}

export async function getSparePartsReport(filter: SparePartsReportFilter = {}): Promise<InventoryAnalyticsReport> {
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

  // 1. Fetch all non-deleted spare parts
  const allParts = await prisma.sparePart.findMany({
    where: { deletedAt: null },
  });

  const totalItems = allParts.length;
  const totalValue = allParts.reduce((sum, p) => sum + p.stock * p.price, 0);
  const lowStockCount = allParts.filter((p) => p.stock <= 5 && p.stock > 0).length;
  const outOfStockCount = allParts.filter((p) => p.stock === 0).length;
  const lowStockList = allParts.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock);

  // 2. Fetch sales from WorkOrderPart table
  const wopWhere: Prisma.WorkOrderPartWhereInput = {
    deletedAt: null,
    workOrder: woWhere,
  };

  const [groupedParts, allSales] = await Promise.all([
    prisma.workOrderPart.groupBy({
      by: ["sparePartId"],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      where: wopWhere,
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
    }),
    prisma.workOrderPart.findMany({
      where: wopWhere,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalRevenue = allSales.reduce((sum, item) => sum + item.subtotal, 0);

  // Map top selling
  const partMap = new Map(allParts.map((p) => [p.id, p]));
  const topSelling = groupedParts.map((g) => {
    const part = partMap.get(g.sparePartId);
    return {
      sparePartName: part?.name || `Part #${g.sparePartId}`,
      totalQuantity: g._sum.quantity || 0,
      revenue: g._sum.subtotal || 0,
    };
  });

  // 3. Category Value Distribution
  const classifyPart = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("oli") || lower.includes("pelumas") || lower.includes("lubricant")) {
      return "Oli & Pelumas";
    }
    if (lower.includes("rem") || lower.includes("brake") || lower.includes("pad") || lower.includes("disc")) {
      return "Sistem Pengereman";
    }
    if (lower.includes("ban") || lower.includes("tire") || lower.includes("shock") || lower.includes("suspension") || lower.includes("velg")) {
      return "Ban & Kaki-kaki";
    }
    if (lower.includes("aki") || lower.includes("accu") || lower.includes("busi") || lower.includes("kabel") || lower.includes("lampu") || lower.includes("battery")) {
      return "Kelistrikan & Aki";
    }
    return "Suku Cadang Mesin";
  };

  const categoryValues: Record<string, number> = {
    "Oli & Pelumas": 0,
    "Suku Cadang Mesin": 0,
    "Sistem Pengereman": 0,
    "Ban & Kaki-kaki": 0,
    "Kelistrikan & Aki": 0,
  };

  allParts.forEach((p) => {
    const cat = classifyPart(p.name);
    categoryValues[cat] = (categoryValues[cat] || 0) + p.stock * p.price;
  });

  const categoryColors: Record<string, string> = {
    "Oli & Pelumas": "#10b981",
    "Suku Cadang Mesin": "#3b82f6",
    "Sistem Pengereman": "#f59e0b",
    "Ban & Kaki-kaki": "#ef4444",
    "Kelistrikan & Aki": "#7c3aed",
  };

  const distribution = Object.entries(categoryValues).map(([category, value]) => {
    const percentage = totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(1)) : 0;
    return {
      category,
      value,
      percentage,
      color: categoryColors[category] || "#64748b",
    };
  });

  // 4. Daily Sales Movement (last 30 days)
  const movementMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    movementMap[dateStr] = 0;
  }

  allSales.forEach((s) => {
    const dateStr = s.createdAt.toISOString().split("T")[0];
    if (dateStr in movementMap) {
      movementMap[dateStr] += s.quantity;
    }
  });

  const movement = Object.entries(movementMap)
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

  // 5. Slow Moving Parts (having stock > 0, but sold the least or not at all)
  const soldQuantities: Record<number, number> = {};
  const partLastSold: Record<number, Date> = {};
  allSales.forEach((s) => {
    soldQuantities[s.sparePartId] = (soldQuantities[s.sparePartId] || 0) + s.quantity;
    const sDate = new Date(s.createdAt);
    if (!partLastSold[s.sparePartId] || sDate > partLastSold[s.sparePartId]) {
      partLastSold[s.sparePartId] = sDate;
    }
  });

  const slowMoving = allParts
    .filter((p) => p.stock > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      price: p.price,
      soldCount: soldQuantities[p.id] || 0,
      lastSold: partLastSold[p.id] ? partLastSold[p.id].toISOString() : null,
    }))
    .sort((a, b) => a.soldCount - b.soldCount || b.stock - a.stock)
    .slice(0, 10);

  // 6. Dynamic Insights
  const insights: Array<{ id: number; type: "success" | "info" | "warning"; text: string }> = [
    {
      id: 1,
      type: "info" as const,
      text: `Total nilai inventaris yang tersimpan di bengkel saat ini adalah ${totalValue.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}.`,
    },
    {
      id: 2,
      type: lowStockCount > 3 ? ("warning" as const) : ("success" as const),
      text:
        lowStockCount > 3
          ? `Ada ${lowStockCount} barang yang stoknya di bawah batas aman (<= 5 pcs). Silakan lakukan restock segera.`
          : "Tingkat ketersediaan stok barang aman, tidak ada ancaman kelangkaan part kritis.",
    },
    {
      id: 3,
      type: slowMoving.filter((p) => p.soldCount === 0).length > 2 ? ("warning" as const) : ("success" as const),
      text:
        slowMoving.filter((p) => p.soldCount === 0).length > 2
          ? "Terdeteksi beberapa suku cadang mati/slow-moving yang tidak terjual sama sekali. Evaluasi volume pembelian."
          : "Perputaran arus keluar masuk barang (turnover stock) berjalan seimbang.",
    },
  ];

  return {
    summary: {
      totalItems,
      totalValue,
      lowStockCount,
      outOfStockCount,
      totalRevenue,
    },
    topSelling,
    distribution,
    movement,
    lowStockList,
    slowMoving,
    insights,
  };
}
