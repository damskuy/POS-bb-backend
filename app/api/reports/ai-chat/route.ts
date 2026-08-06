import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { AiChatRequestSchema } from "@/lib/ai/ai-chat-schema";
import { AiChatService } from "@/lib/ai/ai-chat.service";

/**
 * POST /api/reports/ai-chat
 * Answers natural-language questions using ONLY aggregated report data.
 * Zero direct database access, zero SQL execution.
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
      UserRole.MECHANIC,
    ]);

    const body = await request.json();
    const parsed = AiChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.format());
    }

    const { question, startDate, endDate, history } = parsed.data;

    const chatResponse = await AiChatService.answerQuestion(
      question,
      startDate,
      endDate,
      history
    );

    return success(chatResponse);
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error processing AI chat:", err);
    return error(err.message || "Gagal memproses pertanyaan AI", 400);
  }
}
