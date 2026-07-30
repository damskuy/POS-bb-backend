import { NextResponse } from "next/server";
import crypto from "crypto";
import { ReminderEngineService } from "@/lib/services/reminder-engine.service";
import { JobExecutionService } from "@/lib/services/job-execution.service";
import { JobStatus } from "@prisma/client";

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * POST /api/internal/jobs/reminders
 * Internal Cron Job Endpoint for Railway Cron or automated schedulers.
 * Protected via Bearer token matching env CRON_SECRET.
 * Defaults to DRY_RUN mode for safety.
 * Supports optional REMINDER_TEST_WORK_ORDER_ID env variable for safe testing.
 */
export async function POST(request: Request) {
  const startedAt = new Date();

  try {
    // 1. Validate server configuration
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || !cronSecret.trim()) {
      console.error("[InternalCron] CRON_SECRET environment variable is missing or empty.");
      return NextResponse.json(
        { success: false, error: "Server cron configuration is missing or invalid" },
        { status: 500 }
      );
    }

    // 2. Validate Authorization Bearer header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const providedToken = authHeader.substring(7).trim();
    if (!safeCompare(providedToken, cronSecret)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 3. Evaluate REMINDER_JOB_MODE (Defaults strictly to DRY_RUN)
    const rawMode = (process.env.REMINDER_JOB_MODE || "DRY_RUN").toUpperCase();
    const mode: "DRY_RUN" | "LIVE" = rawMode === "LIVE" ? "LIVE" : "DRY_RUN";

    // 4. Evaluate REMINDER_TEST_WORK_ORDER_ID env variable
    let testWorkOrderId: number | null = null;
    const rawTestWoId = process.env.REMINDER_TEST_WORK_ORDER_ID;

    if (rawTestWoId !== undefined && rawTestWoId !== null && rawTestWoId.trim() !== "") {
      const parsed = Number(rawTestWoId.trim());
      if (!Number.isInteger(parsed) || parsed <= 0) {
        console.error(
          `[InternalCron] Invalid REMINDER_TEST_WORK_ORDER_ID environment variable value: "${rawTestWoId}"`
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "Konfigurasi REMINDER_TEST_WORK_ORDER_ID tidak valid. Harus berupa integer positif.",
          },
          { status: 500 }
        );
      }
      testWorkOrderId = parsed;
      console.log(
        `[InternalCron] SAFE TEST FILTER IS ACTIVE! Strictly processing WorkOrder ID: ${testWorkOrderId}`
      );
    }

    // 5. Concurrency Protection (Acquire DB Lock)
    const { acquired, jobLog } = await JobExecutionService.acquireLock(
      "service-reminders",
      mode
    );

    if (!acquired || !jobLog) {
      return NextResponse.json(
        { success: false, error: "Reminder job sedang berjalan" },
        { status: 409 }
      );
    }

    // 6. Execute Reminder Engine with optional testWorkOrderId filter
    try {
      const engineResult = await ReminderEngineService.runReminderEngine({
        mode,
        testWorkOrderId,
      });
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      const summaryData = {
        rulesChecked: engineResult.data.rulesChecked,
        workOrdersChecked: engineResult.data.workOrdersChecked,
        eligible: engineResult.data.eligible,
        wouldSend: engineResult.data.wouldSend,
        sent: engineResult.data.sent ?? 0,
        failed: engineResult.data.failed ?? 0,
        skipped: engineResult.data.skipped,
        failedValidation: engineResult.data.failedValidation,
      };

      // Release Lock with SUCCESS
      await JobExecutionService.releaseLock(
        jobLog.id,
        JobStatus.SUCCESS,
        summaryData
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            job: "service-reminders",
            mode,
            startedAt: startedAt.toISOString(),
            finishedAt: finishedAt.toISOString(),
            durationMs,
            summary: summaryData,
            testFilter: engineResult.data.testFilter || {
              enabled: testWorkOrderId !== null,
              workOrderId: testWorkOrderId,
            },
            diagnostics: engineResult.data.diagnostics || [],
          },
        },
        { status: 200 }
      );
    } catch (engineErr: any) {
      const finishedAt = new Date();
      await JobExecutionService.releaseLock(
        jobLog.id,
        JobStatus.FAILED,
        null,
        engineErr?.message || "Engine execution exception"
      );

      console.error("[InternalCron] Error running reminder engine:", engineErr);
      return NextResponse.json(
        {
          success: false,
          error: "Gagal menjalankan reminder engine job",
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[InternalCron] Unexpected error in internal cron endpoint:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process internal cron job" },
      { status: 500 }
    );
  }
}
