import { getAiInsightData } from "@/lib/reports/ai-insight-data";
import { getAiInsightConfig } from "./ai-insight-config";
import {
  detectAnomalies,
  DetectedAnomaly,
  AnomalySeverity,
  AnomalyThresholds,
} from "./anomaly-detector";

export interface AnomalyServiceResponse {
  generatedAt: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  anomalies: DetectedAnomaly[];
}

export const ANOMALY_LLM_INSTRUCTION = `Kamu adalah AI Business Analyst profesional.
Tugas utama: Menghaluskan teks judul (title), deskripsi (description), dan rekomendasi (recommendation) dari anomali bisnis yang terdeteksi agar lebih profesional dan mudah dipahami pemilik bengkel.

ATURAN SANGAT KETAT:
1. JANGAN PERNAH mengubah atribut severity, category, actionTarget, dan evidence! Atribut ini DILINDUNGI dan HARUS PERSIS seperti input.
2. JANGAN PERNAH menambah, menghapus, atau merubah urutan item anomali.
3. Hanya perbaiki kalimat pada title, description, dan recommendation.
4. Output HARUS berupa JSON murni tanpa pembungkus markdown (tanpa \`\`\`json):
{
  "anomalies": [
    {
      "severity": "...",
      "category": "...",
      "title": "...",
      "description": "...",
      "evidence": [...],
      "recommendation": "...",
      "actionTarget": "..."
    }
  ]
}`;

interface CacheEntry {
  timestamp: number;
  data: AnomalyServiceResponse;
}

const anomalyCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class AiAnomalyService {
  /**
   * Main entry point to detect business anomalies using aggregated report data.
   */
  static async getAnomalies(
    startDateStr?: string | null,
    endDateStr?: string | null,
    customThresholds?: Partial<AnomalyThresholds>
  ): Promise<AnomalyServiceResponse> {
    const cacheKey = `anomalies_${startDateStr || "default"}_${endDateStr || "default"}`;
    const cached = anomalyCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // Step 1: Fetch aggregated report data (Zero PII)
    const reportData = await getAiInsightData(startDateStr, endDateStr);

    // Step 2: Run deterministic detection engine
    const deterministicAnomalies = detectAnomalies(reportData, customThresholds);

    let finalAnomalies = [...deterministicAnomalies];

    // Step 3: Optional LLM Enhancement for title/description/recommendation ONLY
    const config = getAiInsightConfig();
    const providerName = config.provider.toLowerCase();
    const apiKeyEnvVar = `${config.provider.toUpperCase()}_API_KEY`;
    const apiKey = process.env[apiKeyEnvVar] || process.env.AI_API_KEY || "";

    if (config.enabled && apiKey && deterministicAnomalies.length > 0) {
      try {
        const enhanced = await AiAnomalyService.enhanceWithLlm(
          deterministicAnomalies,
          providerName,
          apiKey,
          config.model
        );

        // STRICT SANITY CHECK: Ensure severity, category, and evidence remain unchanged
        if (enhanced && enhanced.length === deterministicAnomalies.length) {
          finalAnomalies = deterministicAnomalies.map((det, idx) => ({
            ...det,
            title: enhanced[idx].title || det.title,
            description: enhanced[idx].description || det.description,
            recommendation: enhanced[idx].recommendation || det.recommendation,
            // IMMUTABLE attributes coming strictly from deterministic engine
            severity: det.severity,
            category: det.category,
            evidence: det.evidence,
            actionTarget: det.actionTarget,
          }));
        }
      } catch (err) {
        console.warn("[AiAnomalyService] LLM enhancement skipped, using deterministic anomalies:", err);
      }
    }

    // Step 4: Calculate anomaly summary counts
    const criticalCount = finalAnomalies.filter((a) => a.severity === "CRITICAL").length;
    const highCount = finalAnomalies.filter((a) => a.severity === "HIGH").length;
    const mediumCount = finalAnomalies.filter((a) => a.severity === "MEDIUM").length;
    const lowCount = finalAnomalies.filter((a) => a.severity === "LOW").length;

    const result: AnomalyServiceResponse = {
      generatedAt: new Date().toISOString(),
      total: finalAnomalies.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      anomalies: finalAnomalies,
    };

    anomalyCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }

  /**
   * Helper to invoke LLM for text polishing only.
   */
  private static async enhanceWithLlm(
    anomalies: DetectedAnomaly[],
    providerName: string,
    apiKey: string,
    modelName?: string
  ): Promise<DetectedAnomaly[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const promptText = `${ANOMALY_LLM_INSTRUCTION}

ANOMALI BISNIS YANG TERDETEKSI:
${JSON.stringify(anomalies, null, 2)}`;

      let url = "";
      let headers: Record<string, string> = { "Content-Type": "application/json" };
      let bodyData: any = {};

      if (providerName === "openai") {
        url = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        bodyData = {
          model: modelName || "gpt-4o-mini",
          messages: [
            { role: "system", content: ANOMALY_LLM_INSTRUCTION },
            { role: "user", content: promptText },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        };
      } else {
        const model = modelName || "gemini-3.6-flash";
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
        throw new Error(`LLM returned HTTP ${res.status}`);
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

      return parsed.anomalies || [];
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Helper to clear cache for testing isolation.
   */
  static clearCache() {
    anomalyCache.clear();
  }
}
