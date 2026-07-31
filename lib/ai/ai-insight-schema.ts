import { z } from "zod";

export const HighlightTypeSchema = z.enum(["positive", "warning", "opportunity"]);

export const HighlightMetricSchema = z
  .object({
    current: z.number().nullable().optional(),
    previous: z.number().nullable().optional(),
    changePercent: z.number().nullable().optional(),
  })
  .optional();

export const HighlightSchema = z.object({
  type: HighlightTypeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  metric: HighlightMetricSchema,
});

export const RecommendationSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  actionLabel: z.string().nullable().optional(),
  actionTarget: z.string().nullable().optional(),
});

export const AiInsightOutputSchema = z.object({
  summary: z.string().min(1),
  highlights: z.array(HighlightSchema).min(1).max(3),
  recommendation: RecommendationSchema,
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  dataQuality: z.object({
    status: z.enum(["SUFFICIENT", "LIMITED", "INSUFFICIENT"]),
    note: z.string().nullable().optional(),
  }),
});

export type AiInsightOutput = z.infer<typeof AiInsightOutputSchema>;

const ALLOWED_ACTION_TARGETS = new Set([
  "/reports",
  "/customers",
  "/inventory",
  "/whatsapp",
  "/work-orders",
  "/services",
  "/spare-parts",
  "/invoices",
  "/dashboard",
]);

/**
 * Validates actionTarget against internal Bengkel route allowlist.
 * Rejects external URLs (http://, https://, javascript:, data:) and unapproved paths.
 */
export function validateActionTarget(target?: string | null): string | null {
  if (!target || typeof target !== "string") return null;
  const trimmed = target.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.includes("//")
  ) {
    return null;
  }
  if (ALLOWED_ACTION_TARGETS.has(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    const baseRoute = trimmed.split("?")[0].split("#")[0];
    if (ALLOWED_ACTION_TARGETS.has(baseRoute)) {
      return trimmed;
    }
  }
  return null;
}

/**
 * Normalizes and validates the raw AI output object.
 * Ensures max 3 highlights, validates actionTarget, and enforces Zod compliance.
 */
export function normalizeAiOutput(rawOutput: any): AiInsightOutput | null {
  try {
    const parsed = AiInsightOutputSchema.parse(rawOutput);

    // Limit highlights to max 3
    const highlights = parsed.highlights.slice(0, 3);

    // Validate recommendation actionTarget
    const safeTarget = validateActionTarget(parsed.recommendation.actionTarget);
    const recommendation = {
      ...parsed.recommendation,
      actionTarget: safeTarget,
      actionLabel: safeTarget ? parsed.recommendation.actionLabel || "Buka Halaman" : null,
    };

    return {
      ...parsed,
      highlights,
      recommendation,
    };
  } catch (err) {
    return null;
  }
}
