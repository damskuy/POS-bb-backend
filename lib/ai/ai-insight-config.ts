/**
 * AI Business Insight Central Configuration
 * Reads environment variables for AI enablement, provider choices, and models.
 */

export interface AiInsightConfig {
  enabled: boolean;
  provider: string;
  model: string;
}

export function getAiInsightConfig(): AiInsightConfig {
  const enabledStr = process.env.AI_INSIGHT_ENABLED;
  const enabled = enabledStr === "true";

  const provider = (process.env.AI_INSIGHT_PROVIDER || "").trim().toLowerCase();
  const model = (process.env.AI_INSIGHT_MODEL || "").trim();

  return {
    enabled,
    provider,
    model,
  };
}
