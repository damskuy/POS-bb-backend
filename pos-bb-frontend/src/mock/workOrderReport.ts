export interface WOSummaryData {
  totalWO: number;
  totalWOChange: string;
  completed: number;
  completionRate: string;
  inProgress: number;
  waiting: number;
}

export interface WOStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface WOTrendData {
  day: number;
  count: number;
  label: string;
}

export interface MechanicPerfData {
  name: string;
  completed: number;
}

export interface CompletionTimeData {
  average: string;
  fastest: string;
  longest: string;
}

export interface RecentWORow {
  code: string;
  customerName: string;
  plateNumber: string;
  mechanicName: string;
  status: "Waiting" | "In Progress" | "Finished" | "Cancelled";
  createdAt: string;
  finishedAt: string;
  total: number;
}

export interface WOInsightItem {
  id: number;
  text: string;
  type: "success" | "info" | "warning";
}

export const woSummary: WOSummaryData = {
  totalWO: 186,
  totalWOChange: "+12%",
  completed: 160,
  completionRate: "86%",
  inProgress: 18,
  waiting: 8,
};

export const woStatuses: WOStatusData[] = [
  { status: "Finished", count: 160, percentage: 86, color: "#10b981" },
  { status: "In Progress", count: 18, percentage: 10, color: "#2563eb" },
  { status: "Waiting", count: 8, percentage: 4, color: "#f59e0b" },
  { status: "Cancelled", count: 8, percentage: 4, color: "#ef4444" },
];

export const woTrend: WOTrendData[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  // Fluctuate work orders created daily between 3 and 12
  const count = 4 + Math.floor(Math.sin(day / 1.5) * 3) + Math.floor(Math.random() * 5);
  return {
    day,
    count,
    label: `${day} Jul`,
  };
});

export const mechanicPerformance: MechanicPerfData[] = [
  { name: "Agus", completed: 42 },
  { name: "Bayu", completed: 36 },
  { name: "Doni", completed: 31 },
  { name: "Rizky", completed: 28 },
  { name: "Adi", completed: 23 },
];

export const completionTime: CompletionTimeData = {
  average: "2h 35m",
  fastest: "48m",
  longest: "6h 20m",
};

export const recentWorkOrders: RecentWORow[] = [
  { code: "WO-20260722-0001", customerName: "Budi Santoso", plateNumber: "B 1234 ABC", mechanicName: "Agus", status: "In Progress", createdAt: "10:30", finishedAt: "-", total: 750000 },
  { code: "WO-20260722-0002", customerName: "Siti Rahayu", plateNumber: "D 5678 XYZ", mechanicName: "Bayu", status: "Waiting", createdAt: "11:00", finishedAt: "-", total: 350000 },
  { code: "WO-20260721-0001", customerName: "Ahmad Fauzi", plateNumber: "F 9012 DEF", mechanicName: "Doni", status: "Finished", createdAt: "09:15", finishedAt: "11:50", total: 1200000 },
  { code: "WO-20260721-0002", customerName: "Dewi Kurnia", plateNumber: "B 3456 GHI", mechanicName: "Rizky", status: "Finished", createdAt: "10:00", finishedAt: "12:10", total: 450000 },
  { code: "WO-20260720-0001", customerName: "Hendra Wijaya", plateNumber: "H 7890 JKL", mechanicName: "Agus", status: "Finished", createdAt: "08:30", finishedAt: "11:15", total: 850000 },
  { code: "WO-20260720-0002", customerName: "Indah Permata", plateNumber: "L 1122 MNO", mechanicName: "Bayu", status: "Cancelled", createdAt: "13:00", finishedAt: "-", total: 0 },
  { code: "WO-20260719-0001", customerName: "Joko Widodo", plateNumber: "B 4455 PQR", mechanicName: "Doni", status: "Finished", createdAt: "09:00", finishedAt: "11:20", total: 950000 },
  { code: "WO-20260719-0002", customerName: "Kartika Sari", plateNumber: "D 6677 STU", mechanicName: "Rizky", status: "Finished", createdAt: "14:15", finishedAt: "16:45", total: 500000 },
  { code: "WO-20260718-0001", customerName: "Lukman Hakim", plateNumber: "F 8899 VWX", mechanicName: "Adi", status: "Finished", createdAt: "08:15", finishedAt: "10:30", total: 600000 },
  { code: "WO-20260718-0002", customerName: "Mega Utami", plateNumber: "B 9900 YZA", mechanicName: "Agus", status: "Finished", createdAt: "10:45", finishedAt: "13:05", total: 1100000 },
];

export const woInsights: WOInsightItem[] = [
  { id: 1, text: "86% of work orders were completed successfully, indicating strong output efficiency.", type: "success" },
  { id: 2, text: "Agus completed the most work orders (42 WO), contributing to 26% of overall output.", type: "success" },
  { id: 3, text: "Average completion time decreased by 12% (now 2h 35m) compared to last period.", type: "success" },
  { id: 4, text: "Only 4% of work orders were cancelled, maintaining client retention targets.", type: "info" },
];
