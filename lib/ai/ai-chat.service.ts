import { getAiInsightData, AiInsightDataReport } from "@/lib/reports/ai-insight-data";
import { getAiInsightConfig } from "./ai-insight-config";
import {
  AiChatResponse,
  AiChatMessage,
  AiChatResponseSchema,
  isForbiddenQuery,
} from "./ai-chat-schema";

export const SYSTEM_CHAT_INSTRUCTION = `Kamu adalah AI Business Consultant profesional untuk bengkel kendaraan.
Tugas utama: Menjawab pertanyaan pemilik bengkel HANYA berdasarkan konteks data laporan bisnis yang disediakan.

ATURAN KETAT:
1. Jawab HANYA menggunakan data laporan agregat yang diberikan dalam prompt.
2. Jika omzet atau Work Order bernilai 0 di periode ini, TETAP jawab pertanyaan pengguna dengan menganalisis metrik lain yang ada (misalnya pelanggan inaktif, inventaris stok, atau layanan terlaris). JANGAN pernah menolak menjawab jika ada data pendukung lain.
3. Jika ditanya strategi, saran, atau cara meningkatkan omzet/performa, berikan langkah-langkah rekomendasi taktis berbasis data agregat yang tersedia (seperti jangkau pelanggan inaktif via WhatsApp, restok barang kritis, atau buat paket bundling item slow-moving).
4. JANGAN PERNAH merekayasa angka di luar data prompt.
5. JANGAN PERNAH membuat query SQL, mengakses database, atau menyarankan modifikasi data secara langsung.
6. Sertakan nama metrik (citations) yang digunakan sebagai referensi jawaban (misal: ["Revenue", "Work Orders", "Inventaris", "Pelanggan"]).
7. Output HARUS dalam format JSON murni tanpa pembungkus markdown (tanpa \`\`\`json):
{
  "answer": "...",
  "confidence": "HIGH | MEDIUM | LOW",
  "citations": ["Metric1", "Metric2"]
}`;

export class AiChatService {
  /**
   * Main entry point to answer user questions about current report.
   * Strictly isolated from direct database / SQL execution.
   */
  static async answerQuestion(
    question: string,
    startDateStr?: string | null,
    endDateStr?: string | null,
    history: AiChatMessage[] = []
  ): Promise<AiChatResponse> {
    const trimmedQuestion = (question || "").trim();

    // Rule 1: Security Guard Check
    if (isForbiddenQuery(trimmedQuestion)) {
      return {
        answer: "Saya hanya dapat menganalisis data laporan bisnis bengkel.",
        confidence: "HIGH",
        citations: ["Kebijakan Keamanan Sistem"],
        usedFallback: false,
      };
    }

    // Rule 2: Fetch Aggregated Data (Anti-PII aggregated context)
    const reportData = await getAiInsightData(startDateStr, endDateStr);

    const config = getAiInsightConfig();

    // Rule 3: If AI is disabled or provider not configured
    if (!config.enabled || !config.provider) {
      return AiChatService.generateDeterministicChatFallback(trimmedQuestion, reportData);
    }

    const providerName = config.provider.toLowerCase();
    const apiKeyEnvVar = `${config.provider.toUpperCase()}_API_KEY`;
    const apiKey = process.env[apiKeyEnvVar] || process.env.AI_API_KEY || "";

    if (!apiKey) {
      return AiChatService.generateDeterministicChatFallback(trimmedQuestion, reportData);
    }

    // Rule 4: Attempt LLM Provider Call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const recentHistory = (history || []).slice(-10);
      const anonymizedPayload = {
        period: reportData.period,
        revenue: reportData.revenue,
        workOrders: reportData.workOrders,
        averageTicket: reportData.averageTicket,
        customersSummary: reportData.customers,
        servicesSummary: reportData.services,
        inventorySummary: reportData.inventory,
      };

      const promptMessage = `${SYSTEM_CHAT_INSTRUCTION}

KONTEKS LAPORAN BISNIS BENGKEL:
${JSON.stringify(anonymizedPayload, null, 2)}

RIWAYAT PERCAKAPAN SINGKAT:
${JSON.stringify(recentHistory, null, 2)}

PERTANYAAN PENGGUNA:
"${trimmedQuestion}"`;

      let url = "";
      let headers: Record<string, string> = { "Content-Type": "application/json" };
      let bodyData: any = {};

      if (providerName === "openai") {
        url = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        bodyData = {
          model: config.model || "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_CHAT_INSTRUCTION },
            { role: "user", content: promptMessage },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        };
      } else {
        const model = config.model || "gemini-3.6-flash";
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        bodyData = {
          contents: [{ parts: [{ text: promptMessage }] }],
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`AI Provider returned HTTP ${res.status}`);
      }

      const resJson = await res.json();
      let rawText = "";
      if (providerName === "openai") {
        rawText = resJson?.choices?.[0]?.message?.content || "";
      } else {
        rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      const validated = AiChatResponseSchema.parse({
        answer: parsed.answer,
        confidence: parsed.confidence || "HIGH",
        citations: parsed.citations || ["Laporan Bisnis"],
        usedFallback: false,
      });

      return validated;
    } catch (err) {
      clearTimeout(timeoutId);
      return AiChatService.generateDeterministicChatFallback(trimmedQuestion, reportData);
    }
  }

  /**
   * Deterministic Chat Fallback Engine.
   * Produces accurate, highly contextual answers based on keyword matching against report metrics
   * without requiring LLM calls.
   */
  static generateDeterministicChatFallback(
    question: string,
    data: AiInsightDataReport
  ): AiChatResponse {
    const qLower = question.toLowerCase();
    const { revenue, workOrders, customers, services, inventory, period, averageTicket } = data;

    // Strategy / Recommendations to Increase Revenue
    if (
      qLower.includes("naik") ||
      qLower.includes("meningkatkan") ||
      qLower.includes("strategi") ||
      qLower.includes("saran") ||
      qLower.includes("tips") ||
      qLower.includes("rekomendasi") ||
      qLower.includes("solusi")
    ) {
      const tips: string[] = [];

      if (customers.inactiveCustomers > 0) {
        tips.push(`Jangkau ${customers.inactiveCustomers} pelanggan inaktif (>6 bulan belum servis) melalui WhatsApp pengingat servis.`);
      }

      if (inventory.lowStockCount > 0 || inventory.outOfStockCount > 0) {
        tips.push(`Segera restok ${inventory.outOfStockCount} suku cadang habis dan ${inventory.lowStockCount} suku cadang kritis agar pengerjaan servis tidak terhambat.`);
      }

      if (inventory.slowMovingItems.length > 0) {
        tips.push(`Tawarkan paket bundling promo untuk ${inventory.slowMovingItems.length} item stok slow-moving.`);
      }

      if (services.topServices.length > 0) {
        tips.push(`Fokuskan promosi pada layanan terlaris yaitu ${services.topServices[0].name}.`);
      }

      const formattedAnswer = tips.length > 0
        ? `Berikut rekomendasi strategis untuk meningkatkan kinerja bengkel:\n` + tips.map((t, i) => `${i + 1}. ${t}`).join("\n")
        : `Untuk meningkatkan omzet, fokuskan pada pelayanan cepat work order aktif dan optimasi Average Ticket saat ini (Rp ${averageTicket.current.toLocaleString("id-ID")}).`;

      return {
        answer: formattedAnswer,
        confidence: "HIGH",
        citations: ["Rekomendasi Bisnis", "Analisis Pelanggan", "Inventaris"],
        usedFallback: true,
      };
    }

    // Customer / Pelanggan
    if (qLower.includes("pelanggan") || qLower.includes("customer") || qLower.includes("inaktif")) {
      return {
        answer: `Analisis Pelanggan (${period.label}):\n• Pelanggan Baru: ${customers.newCustomers} orang\n• Pelanggan Setia: ${customers.returningCustomers} orang\n• Pelanggan Inaktif (>6 bulan): ${customers.inactiveCustomers} orang.\nDisarankan untuk mengirim pesan sapaan/pengingat servis berkala kepada pelanggan inaktif.`,
        confidence: "HIGH",
        citations: ["Analisis Pelanggan"],
        usedFallback: true,
      };
    }

    // Inventory / Stok / Spare Part
    if (qLower.includes("stok") || qLower.includes("inventaris") || qLower.includes("spare part") || qLower.includes("barang") || qLower.includes("part")) {
      const slowItems = inventory.slowMovingItems.map((i) => i.name).slice(0, 3).join(", ");
      const slowText = slowItems ? ` Item slow-moving diantaranya: ${slowItems}.` : "";

      return {
        answer: `Status Inventaris Bengkel:\n• Suku cadang habis (stok 0): ${inventory.outOfStockCount} item\n• Stok kritis (<=5): ${inventory.lowStockCount} item\n• Item slow-moving: ${inventory.slowMovingItems.length} item.${slowText}`,
        confidence: "HIGH",
        citations: ["Inventaris"],
        usedFallback: true,
      };
    }

    // Service / Servis
    if (qLower.includes("servis") || qLower.includes("service") || qLower.includes("layanan")) {
      const topList = services.topServices.map((s) => `${s.name} (${s.quantity}x)`).join(", ");
      const decliningText = services.decliningServices.length > 0
        ? `\n• Layanan mengalami penurunan: ${services.decliningServices.map((s) => s.name).join(", ")}.`
        : "";

      return {
        answer: `Analisis Layanan Servis (${period.label}):\n• Layanan terpopuler: ${topList || "Servis Berkala"}.${decliningText}`,
        confidence: "HIGH",
        citations: ["Laporan Layanan"],
        usedFallback: true,
      };
    }

    // Revenue / Pendapatan / Omzet
    if (qLower.includes("revenue") || qLower.includes("pendapatan") || qLower.includes("omzet") || qLower.includes("uang")) {
      const changeText =
        revenue.changePercent !== null
          ? `${revenue.changePercent >= 0 ? "naik" : "turun"} ${Math.abs(revenue.changePercent)}%`
          : "stabil";
      return {
        answer: `Pendapatan pada ${period.label} tercatat Rp ${revenue.current.toLocaleString("id-ID")} (${changeText} vs periode sebelumnya). Rata-rata transaksi per work order (Average Ticket) adalah Rp ${averageTicket.current.toLocaleString("id-ID")}.`,
        confidence: "HIGH",
        citations: ["Pendapatan", "Average Ticket"],
        usedFallback: true,
      };
    }

    // Work Order / Transaksi
    if (qLower.includes("order") || qLower.includes("wo") || qLower.includes("pengerjaan") || qLower.includes("transaksi")) {
      return {
        answer: `Ringkasan Work Order (${period.label}):\n• Total WO Selesai: ${workOrders.current} transaksi (${workOrders.changePercent !== null ? (workOrders.changePercent >= 0 ? "+" : "") + workOrders.changePercent + "%" : "0%"}).\n• Rata-rata nilai per WO: Rp ${averageTicket.current.toLocaleString("id-ID")}.`,
        confidence: "HIGH",
        citations: ["Work Orders"],
        usedFallback: true,
      };
    }

    // Default Comprehensive Business Summary Fallback
    return {
      answer: `Ringkasan Eksekutif Bisnis (${period.label}):\n• Total Pendapatan: Rp ${revenue.current.toLocaleString("id-ID")} (${workOrders.current} Work Order selesai)\n• Pelanggan Inaktif: ${customers.inactiveCustomers} orang\n• Peringatan Stok: ${inventory.outOfStockCount} habis, ${inventory.lowStockCount} stok kritis.\nAnda dapat menanyakan detail lebih lanjut mengenai omzet, pelanggan, atau inventaris.`,
      confidence: "MEDIUM",
      citations: ["Ringkasan Laporan"],
      usedFallback: true,
    };
  }
}
