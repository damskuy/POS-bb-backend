import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export class JobExecutionService {
  /**
   * Concurrency Protection: Acquire execution lock for a named cron job.
   * Checks if an execution with status "RUNNING" started within the last 15 minutes exists.
   * Returns acquired: true with new log if lock acquired, or acquired: false if another job is running.
   */
  static async acquireLock(jobName: string, mode: string = "DRY_RUN") {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const activeJob = await prisma.jobExecutionLog.findFirst({
      where: {
        jobName,
        status: JobStatus.RUNNING,
        startedAt: { gte: fifteenMinutesAgo },
      },
    });

    if (activeJob) {
      return {
        acquired: false,
        activeJob,
      };
    }

    const jobLog = await prisma.jobExecutionLog.create({
      data: {
        jobName,
        mode,
        status: JobStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    return {
      acquired: true,
      jobLog,
    };
  }

  /**
   * Release execution lock and record final job execution summary or error details.
   */
  static async releaseLock(
    jobLogId: string,
    status: JobStatus,
    summary?: any,
    errorMessage?: string
  ) {
    try {
      const log = await prisma.jobExecutionLog.findUnique({
        where: { id: jobLogId },
      });

      if (!log) return null;

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - log.startedAt.getTime();

      return await prisma.jobExecutionLog.update({
        where: { id: jobLogId },
        data: {
          status,
          finishedAt,
          durationMs,
          summary: summary ? JSON.parse(JSON.stringify(summary)) : undefined,
          errorMessage,
        },
      });
    } catch (err) {
      console.error(`[JobExecutionService] Error releasing lock for ${jobLogId}:`, err);
      return null;
    }
  }
}
