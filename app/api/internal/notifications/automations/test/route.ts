import { NextResponse } from "next/server";
import { NotificationTrigger } from "@prisma/client";
import { success, error, validationError } from "@/lib/response";
import { NotificationAutomationEngineService } from "@/lib/notifications/notification-automation-engine.service";
import { z } from "zod";

const testAutomationSchema = z.object({
  trigger: z.nativeEnum(NotificationTrigger, {
    message: "Trigger harus berupa NotificationTrigger yang valid",
  }),
  workOrderId: z.number().int().positive("workOrderId harus berupa integer positif"),
});

/**
 * POST /api/internal/notifications/automations/test
 * Internal simulation endpoint to trigger Automation Control engine in DRY_RUN mode.
 * Protected by CRON_SECRET or internal secret header.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify Authorization (Bearer token or x-cron-secret header)
    const expectedSecret = process.env.CRON_SECRET || "bengkelbaik_cron_secret_dev_2026";
    const authHeader = request.headers.get("authorization");
    const cronHeader = request.headers.get("x-cron-secret");

    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (cronHeader) {
      token = cronHeader.trim();
    }

    if (!token || token !== expectedSecret) {
      return error("Unauthorized internal request", 401);
    }

    // 2. Validate Request Body
    const json = await request.json().catch(() => ({}));
    const result = testAutomationSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const { trigger, workOrderId } = result.data;

    // 3. Execute Automation Trigger Engine
    const executionResult =
      await NotificationAutomationEngineService.executeForWorkOrder(
        trigger,
        workOrderId
      );

    return success(executionResult);
  } catch (err: any) {
    console.error("Error in internal automation test endpoint:", err);
    return error(err.message || "Failed to execute internal automation test");
  }
}
