export interface RevenueSummaryData {
  totalRevenue: number;
  totalRevenueChange: string;
  totalInvoices: number;
  totalInvoicesChange: string;
  averageTransaction: number;
  averageTransactionChange: string;
  highestRevenueDayName: string;
  highestRevenueDayValue: number;
}

export interface DailyTrendData {
  day: number;
  revenue: number;
  label: string;
}

export interface PaymentMethodData {
  method: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface TableRowData {
  date: string;
  invoices: number;
  transactions: number;
  revenue: number;
  averageTicket: number;
}

export interface InsightItem {
  id: number;
  text: string;
  type: "success" | "info" | "warning";
}

export const revenueSummary: RevenueSummaryData = {
  totalRevenue: 48250000,
  totalRevenueChange: "+18%",
  totalInvoices: 186,
  totalInvoicesChange: "+12%",
  averageTransaction: 259000,
  averageTransactionChange: "+6%",
  highestRevenueDayName: "Friday",
  highestRevenueDayValue: 5250000,
};

// Generate 30 days of daily trend data
export const dailyTrend: DailyTrendData[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  // Generate random yet realistic fluctuating daily revenue around 1.3M - 2.5M
  // with Fridays (day 5, 12, 19, 26) having higher values
  let baseVal = 1400000 + Math.floor(Math.sin(day / 2) * 400000) + Math.floor(Math.random() * 600000);
  if (day % 7 === 5) {
    baseVal += 1200000; // Friday spike
  }
  return {
    day,
    revenue: baseVal,
    label: `${day} Jul`,
  };
});

export const paymentMethods: PaymentMethodData[] = [
  { method: "Cash", percentage: 42, amount: 20265000, color: "#10b981" },
  { method: "Transfer", percentage: 33, amount: 15922500, color: "#2563eb" },
  { method: "QRIS", percentage: 18, amount: 8685000, color: "#7c3aed" },
  { method: "Credit", percentage: 7, amount: 3377500, color: "#f59e0b" },
];

export const dailyTableData: TableRowData[] = [
  { date: "22 Jul", invoices: 14, transactions: 16, revenue: 2850000, averageTicket: 178125 },
  { date: "21 Jul", invoices: 15, transactions: 18, revenue: 3250000, averageTicket: 180000 },
  { date: "20 Jul", invoices: 12, transactions: 13, revenue: 2100000, averageTicket: 161538 },
  { date: "19 Jul", invoices: 8,  transactions: 8,  revenue: 1450000, averageTicket: 181250 },
  { date: "18 Jul", invoices: 18, transactions: 20, revenue: 4100000, averageTicket: 205000 },
  { date: "17 Jul", invoices: 22, transactions: 25, revenue: 5250000, averageTicket: 210000 },
  { date: "16 Jul", invoices: 16, transactions: 17, revenue: 3050000, averageTicket: 179412 },
  { date: "15 Jul", invoices: 11, transactions: 12, revenue: 1950000, averageTicket: 162500 },
  { date: "14 Jul", invoices: 13, transactions: 15, revenue: 2400000, averageTicket: 160000 },
  { date: "13 Jul", invoices: 14, transactions: 14, revenue: 2300000, averageTicket: 164285 },
];

export const revenueInsights: InsightItem[] = [
  {
    id: 1,
    text: "Revenue increased 18% compared to previous month, driven by a higher volume of premium vehicle services.",
    type: "success",
  },
  {
    id: 2,
    text: "Average transaction size increased 6% (now Rp259.000), showing successful upsells of regular packages.",
    type: "success",
  },
  {
    id: 3,
    text: "Friday generated the highest income, averaging Rp5.250.000, mainly due to weekend check-in preparations.",
    type: "info",
  },
  {
    id: 4,
    text: "Cash contributes 42% of total revenue, representing the most common payment method used by customers.",
    type: "info",
  },
];
