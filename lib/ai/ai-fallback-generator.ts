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
      priorityActions: [
        {
          priority: 1,
          title: "Catat Transaksi Work Order",
          description: "Mulai masukkan data pengerjaan servis kendaraan di sistem.",
          impact: "HIGH",
          reason: "Data transaksi awal dibutuhkan untuk menghasilkan analisis dan prioritas aksi.",
          actionLabel: "Input Work Order",
          actionTarget: "/work-orders",
        },
      ],
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

  // 5. Build Priority Actions based on business priority score rules
  interface PriorityCandidate {
    score: number;
    title: string;
    description: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
    estimatedRevenue?: number;
    estimatedSaving?: number;
    reason: string;
    actionLabel: string;
    actionTarget: string;
    why: {
      summary: string;
      evidence: string[];
    };
  }

  const priorityCandidates: PriorityCandidate[] = [];

  // OUT OF STOCK -> Score: 100, Impact: HIGH
  if (inventory.outOfStockCount > 0) {
    priorityCandidates.push({
      score: 100,
      title: "Restock Suku Cadang Habis",
      description: `Terdapat ${inventory.outOfStockCount} jenis suku cadang dengan stok 0 yang berpotensi menghentikan servis.`,
      impact: "HIGH",
      reason: "Stok habis berdampak langsung pada penundaan atau pembatalan Work Order aktif.",
      actionLabel: "Lihat Stok",
      actionTarget: "/inventory",
      why: {
        summary: "Suku cadang habis menghambat penyelesaian Work Order.",
        evidence: [`Terdapat ${inventory.outOfStockCount} jenis barang berstok 0`],
      },
    });
  }

  // Revenue drop -> Score: 90, Impact: HIGH
  if (revenue.changePercent !== null && revenue.changePercent < 0) {
    priorityCandidates.push({
      score: 90,
      title: "Pulihkan Penurunan Pendapatan",
      description: `Pendapatan turun ${Math.abs(revenue.changePercent)}% dibanding periode sebelumnya.`,
      impact: "HIGH",
      reason: "Perlu percepatan transaksi dan jangkauan pelanggan untuk mengembalikan arus kas.",
      actionLabel: "Lihat Revenue",
      actionTarget: "/reports",
      why: {
        summary: "Pendapatan menunjukkan penurunan material dari periode lalu.",
        evidence: [`Pendapatan berkurang ${Math.abs(revenue.changePercent)}%`],
      },
    });
  }

  // Inactive customers -> Score: 80, Impact: HIGH
  if (customers.inactiveCustomers > 0) {
    const avgTicket = data.averageTicket?.current || 200000;
    priorityCandidates.push({
      score: 80,
      title: "Hubungi Pelanggan Inaktif",
      description: `${customers.inactiveCustomers} pelanggan belum kembali ke bengkel dalam 6 bulan terakhir.`,
      impact: "HIGH",
      estimatedRevenue: customers.inactiveCustomers * avgTicket,
      reason: "Pelanggan inaktif memiliki peluang kunjungan ulang tinggi dengan penjangkauan pengingat servis.",
      actionLabel: "Lihat Pelanggan",
      actionTarget: "/customers",
      why: {
        summary: "Pelanggan lama merupakan aset retensi berharga dengan rasio konversi tinggi.",
        evidence: [`${customers.inactiveCustomers} pelanggan tidak berkunjung >6 bulan`],
      },
    });
  }

  // Low stock -> Score: 70, Impact: MEDIUM
  if (inventory.lowStockCount > 0) {
    priorityCandidates.push({
      score: 70,
      title: "Reorder Suku Cadang Kritis",
      description: `Terdapat ${inventory.lowStockCount} jenis suku cadang mendekati batas stok minimum (<= 5 unit).`,
      impact: "MEDIUM",
      reason: "Pemesanan lebih awal mencegah kehabisan stok saat terjadi lonjakan Work Order.",
      actionLabel: "Lihat Inventaris",
      actionTarget: "/inventory",
      why: {
        summary: "Stok suku cadang mendekati batas aman minimum.",
        evidence: [`${inventory.lowStockCount} suku cadang berstok <= 5 unit`],
      },
    });
  }

  // Slow moving stock -> Score: 50, Impact: MEDIUM
  if (inventory.slowMovingItems.length > 0) {
    priorityCandidates.push({
      score: 50,
      title: "Bundling Suku Cadang Lambat Laku",
      description: `Terdapat ${inventory.slowMovingItems.length} barang slow-moving yang tidak terjual dalam 30 hari terakhir.`,
      impact: "MEDIUM",
      reason: "Membebaskan modal kerja tertahan dan mengoptimalkan ruang penyimpanan barang.",
      actionLabel: "Kelola Stok",
      actionTarget: "/inventory",
      why: {
        summary: "Penumpukan suku cadang lambat laku menahan arus kas.",
        evidence: [`${inventory.slowMovingItems.length} item slow-moving tercatat di persediaan`],
      },
    });
  }

  // Declining service -> Score: 40, Impact: LOW
  if (services.decliningServices.length > 0) {
    const topDeclining = services.decliningServices[0];
    priorityCandidates.push({
      score: 40,
      title: `Evaluasi Service ${topDeclining.name}`,
      description: `Permintaan paket service ${topDeclining.name} turun ${Math.abs(topDeclining.changePercent || 0)}%.`,
      impact: "LOW",
      reason: "Penyesuaian promosi atau paket bundling dapat menaikkan kembali volume permintaan.",
      actionLabel: "Lihat Laporan Service",
      actionTarget: "/reports",
      why: {
        summary: "Volume transaksi paket layanan tertentu mengalami penurunan signifikan.",
        evidence: [`Layanan ${topDeclining.name} turun ${Math.abs(topDeclining.changePercent || 0)}%`],
      },
    });
  }

  // Default stable action if no conditions triggered
  if (priorityCandidates.length === 0) {
    priorityCandidates.push({
      score: 10,
      title: "Tingkatkan Kinerja Operasional",
      description: "Jaga konsistensi durasi pengerjaan dan kepuasan pelanggan.",
      impact: "LOW",
      reason: "Kinerja operasional dan stok barang saat ini berjalan dengan stabil.",
      actionLabel: "Buka Work Orders",
      actionTarget: "/work-orders",
      why: {
        summary: "Metrik bisnis dan persediaan berada pada batas aman.",
        evidence: ["Aktivitas transaksi dan persediaan stabil"],
      },
    });
  }

  const priorityActions = priorityCandidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item, index) => ({
      priority: index + 1,
      title: item.title,
      description: item.description,
      impact: item.impact,
      estimatedRevenue: item.estimatedRevenue,
      estimatedSaving: item.estimatedSaving,
      reason: item.reason,
      actionLabel: item.actionLabel,
      actionTarget: item.actionTarget,
      why: item.why,
    }));

  // 6. Build Explanation Evidence (max 5 items)
  const explanationEvidence: Array<{ label: string; value: string; interpretation: string }> = [];

  if (revenue.changePercent !== null) {
    explanationEvidence.push({
      label: "Tren Pendapatan",
      value: `${revenue.changePercent >= 0 ? "+" : ""}${revenue.changePercent}%`,
      interpretation: revenue.changePercent >= 0 ? "Pendapatan menunjukkan pertumbuhan positif." : "Pendapatan mengalami penurunan dibanding periode lalu.",
    });
  }

  if (workOrders.current > 0) {
    explanationEvidence.push({
      label: "Work Orders Selesai",
      value: `${workOrders.current} transaksi`,
      interpretation: `Volume pengerjaan kendaraan pada ${period.label}.`,
    });
  }

  if (inventory.outOfStockCount > 0 || inventory.lowStockCount > 0) {
    explanationEvidence.push({
      label: "Stok Habis / Kritis",
      value: `${inventory.outOfStockCount + inventory.lowStockCount} item`,
      interpretation: "Menunjukkan kebutuhan restock persediaan barang.",
    });
  }

  if (customers.inactiveCustomers > 0) {
    explanationEvidence.push({
      label: "Pelanggan Inaktif",
      value: `${customers.inactiveCustomers} pelanggan`,
      interpretation: "Peluang reaktivasi melalui penjangkauan pengingat.",
    });
  }

  if (services.decliningServices.length > 0) {
    explanationEvidence.push({
      label: "Layanan Menurun",
      value: services.decliningServices[0].name,
      interpretation: "Perlu evaluasi paket atau promosi khusus.",
    });
  }

  const explanation = {
    title: "Mengapa AI memberikan rekomendasi ini?",
    summary: "AI mengevaluasi indikator agregasi bisnis (tren pendapatan, volume work order, tingkat stok, dan pelanggan inaktif) untuk merekomendasikan prioritas operasional terbaik.",
    evidence: explanationEvidence.slice(0, 5),
  };

  const isLimited = workOrders.current > 0 && workOrders.current < 3;

  return {
    summary: summaryText,
    highlights,
    recommendation,
    priorityActions,
    explanation,
    confidence: isLimited ? "MEDIUM" : "HIGH",
    dataQuality: {
      status: isLimited ? "LIMITED" : "SUFFICIENT",
      note: isLimited ? "Data transaksi pada rentang tanggal ini masih terbatas." : null,
    },
  };
}
