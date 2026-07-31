import { AiInsightDataReport } from "@/lib/reports/ai-insight-data";
import { getAiInsightConfig, AiInsightConfig } from "./ai-insight-config";
import { generateDeterministicFallback } from "./ai-fallback-generator";
import { AiInsightOutput, normalizeAiOutput } from "./ai-insight-schema";
import { AiInsightProvider, GenericLlmAiInsightProvider, MockAiInsightProvider } from "./ai-provider";

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
      return {
        output: fallbackOutput,
        meta: {
          source: "FALLBACK",
          providerCalled: false,
          fallbackReason: "AI_PROVIDER_NOT_CONFIGURED",
        },
      };
    }

    // Rule 3: Attempt Provider Call (Guaranteed max 1 call per request)
    let providerCalled = false;
    try {
      providerCalled = true;
      const rawResult = await provider.generateBusinessInsight(data);
      const normalized = normalizeAiOutput(rawResult);

      if (!normalized) {
        throw new Error("AI provider returned invalid output schema");
      }

      return {
        output: normalized,
        meta: {
          source: "AI",
          providerCalled: true,
          fallbackReason: null,
        },
      };
    } catch (err: any) {
      // Rule 4: Log error safely without leaking credentials and return Fallback
      console.error(`[AiInsightGenerator] AI Provider error (${provider.name}):`, err.message || err);

      const fallbackOutput = generateDeterministicFallback(data);
      return {
        output: fallbackOutput,
        meta: {
          source: "FALLBACK",
          providerCalled,
          fallbackReason: "AI_PROVIDER_ERROR",
        },
      };
    }
  }
}
