import { AiInsightDataReport } from "@/lib/reports/ai-insight-data";

export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AnomalyCategory =
  | "REVENUE"
  | "WORK_ORDER"
  | "CUSTOMER"
  | "INVENTORY"
  | "SERVICE"
  | "MECHANIC";

export interface DetectedAnomaly {
  severity: AnomalySeverity;
  category: AnomalyCategory;
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
  actionTarget: string;
}

export interface AnomalyThresholds {
  revenueDropCritical: number; // e.g. -40 (%)
  revenueDropHigh: number;     // e.g. -20 (%)
  revenueSpikeMedium: number;  // e.g. 50 (%)
  workOrderDropHigh: number;   // e.g. -30 (%)
  workOrderSpikeLow: number;   // e.g. 50 (%)
  inactiveCustomerIncreaseMedium: number; // e.g. 30 (%) or count > 10
  mechanicImbalanceRatio: number;         // e.g. 2.0
}

export const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  revenueDropCritical: -40,
  revenueDropHigh: -20,
  revenueSpikeMedium: 50,
  workOrderDropHigh: -30,
  workOrderSpikeLow: 50,
  inactiveCustomerIncreaseMedium: 30,
  mechanicImbalanceRatio: 2.0,
};

/**
 * Deterministic Anomaly Detection Engine.
 * Evaluates aggregated business metrics against strict threshold rules.
 * Strictly Anti-PII & zero database access.
 */
export function detectAnomalies(
  data: AiInsightDataReport,
  customThresholds?: Partial<AnomalyThresholds>
): DetectedAnomaly[] {
  const t = { ...DEFAULT_THRESHOLDS, ...customThresholds };
  const anomalies: DetectedAnomaly[] = [];

  const { period, revenue, workOrders, customers, services, inventory, mechanics } = data;

  // 1. REVENUE ANOMALIES
  if (revenue.changePercent !== null) {
    if (revenue.changePercent <= t.revenueDropCritical) {
      anomalies.push({
        severity: "CRITICAL",
        category: "REVENUE",
        title: `Penurunan Pendapatan Drastis (${Math.abs(revenue.changePercent)}%)`,
        description: `Pendapatan pada ${period.label} mengalami penurunan drastis sebesar ${Math.abs(revenue.changePercent)}% dibanding periode sebelumnya.`,
        evidence: [
          `Pendapatan: Rp ${revenue.previous.toLocaleString("id-ID")} -> Rp ${revenue.current.toLocaleString("id-ID")}`,
          `Perubahan: ${revenue.changePercent}%`,
        ],
        recommendation: "Evaluasi strategi promosi terbaru dan periksa tren permintaan servis utama.",
        actionTarget: "/reports",
      });
    } else if (revenue.changePercent <= t.revenueDropHigh) {
      anomalies.push({
        severity: "HIGH",
        category: "REVENUE",
        title: `Penurunan Pendapatan Signifikan (${Math.abs(revenue.changePercent)}%)`,
        description: `Pendapatan pada ${period.label} turun ${Math.abs(revenue.changePercent)}% dibanding periode sebelumnya.`,
        evidence: [
          `Pendapatan: Rp ${revenue.previous.toLocaleString("id-ID")} -> Rp ${revenue.current.toLocaleString("id-ID")}`,
          `Penurunan: ${revenue.changePercent}%`,
        ],
        recommendation: "Tinjau penetapan harga paket layanan dan lakukan penjangkauan pelanggan inaktif.",
        actionTarget: "/reports",
      });
    } else if (revenue.changePercent >= t.revenueSpikeMedium) {
      anomalies.push({
        severity: "MEDIUM",
        category: "REVENUE",
        title: `Lonjakan Pendapatan Signifikan (${revenue.changePercent}%)`,
        description: `Pendapatan meningkat signifikan sebesar ${revenue.changePercent}% dibanding periode sebelumnya.`,
        evidence: [
          `Pendapatan: Rp ${revenue.previous.toLocaleString("id-ID")} -> Rp ${revenue.current.toLocaleString("id-ID")}`,
          `Lonjakan: +${revenue.changePercent}%`,
        ],
        recommendation: "Pastikan ketersediaan stok barang dan kapasitas mekanik mencukupi untuk mempertahankan lonjakan ini.",
        actionTarget: "/reports",
      });
    }
  }

  // 2. WORK ORDER ANOMALIES
  if (workOrders.changePercent !== null) {
    if (workOrders.changePercent <= t.workOrderDropHigh) {
      anomalies.push({
        severity: "HIGH",
        category: "WORK_ORDER",
        title: `Penurunan Transaksi Work Order (${Math.abs(workOrders.changePercent)}%)`,
        description: `Jumlah Work Order selesai pada ${period.label} turun sebesar ${Math.abs(workOrders.changePercent)}%.`,
        evidence: [
          `Work Orders Selesai: ${workOrders.previous} -> ${workOrders.current}`,
          `Penurunan: ${workOrders.changePercent}%`,
        ],
        recommendation: "Periksa efisiensi pengerjaan di area bengkel dan tingkatkan konfirmasi estimasi ke pelanggan.",
        actionTarget: "/work-orders",
      });
    } else if (workOrders.changePercent >= t.workOrderSpikeLow) {
      anomalies.push({
        severity: "LOW",
        category: "WORK_ORDER",
        title: `Peningkatan Volume Transaksi Work Order (${workOrders.changePercent}%)`,
        description: `Jumlah Work Order selesai naik signifikan sebesar ${workOrders.changePercent}%.`,
        evidence: [
          `Work Orders Selesai: ${workOrders.previous} -> ${workOrders.current}`,
          `Kenaikan: +${workOrders.changePercent}%`,
        ],
        recommendation: "Pertahankan standar mutu servis dan pastikan alokasi mekanik berjalan lancar.",
        actionTarget: "/work-orders",
      });
    }
  }

  // 3. INVENTORY ANOMALIES
  if (inventory.outOfStockCount > 0) {
    const fastMovingZero = inventory.fastMovingItems.filter((item) => item.totalSold > 0);
    const isTopSellingOut = fastMovingZero.length > 0 || inventory.outOfStockCount >= 2;

    anomalies.push({
      severity: isTopSellingOut ? "HIGH" : "MEDIUM",
      category: "INVENTORY",
      title: isTopSellingOut ? "Stok Suku Cadang Terlaris Habis" : "Suku Cadang Habis",
      description: `Terdapat ${inventory.outOfStockCount} suku cadang dengan stok 0 unit yang membutuhkan penanganan segera.`,
      evidence: [
        `Suku Cadang Habis: ${inventory.outOfStockCount} item`,
        inventory.fastMovingItems[0] ? `Barang Populer: ${inventory.fastMovingItems[0].name}` : "Stok 0 di sistem",
      ],
      recommendation: "Segera terbitkan pesanan pembelian (PO) ke pemasok untuk suku cadang yang stoknya 0.",
      actionTarget: "/spare-parts",
    });
  }

  if (inventory.lowStockCount >= 5) {
    anomalies.push({
      severity: "MEDIUM",
      category: "INVENTORY",
      title: "Banyak Suku Cadang Stok Kritis",
      description: `Terdapat ${inventory.lowStockCount} suku cadang dengan sisa stok di bawah batas minimum (<=5 unit).`,
      evidence: [`Stok Kritis: ${inventory.lowStockCount} item`],
      recommendation: "Jadwalkan pengadaan ulang stok agar pengerjaan servis kendaraan tidak terhambat.",
      actionTarget: "/spare-parts",
    });
  }

  // 4. CUSTOMER ANOMALIES
  if (customers.inactiveCustomers >= 10) {
    anomalies.push({
      severity: "MEDIUM",
      category: "CUSTOMER",
      title: "Jumlah Pelanggan Inaktif Tinggi",
      description: `Terdapat ${customers.inactiveCustomers} pelanggan yang belum kembali berkunjung lebih dari 6 bulan.`,
      evidence: [`Pelanggan Inaktif (>6 bulan): ${customers.inactiveCustomers} orang`],
      recommendation: "Kirim pesan pengingat servis berkala atau promo khusus melalui integrasi WhatsApp.",
      actionTarget: "/customers",
    });
  }

  // 5. SERVICE ANOMALIES
  if (services.decliningServices.length > 0) {
    const mainDeclining = services.decliningServices[0];
    anomalies.push({
      severity: "HIGH",
      category: "SERVICE",
      title: `Penurunan Permintaan Layanan ${mainDeclining.name}`,
      description: `Layanan ${mainDeclining.name} mengalami penurunan permintaan sebesar ${Math.abs(mainDeclining.changePercent || 0)}%.`,
      evidence: [
        `Layanan: ${mainDeclining.name}`,
        `Permintaan: ${mainDeclining.previousQuantity}x -> ${mainDeclining.currentQuantity}x`,
        `Penurunan: ${mainDeclining.changePercent}%`,
      ],
      recommendation: "Evaluasi paket harga atau buat promosi bundling untuk membangkitkan minat servis ini.",
      actionTarget: "/services",
    });
  }

  // 6. MECHANIC ANOMALIES
  if (mechanics && mechanics.imbalanceRatio >= t.mechanicImbalanceRatio && mechanics.maxWorkload >= 3) {
    const topMechanic = mechanics.workloads.sort((a, b) => b.completedWorkOrders - a.completedWorkOrders)[0];
    anomalies.push({
      severity: "MEDIUM",
      category: "MECHANIC",
      title: "Ketidakseimbangan Beban Kerja Mekanik",
      description: `Mekanik ${topMechanic ? topMechanic.name : "tertentu"} memiliki beban kerja ${mechanics.maxWorkload} WO (>2x dari rata-rata ${mechanics.avgWorkload.toFixed(1)} WO).`,
      evidence: [
        `Beban Kerja Maksimal: ${mechanics.maxWorkload} WO`,
        `Rata-rata Mekanik: ${mechanics.avgWorkload.toFixed(1)} WO`,
        `Rasio Ketimpangan: ${mechanics.imbalanceRatio.toFixed(1)}x`,
      ],
      recommendation: "Lakukan redistribusi penugasan Work Order agar beban pengerjaan antar mekanik lebih merata.",
      actionTarget: "/mechanics",
    });
  }

  // Sort anomalies by Severity: CRITICAL -> HIGH -> MEDIUM -> LOW
  const severityRank: Record<AnomalySeverity, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
  };

  anomalies.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return anomalies;
}
