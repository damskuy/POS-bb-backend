import { AiInsightDataReport } from "@/lib/reports/ai-insight-data";
import { AiInsightOutput } from "./ai-insight-schema";

/**
 * Deterministic Fallback Generator
 * Produces structured business insights directly from aggregated report metrics
 * without calling any AI providers or external APIs.
 */
export function generateDeterministicFallback(data: AiInsightDataReport): AiInsightOutput {
  const { revenue, workOrders, customers, services, inventory, period } = data;

  // 1. Zero / Empty Data Check
  if (revenue.current === 0 && workOrders.current === 0) {
    return {
      summary: "Belum ada cukup data pada periode ini untuk menghasilkan analisis bisnis yang kuat.",
      highlights: [
        {
          type: "warning",
          title: "Transaksi Belum Tersedia",
          description: "Belum ada transaksi Work Order atau pendapatan yang tercatat pada periode ini.",
          metric: {
            current: 0,
            previous: 0,
            changePercent: null,
          },
        },
      ],
      recommendation: {
        title: "Input Transaksi Work Order Baru",
        description: "Catat transaksi layanan dan Work Order di menu utama untuk mengumpulkan data analisis.",
        actionLabel: "Buka Work Orders",
        actionTarget: "/work-orders",
      },
      confidence: "LOW",
      dataQuality: {
        status: "INSUFFICIENT",
        note: "Data transaksi nol pada rentang tanggal terpilih.",
      },
    };
  }

  // 2. Build Highlights array based on business rules
  const highlights: AiInsightOutput["highlights"] = [];

  // Revenue drop warning
  if (revenue.changePercent !== null && revenue.changePercent <= -5) {
    highlights.push({
      type: "warning",
      title: "Penurunan Pendapatan",
      description: `Pendapatan periode ini turun ${Math.abs(revenue.changePercent)}% (selisih Rp ${Math.abs(revenue.absoluteChange).toLocaleString("id-ID")}) dibanding periode sebelumnya.`,
      metric: {
        current: revenue.current,
        previous: revenue.previous,
        changePercent: revenue.changePercent,
      },
    });
  } else if (revenue.changePercent !== null && revenue.changePercent > 0) {
    highlights.push({
      type: "positive",
      title: "Pertumbuhan Pendapatan Positif",
      description: `Pendapatan meningkat ${revenue.changePercent}% menjadi Rp ${revenue.current.toLocaleString("id-ID")} didorong oleh aktivitas transaksi bengkel.`,
      metric: {
        current: revenue.current,
        previous: revenue.previous,
        changePercent: revenue.changePercent,
      },
    });
  }

  // Out of stock warning
  if (inventory.outOfStockCount > 0 && highlights.length < 3) {
    highlights.push({
      type: "warning",
      title: "Suku Cadang Habis",
      description: `Terdapat ${inventory.outOfStockCount} suku cadang dengan stok 0 yang berpotensi menghambat pengerjaan Work Order.`,
    });
  }

  // Low stock warning
  if (inventory.lowStockCount > 0 && highlights.length < 3) {
    highlights.push({
      type: "warning",
      title: "Stok Suku Cadang Kritis",
      description: `Terdapat ${inventory.lowStockCount} suku cadang mendekati batas minimum stok (sisa <= 5 unit).`,
    });
  }

  // Declining service warning
  if (services.decliningServices.length > 0 && highlights.length < 3) {
    const topDeclining = services.decliningServices[0];
    highlights.push({
      type: "warning",
      title: "Penurunan Permintaan Layanan",
      description: `Layanan ${topDeclining.name} mengalami penurunan volume pengerjaan sebesar ${Math.abs(topDeclining.changePercent || 0)}%.`,
      metric: {
        current: topDeclining.currentQuantity,
        previous: topDeclining.previousQuantity,
        changePercent: topDeclining.changePercent,
      },
    });
  }

  // Inactive customers opportunity
  if (customers.inactiveCustomers > 0 && highlights.length < 3) {
    highlights.push({
      type: "opportunity",
      title: "Peluang Retensi Pelanggan",
      description: `Terdapat ${customers.inactiveCustomers} pelanggan yang tidak berkunjung dalam 6 bulan terakhir.`,
    });
  }

  // Ensure at least 1 highlight
  if (highlights.length === 0) {
    highlights.push({
      type: "positive",
      title: "Operasional Stabil",
      description: `Pendapatan dan Work Order periode ini berjalan stabil pada ${period.label}.`,
      metric: {
        current: revenue.current,
        previous: revenue.previous,
        changePercent: revenue.changePercent,
      },
    });
  }

  // 3. Select Single Priority Recommendation
  let recommendation: AiInsightOutput["recommendation"];

  if (inventory.outOfStockCount > 0 || inventory.lowStockCount > 0) {
    recommendation = {
      title: "Pengadaan & Restock Suku Cadang",
      description: "Segera reorder suku cadang yang habis dan kritis untuk menjaga kelancaran servis kendaraan.",
      actionLabel: "Cek Inventaris",
      actionTarget: "/inventory",
    };
  } else if (customers.inactiveCustomers > 5) {
    recommendation = {
      title: "Penjangkauan Pelanggan Inaktif",
      description: "Kirimkan pengingat servis atau promosi berkala untuk mengajak pelanggan inaktif berkunjung kembali.",
      actionLabel: "Lihat Pelanggan",
      actionTarget: "/customers",
    };
  } else if (services.decliningServices.length > 0) {
    recommendation = {
      title: "Evaluasi Paket Layanan",
      description: `Tinjau kembali tarif dan kualitas promo pada layanan ${services.decliningServices[0].name}.`,
      actionLabel: "Lihat Laporan Layanan",
      actionTarget: "/reports",
    };
  } else {
    recommendation = {
      title: "Pertahankan Kinerja Operasional",
      description: "Jaga kualitas layanan dan tingkatkan kepuasan pelanggan pada periode operasional mendatang.",
      actionLabel: "Buka Laporan Terpadu",
      actionTarget: "/reports",
    };
  }

  // 4. Generate Concise Summary (max 2 sentences)
  let summaryText = "";
  if (revenue.changePercent !== null && revenue.changePercent < 0) {
    summaryText = `Pendapatan periode ini turun ${Math.abs(revenue.changePercent)}% menjadi Rp ${revenue.current.toLocaleString("id-ID")}. Prioritaskan restock suku cadang dan retensi pelanggan untuk memulihkan pendapatan.`;
  } else {
    summaryText = `Kinerja bisnis bengkel pada ${period.label} relatif stabil dengan total pendapatan Rp ${revenue.current.toLocaleString("id-ID")}. Pertahankan kualitas operasional dan kelengkapan stok barang.`;
  }

  const isLimited = workOrders.current > 0 && workOrders.current < 3;

  return {
    summary: summaryText,
    highlights,
    recommendation,
    confidence: isLimited ? "MEDIUM" : "HIGH",
    dataQuality: {
      status: isLimited ? "LIMITED" : "SUFFICIENT",
      note: isLimited ? "Data transaksi pada rentang tanggal ini masih terbatas." : null,
    },
  };
}
