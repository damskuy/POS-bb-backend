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

export const PriorityImpactSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const PriorityActionWhySchema = z.object({
  summary: z.string().min(1),
  evidence: z.array(z.string()),
});

export const PriorityActionItemSchema = z.object({
  priority: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  impact: PriorityImpactSchema,
  estimatedRevenue: z.number().optional(),
  estimatedSaving: z.number().optional(),
  reason: z.string().min(1),
  actionLabel: z.string().min(1),
  actionTarget: z.string().nullable().optional(),
  why: PriorityActionWhySchema.optional(),
});

export const RecommendationSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  actionLabel: z.string().nullable().optional(),
  actionTarget: z.string().nullable().optional(),
});

export const ExplanationEvidenceSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  interpretation: z.string().min(1),
});

export const ExplanationSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  evidence: z.array(ExplanationEvidenceSchema).max(5),
});

export const AiInsightOutputSchema = z.object({
  summary: z.string().min(1),
  highlights: z.array(HighlightSchema).min(1).max(3),
  recommendation: RecommendationSchema,
  priorityActions: z.array(PriorityActionItemSchema).max(3).optional(),
  explanation: ExplanationSchema.optional(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  dataQuality: z.object({
    status: z.enum(["SUFFICIENT", "LIMITED", "INSUFFICIENT"]),
    note: z.string().nullable().optional(),
  }),
});

export type PriorityActionItem = z.infer<typeof PriorityActionItemSchema>;
export type ExplanationData = z.infer<typeof ExplanationSchema>;
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
  "/settings",
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
 * Ensures max 3 highlights, max 3 priorityActions, max 5 explanation evidence items, validates actionTarget, and enforces Zod compliance.
 */
export function normalizeAiOutput(rawOutput: any): AiInsightOutput | null {
  try {
    if (rawOutput && typeof rawOutput === "object") {
      let modified = { ...rawOutput };
      if (Array.isArray(modified.highlights)) {
        modified.highlights = modified.highlights.slice(0, 3);
      }
      if (Array.isArray(modified.priorityActions)) {
        modified.priorityActions = modified.priorityActions.slice(0, 3);
      }
      if (modified.explanation && Array.isArray(modified.explanation.evidence)) {
        modified.explanation = {
          ...modified.explanation,
          evidence: modified.explanation.evidence.slice(0, 5),
        };
      }
      rawOutput = modified;
    }

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

    // Normalize priorityActions (max 3, reassign priority numbers 1..N, sanitize actionTarget)
    const priorityActions = (parsed.priorityActions || []).slice(0, 3).map((act, index) => {
      const target = validateActionTarget(act.actionTarget);
      return {
        ...act,
        priority: index + 1,
        actionTarget: target,
        actionLabel: target ? act.actionLabel || "Lihat Details" : act.actionLabel,
      };
    });

    // Normalize explanation evidence (max 5)
    const explanation = parsed.explanation
      ? {
          ...parsed.explanation,
          evidence: parsed.explanation.evidence.slice(0, 5),
        }
      : undefined;

    return {
      ...parsed,
      highlights,
      recommendation,
      priorityActions,
      explanation,
    };
  } catch (err) {
    return null;
  }
}
