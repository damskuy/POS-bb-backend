import { AiInsightDataReport } from "@/lib/reports/ai-insight-data";
import { getAiInsightConfig, AiInsightConfig } from "./ai-insight-config";
import { generateDeterministicFallback } from "./ai-fallback-generator";
import { AiInsightOutput, normalizeAiOutput } from "./ai-insight-schema";
import { AiInsightProvider, GenericLlmAiInsightProvider, MockAiInsightProvider } from "./ai-provider";
import { AiInsightCache } from "./ai-insight-cache";

export interface AiInsightResponseMeta {
  source: "AI" | "FALLBACK";
  providerCalled: boolean;
  fallbackReason: string | null;
}

export interface AiInsightServiceResponse {
  output: AiInsightOutput;
  meta: AiInsightResponseMeta;
}

export class AiInsightGeneratorService {
  private static customProviderOverride: AiInsightProvider | null = null;

  /**
   * For testing purposes: override the active AI provider
   */
  static setCustomProvider(provider: AiInsightProvider | null) {
    AiInsightGeneratorService.customProviderOverride = provider;
  }

  /**
   * Main entry point to generate business insights from aggregated report data.
   * Guarantees HTTP 200 response with structured fallback if AI is disabled or fails.
   */
  static async generateInsight(
    data: AiInsightDataReport,
    overrideConfig?: Partial<AiInsightConfig>
  ): Promise<AiInsightServiceResponse> {
    const config = { ...getAiInsightConfig(), ...overrideConfig };

    // Rule 1: If AI is disabled
    if (!config.enabled) {
      const fallbackOutput = generateDeterministicFallback(data);
      console.log(`[AiInsightService] source: FALLBACK | reason: AI_DISABLED | provider: ${config.provider || "none"}`);
      return {
        output: fallbackOutput,
        meta: {
          source: "FALLBACK",
          providerCalled: false,
          fallbackReason: "AI_DISABLED",
        },
      };
    }

    // Determine Provider
    let provider: AiInsightProvider | null = AiInsightGeneratorService.customProviderOverride;

    if (!provider && config.provider) {
      const apiKeyEnvVar = `${config.provider.toUpperCase()}_API_KEY`;
      const apiKey = process.env[apiKeyEnvVar] || process.env.AI_API_KEY || "";

      if (apiKey) {
        provider = new GenericLlmAiInsightProvider(config.provider, apiKey, config.model);
      }
    }

    // Rule 2: If AI is enabled but provider or API Key is missing
    if (!provider) {
      const fallbackOutput = generateDeterministicFallback(data);
      console.log(`[AiInsightService] source: FALLBACK | reason: AI_PROVIDER_NOT_CONFIGURED | provider: ${config.provider || "none"}`);
      return {
        output: fallbackOutput,
        meta: {
          source: "FALLBACK",
          providerCalled: false,
          fallbackReason: "AI_PROVIDER_NOT_CONFIGURED",
        },
      };
    }

    // Rule 3: Check In-Memory Cache
    const cacheKey = AiInsightCache.generateKey(
      data.period.startDate,
      data.period.endDate,
      provider.name,
      config.model
    );
    const cachedResult = AiInsightCache.get(cacheKey);
    if (cachedResult) {
      console.log(`[AiInsightService] source: AI | provider: ${provider.name} | model: ${config.model} | latency: 0ms | cached: true`);
      return {
        output: cachedResult,
        meta: {
          source: "AI",
          providerCalled: false,
          fallbackReason: null,
        },
      };
    }

    // Rule 4: Attempt Provider Call (Guaranteed max 1 call per request)
    let providerCalled = false;
    const startTime = Date.now();
    try {
      providerCalled = true;
      const rawResult = await provider.generateBusinessInsight(data);
      const latencyMs = Date.now() - startTime;
      const normalized = normalizeAiOutput(rawResult);

      if (!normalized) {
        throw new Error("AI provider returned invalid output schema");
      }

      // Store valid output in cache
      AiInsightCache.set(cacheKey, normalized, provider.name, config.model);
      console.log(`[AiInsightService] source: AI | provider: ${provider.name} | model: ${config.model} | latency: ${latencyMs}ms | cached: false`);

      return {
        output: normalized,
        meta: {
          source: "AI",
          providerCalled: true,
          fallbackReason: null,
        },
      };
    } catch (err: any) {
      const errMsg = String(err?.message || err || "");
      const isTimeout = err?.name === "AbortError" || errMsg.toLowerCase().includes("timed out");
      const fallbackReason = isTimeout ? "AI_PROVIDER_TIMEOUT" : "AI_PROVIDER_ERROR";

      // Rule 5: Log error safely without leaking credentials and return Fallback
      console.warn(`[AiInsightService] source: FALLBACK | reason: ${fallbackReason} | provider: ${provider.name} | detail: ${errMsg}`);

      const fallbackOutput = generateDeterministicFallback(data);
      return {
        output: fallbackOutput,
        meta: {
          source: "FALLBACK",
          providerCalled,
          fallbackReason,
        },
      };
    }
  }
}
