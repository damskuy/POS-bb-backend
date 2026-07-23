export interface InventorySummaryData {
  totalValue: number;
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface TopSellingPart {
  name: string;
  quantitySold: number;
}

export interface InventoryMovementData {
  day: number;
  label: string;
  stockIn: number;
  stockOut: number;
}

export interface LowStockAlert {
  partName: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  supplier: string;
  status: "Critical" | "Low";
}

export interface InventoryValueCategory {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface SlowMovingItem {
  partName: string;
  lastSold: string;
  currentStock: number;
  daysWithoutSales: number;
  inventoryValue: number;
}

export interface InventoryInsightItem {
  id: number;
  text: string;
  type: "success" | "info" | "warning" | "danger";
}

export const inventorySummary: InventorySummaryData = {
  totalValue: 126850000,
  totalItems: 458,
  lowStockCount: 12,
  outOfStockCount: 3,
};

export const topSellingParts: TopSellingPart[] = [
  { name: "Engine Oil Shell Helix 10W-40", quantitySold: 145 },
  { name: "Brake Pads Honda Vario Front", quantitySold: 102 },
  { name: "Spark Plug NGK CR7HSA", quantitySold: 95 },
  { name: "CVT Drive Belt Honda Beat", quantitySold: 72 },
  { name: "Tubeless Tire IRC 90/90-14", quantitySold: 61 },
  { name: "Air Filter Yamaha NMAX", quantitySold: 55 },
  { name: "Brake Fluid Jumbo DOT 4", quantitySold: 48 },
  { name: "Battery GS Astra GTZ5S", quantitySold: 42 },
  { name: "Drive Chain Kit Yamaha Jupiter", quantitySold: 35 },
  { name: "Front Shock Absorber KYB", quantitySold: 28 },
];

// Generate 30 days of inventory movement (Stock In vs Stock Out)
export const inventoryMovement: InventoryMovementData[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  // Generate random yet realistic fluctuating daily movement
  // Stock In has occasional spikes (shipments)
  const isShipmentDay = day % 8 === 0;
  const stockIn = isShipmentDay ? 80 + Math.floor(Math.random() * 60) : Math.floor(Math.random() * 15);
  
  // Stock Out fluctuates with daily sales
  const stockOut = 15 + Math.floor(Math.sin(day / 2.5) * 8) + Math.floor(Math.random() * 10);
  
  return {
    day,
    label: `${day} Jul`,
    stockIn,
    stockOut,
  };
});

export const lowStockAlerts: LowStockAlert[] = [
  {
    partName: "Brake Pads Honda Vario Front",
    sku: "SP-BRK-012",
    currentStock: 0,
    minimumStock: 8,
    supplier: "Astra Otoparts",
    status: "Critical",
  },
  {
    partName: "Spark Plug NGK CR7HSA",
    sku: "SP-ELC-023",
    currentStock: 0,
    minimumStock: 20,
    supplier: "NGK Busi Indonesia",
    status: "Critical",
  },
  {
    partName: "Battery GS Astra GTZ5S",
    sku: "SP-ELC-002",
    currentStock: 0,
    minimumStock: 6,
    supplier: "Astra Otoparts",
    status: "Critical",
  },
  {
    partName: "Engine Oil Shell Helix 10W-40",
    sku: "SP-ENG-001",
    currentStock: 2,
    minimumStock: 15,
    supplier: "Pertamina Lubricants",
    status: "Low",
  },
  {
    partName: "Tubeless Tire IRC 90/90-14",
    sku: "SP-TIR-004",
    currentStock: 3,
    minimumStock: 10,
    supplier: "IRC Tire Indonesia",
    status: "Low",
  },
  {
    partName: "CVT Drive Belt Honda Beat",
    sku: "SP-CVT-008",
    currentStock: 4,
    minimumStock: 12,
    supplier: "Astra Otoparts",
    status: "Low",
  },
  {
    partName: "Front Shock Absorber KYB",
    sku: "SP-SHK-005",
    currentStock: 2,
    minimumStock: 5,
    supplier: "Kayaba Indonesia",
    status: "Low",
  },
  {
    partName: "Air Filter Yamaha NMAX",
    sku: "SP-FLT-015",
    currentStock: 3,
    minimumStock: 10,
    supplier: "Astra Otoparts",
    status: "Low",
  },
];

export const inventoryValueDistribution: InventoryValueCategory[] = [
  { category: "Lubricants", value: 35000000, percentage: 27.6, color: "#10b981" }, // Emerald
  { category: "Tires", value: 28000000, percentage: 22.1, color: "#2563eb" }, // Blue
  { category: "Engine Parts", value: 25000000, percentage: 19.7, color: "#f59e0b" }, // Amber
  { category: "Brakes", value: 18500000, percentage: 14.6, color: "#ef4444" }, // Red
  { category: "Electrical", value: 14500000, percentage: 11.4, color: "#7c3aed" }, // Violet
  { category: "Accessories", value: 5850000, percentage: 4.6, color: "#64748b" }, // Slate
];

export const slowMovingItems: SlowMovingItem[] = [
  {
    partName: "Helm Suzuki Half Face Black",
    lastSold: "2026-04-15",
    currentStock: 12,
    daysWithoutSales: 99,
    inventoryValue: 3600000,
  },
  {
    partName: "Exhaust Pipe Racing R9 Beat",
    lastSold: "2026-05-10",
    currentStock: 4,
    daysWithoutSales: 74,
    inventoryValue: 2400000,
  },
  {
    partName: "LED Turn Signal Light kit",
    lastSold: "2026-05-20",
    currentStock: 25,
    daysWithoutSales: 64,
    inventoryValue: 1250000,
  },
  {
    partName: "CNC Adjustable Brake Lever Pair",
    lastSold: "2026-06-12",
    currentStock: 8,
    daysWithoutSales: 41,
    inventoryValue: 640000,
  },
  {
    partName: "Handle Grip Protaper Sport",
    lastSold: "2026-06-25",
    currentStock: 15,
    daysWithoutSales: 28,
    inventoryValue: 450000,
  },
];

export const inventoryInsights: InventoryInsightItem[] = [
  {
    id: 1,
    text: "Engine Oil remains the best-selling item with 145 units sold this month.",
    type: "success",
  },
  {
    id: 2,
    text: "12 products are below minimum stock level and need reordering.",
    type: "warning",
  },
  {
    id: 3,
    text: "Total inventory value increased by 8% compared to the start of this month.",
    type: "info",
  },
  {
    id: 4,
    text: "3 products (including Helm Suzuki Half Face) have not sold in over 90 days.",
    type: "danger",
  },
];
