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
7. Hasilkan 1 hingga 3 tindakan prioritas (priorityActions) yang diurutkan berdasarkan dampak bisnis terpenting (HIGH -> MEDIUM -> LOW). Setiap tindakan prioritas wajib menyertakan atribut "why" (berisi summary dan bukti evidence).
8. Sediakan penjelasan "explanation" (title, summary, dan maksimal 5 evidence: label, value, interpretation) yang menjelaskan mengapa AI memilih rekomendasi & prioritas tersebut berdasarkan metrik bisnis aktual.
9. Output HARUS dalam bentuk objek JSON murni tanpa pembungkus markdown (tanpa \`\`\`json).`;

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
    "actionTarget": "/reports | /customers | /inventory | /whatsapp | /work-orders | /settings"
  },
  "priorityActions": [
    {
      "priority": 1,
      "title": "...",
      "description": "...",
      "impact": "HIGH | MEDIUM | LOW",
      "estimatedRevenue": 1000000,
      "estimatedSaving": 0,
      "reason": "...",
      "actionLabel": "...",
      "actionTarget": "/customers | /inventory | /reports | /work-orders | /whatsapp | /settings",
      "why": {
        "summary": "...",
        "evidence": [
          "..."
        ]
      }
    }
  ],
  "explanation": {
    "title": "Mengapa AI memberikan rekomendasi ini?",
    "summary": "...",
    "evidence": [
      {
        "label": "...",
        "value": "...",
        "interpretation": "..."
      }
    ]
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
      priorityActions: [
        {
          priority: 1,
          title: "Aksi Prioritas Mock",
          description: "Pantau pengerjaan Work Order aktif.",
          impact: "HIGH",
          reason: "Tingkatkan kepuasan pelanggan.",
          actionLabel: "Lihat Work Orders",
          actionTarget: "/work-orders",
          why: {
            summary: "Work order aktif menentukan kepuasan servis.",
            evidence: ["5 work order completed"],
          },
        },
      ],
      explanation: {
        title: "Mengapa AI memberikan rekomendasi ini?",
        summary: "Analisis metrik menunjukkan kinerja operasional stabil.",
        evidence: [
          {
            label: "Work Orders",
            value: "5",
            interpretation: "Aktivitas pengerjaan berjalan lancar.",
          },
        ],
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
    this.modelName = modelName || "gemini-3.6-flash";
  }

  async generateBusinessInsight(data: AiInsightDataReport): Promise<AiInsightOutput> {
    if (!this.apiKey) {
      throw new Error("AI Provider API Key missing");
    }

    const promptText = buildAiPrompt(data);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      let url = "";
      let headers: Record<string, string> = { "Content-Type": "application/json" };
      let bodyData: any = {};

      const isOpenAi = this.name.toLowerCase() === "openai";

      if (isOpenAi) {
        url = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${this.apiKey}`;
        bodyData = {
          model: this.modelName || "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: promptText },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        };
      } else {
        // Default: Gemini API
        const model = this.modelName || "gemini-3.6-flash";
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        bodyData = {
          contents: [{ parts: [{ text: promptText }] }],
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
        const errorBody = await res.text();
        console.error(`[AiProvider] Gemini API Error - HTTP ${res.status} ${res.statusText}: ${errorBody}`);
        if (res.status === 429) {
          throw new Error(`AI Provider rate limit exceeded (HTTP 429): ${errorBody}`);
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error(`AI Provider authentication failed (HTTP ${res.status}): ${errorBody}`);
        }
        throw new Error(`AI Provider returned HTTP ${res.status} ${res.statusText}: ${errorBody}`);
      }

      const resJson = await res.json();
      let rawText = "";

      if (isOpenAi) {
        rawText = resJson?.choices?.[0]?.message?.content || "";
      } else {
        rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      // Clean markdown fenced code block if present
      const cleanedJsonText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsedObj = JSON.parse(cleanedJsonText);

      const normalized = normalizeAiOutput(parsedObj);
      if (!normalized) {
        throw new Error("AI provider returned invalid output schema");
      }

      return normalized;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("AI Provider request timed out (25s limit)");
      }
      throw new Error(`AI Provider execution failed: ${err.message}`);
    }
  }
}
