import { z } from "zod";

export const AiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const AiChatRequestSchema = z.object({
  question: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  history: z.array(AiChatMessageSchema).max(10).optional().default([]),
});

export const AiChatResponseSchema = z.object({
  answer: z.string().min(1),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  citations: z.array(z.string()).default([]),
  usedFallback: z.boolean().default(false),
});

export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;
export type AiChatRequest = z.infer<typeof AiChatRequestSchema>;
export type AiChatResponse = z.infer<typeof AiChatResponseSchema>;

const FORBIDDEN_PATTERNS = [
  /password/i,
  /delete/i,
  /update/i,
  /insert/i,
  /change/i,
  /drop\s+table/i,
  /alter\s+table/i,
  /select\s+.*from/i,
  /generate\s+sql/i,
  /\bsql\b/i,
  /access\s+database/i,
  /\bdatabase\b/i,
  /prisma/i,
  /send\s+whatsapp/i,
  /kirim\s+whatsapp/i,
  /ubah\s+inventaris/i,
  /hapus\s+work\s+order/i,
];

/**
 * Security Guard: Detects forbidden intents such as DB mutations, SQL generation,
 * credential theft, or unauthorized automation execution.
 */
export function isForbiddenQuery(question: string): boolean {
  if (!question || typeof question !== "string") return false;
  return FORBIDDEN_PATTERNS.some((pattern) => pattern.test(question));
}
