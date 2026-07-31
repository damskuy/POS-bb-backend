import { AiInsightDataReport } from "@/lib/reports/ai-insight-data";
import { AiInsightOutput, normalizeAiOutput } from "./ai-insight-schema";

export interface AiInsightProvider {
  name: string;
  generateBusinessInsight(data: AiInsightDataReport): Promise<AiInsightOutput>;
}

export const SYSTEM_INSTRUCTION = `Kamu adalah AI Business Analyst profesional untuk bengkel kendaraan.
Tugas utama: Menganalisis data agregat bisnis bengkel dan memberikan ringkasan serta rekomendasi yang tepat sasaran.

ATURAN KETAT:
1. Gunakan HANYA data yang diberikan dalam prompt. Jangan membuat angka baru, merekayasa data, atau berasumsi tanpa bukti.
2. Jangan mengulang data yang tidak tersedia.
3. Jangan menganggap fitur otomatisasi, reminder, atau WhatsApp pasti aktif.
4. Gunakan Bahasa Indonesia yang ringkas, jelas, profesional, dan mudah dipahami pemilik bengkel (maksimal 2 kalimat untuk summary).
5. Highlights terdiri dari 1 hingga 3 item utama (tipe: positive, warning, atau opportunity).
6. Berikan tepat 1 rekomendasi utama yang konkret dan relevan.
7. Output HARUS dalam bentuk objek JSON murni tanpa pembungkus markdown (tanpa \`\`\`json).`;

/**
 * Build safe JSON prompt from aggregated report metrics.
 * Ensures zero PII (no customer names, no phone numbers, no addresses) is included.
 */
export function buildAiPrompt(data: AiInsightDataReport): string {
  const anonymizedPayload = {
    period: data.period,
    revenue: data.revenue,
    workOrders: data.workOrders,
    averageTicket: data.averageTicket,
    customersSummary: data.customers,
    servicesSummary: data.services,
    inventorySummary: data.inventory,
  };

  return `${SYSTEM_INSTRUCTION}

DATA AGREGAT BISNIS BENGKEL:
${JSON.stringify(anonymizedPayload, null, 2)}

Hasilkan JSON sesuai skema berikut:
{
  "summary": "...",
  "highlights": [
    {
      "type": "positive | warning | opportunity",
      "title": "...",
      "description": "..."
    }
  ],
  "recommendation": {
    "title": "...",
    "description": "...",
    "actionLabel": "...",
    "actionTarget": "/reports | /customers | /inventory | /whatsapp | /work-orders"
  },
  "confidence": "HIGH | MEDIUM | LOW",
  "dataQuality": {
    "status": "SUFFICIENT | LIMITED | INSUFFICIENT",
    "note": null
  }
}`;
}

/**
 * Mock Provider for testing and isolation
 */
export class MockAiInsightProvider implements AiInsightProvider {
  name = "mock";
  private shouldFail: boolean;
  private mockOutput?: AiInsightOutput;

  constructor(options: { shouldFail?: boolean; mockOutput?: AiInsightOutput } = {}) {
    this.shouldFail = options.shouldFail || false;
    this.mockOutput = options.mockOutput;
  }

  async generateBusinessInsight(data: AiInsightDataReport): Promise<AiInsightOutput> {
    if (this.shouldFail) {
      throw new Error("Mock AI Provider Network Failure");
    }

    if (this.mockOutput) {
      return this.mockOutput;
    }

    return {
      summary: `Analisis AI: Pendapatan bulan ini sebesar Rp ${data.revenue.current.toLocaleString("id-ID")}.`,
      highlights: [
        {
          type: data.revenue.trend === "DOWN" ? "warning" : "positive",
          title: "Status Pendapatan AI",
          description: `Kinerja pendapatan menunjukkan tren ${data.revenue.trend}.`,
        },
      ],
      recommendation: {
        title: "Rekomendasi AI Mock",
        description: "Tingkatkan koordinasi tim dan pemantauan barang.",
        actionLabel: "Buka Reports",
        actionTarget: "/reports",
      },
      confidence: "HIGH",
      dataQuality: {
        status: "SUFFICIENT",
        note: null,
      },
    };
  }
}

/**
 * Generic LLM HTTP Adapter (Gemini / OpenAI API compatible)
 */
export class GenericLlmAiInsightProvider implements AiInsightProvider {
  name: string;
  private apiKey: string;
  private modelName: string;

  constructor(name: string, apiKey: string, modelName: string) {
    this.name = name;
    this.apiKey = apiKey;
    this.modelName = modelName || "gemini-1.5-flash";
  }

  async generateBusinessInsight(data: AiInsightDataReport): Promise<AiInsightOutput> {
    if (!this.apiKey) {
      throw new Error("AI Provider API Key missing");
    }

    const promptText = buildAiPrompt(data);

    // Dynamic import / fetch adapter if API key present
    // For safety, parse and validate returned response with normalizeAiOutput
    try {
      // Fetch implementation for Gemini API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
        }),
      });

      if (!res.ok) {
        throw new Error(`AI Provider returned HTTP ${res.status}`);
      }

      const resJson = await res.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Clean markdown fenced code block if present
      const cleanedJsonText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsedObj = JSON.parse(cleanedJsonText);

      const normalized = normalizeAiOutput(parsedObj);
      if (!normalized) {
        throw new Error("AI output failed Zod schema validation");
      }

      return normalized;
    } catch (err: any) {
      throw new Error(`AI Provider execution failed: ${err.message}`);
    }
  }
}
