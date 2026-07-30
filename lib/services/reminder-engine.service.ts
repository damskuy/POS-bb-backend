import { prisma } from "@/lib/prisma";
import {
  NotificationCategory,
  NotificationStatus,
  WorkOrderStatus,
} from "@prisma/client";
import { defaultNotificationService } from "@/lib/notifications/notification.service";
import { NotificationHistoryService } from "@/lib/services/notification-history.service";
import { TemplateRendererService } from "@/lib/notifications/template-renderer.service";

export interface DryRunItem {
  workOrderId: number;
  customerName: string;
  recipientPhone: string;
  templateName: string;
  dueDate: string;
  renderedMessage: string;
  reason?: string;
}

export interface DiagnosticItem {
  workOrderId: number;
  workOrderCode: string;
  eligible: boolean;
  reason:
    | "ELIGIBLE"
    | "STATUS_NOT_MATCHED"
    | "FINISHED_AT_MISSING"
    | "DATE_NOT_DUE"
    | "CUSTOMER_NOT_FOUND"
    | "PHONE_MISSING"
    | "PHONE_INVALID"
    | "ALREADY_REMINDER_SENT"
    | "RULE_NOT_ACTIVE";
  relevantDates: {
    finishedAt: string | null;
    now: string;
    daysDiffExact: number;
    daysDiffFloor: number;
    daysInterval: number;
    dueDate: string | null;
  };
}

export interface TestFilterInfo {
  enabled: boolean;
  workOrderId: number | null;
}

export interface ReminderRunSummary {
  rulesChecked: number;
  workOrdersChecked: number;
  eligible: number;
  wouldSend: number;
  skipped: number;
  failedValidation: number;
  items: DryRunItem[];
  diagnostics?: DiagnosticItem[];
  testFilter?: TestFilterInfo;
  // Live mode backward compatibility fields
  sent?: number;
  failed?: number;
  customersEligible?: number;
}

export interface RunReminderOptions {
  mode?: "DRY_RUN" | "LIVE";
  testWorkOrderId?: number | null;
}

export class ReminderEngineService {
  /**
   * Resolves and validates testWorkOrderId from options or process.env.REMINDER_TEST_WORK_ORDER_ID.
   * Throws an Error if the environment variable is present but invalid.
   */
  public static resolveTestWorkOrderId(
    optionId?: number | null
  ): number | null {
    if (typeof optionId === "number" && Number.isInteger(optionId) && optionId > 0) {
      return optionId;
    }

    const envVal = process.env.REMINDER_TEST_WORK_ORDER_ID;
    if (envVal !== undefined && envVal !== null && envVal.trim() !== "") {
      const parsed = Number(envVal.trim());
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(
          "Konfigurasi REMINDER_TEST_WORK_ORDER_ID tidak valid. Harus berupa integer positif."
        );
      }
      return parsed;
    }

    return null;
  }

  /**
   * Main entry point for Reminder Engine supporting DRY_RUN and LIVE modes.
   * Strictly respects REMINDER_TEST_WORK_ORDER_ID filter if enabled.
   */
  static async runReminderEngine(options: RunReminderOptions = {}): Promise<{
    success: boolean;
    mode: "DRY_RUN" | "LIVE";
    data: ReminderRunSummary;
  }> {
    const mode = options.mode || "DRY_RUN";
    const testWorkOrderId = this.resolveTestWorkOrderId(options.testWorkOrderId);

    if (mode === "DRY_RUN") {
      const summary = await this.executeDryRun(testWorkOrderId);
      return {
        success: true,
        mode: "DRY_RUN",
        data: summary,
      };
    } else {
      const summary = await this.executeLiveRun(testWorkOrderId);
      return {
        success: true,
        mode: "LIVE",
        data: summary,
      };
    }
  }

  /**
   * DRY_RUN Execution:
   * Simulates eligibility calculation, template rendering, and duplicate prevention checks.
   * Strictly filters Prisma WorkOrder query when testWorkOrderId is active.
   */
  private static async executeDryRun(
    testWorkOrderId: number | null
  ): Promise<ReminderRunSummary> {
    const isTestFilterActive =
      typeof testWorkOrderId === "number" && testWorkOrderId > 0;

    if (isTestFilterActive) {
      console.log(
        `[ReminderEngine] SAFE TEST FILTER IS ACTIVE! Strictly querying database for WorkOrder ID: ${testWorkOrderId}`
      );
    }

    const rules = await prisma.reminderRule.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    // Build Work Order query condition - FILTER APPLIED DIRECTLY AT PRISMA DB LEVEL
    const woWhereCondition: any = {
      deletedAt: null,
    };
    if (isTestFilterActive) {
      woWhereCondition.id = testWorkOrderId;
    }

    const workOrders = await prisma.workOrder.findMany({
      where: woWhereCondition,
      include: {
        customer: true,
        vehicle: true,
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const rulesChecked = rules.length;
    const workOrdersChecked = workOrders.length;
    let eligibleCount = 0;
    let wouldSend = 0;
    let skipped = 0;
    let failedValidation = 0;

    const items: DryRunItem[] = [];
    const diagnostics: DiagnosticItem[] = [];
    const simulatedSentPhones = new Set<string>();
    const now = new Date();

    const testFilter: TestFilterInfo = {
      enabled: isTestFilterActive,
      workOrderId: isTestFilterActive ? testWorkOrderId : null,
    };

    if (rules.length === 0 || workOrders.length === 0) {
      return {
        rulesChecked,
        workOrdersChecked,
        eligible: 0,
        wouldSend: 0,
        skipped: 0,
        failedValidation: 0,
        items: [],
        diagnostics: [],
        testFilter,
      };
    }

    for (const wo of workOrders) {
      const finishedAt = wo.finishedAt ? new Date(wo.finishedAt) : null;
      let woIsEligible = false;
      let woReason: DiagnosticItem["reason"] = "ELIGIBLE";
      let daysDiffExact = 0;
      let daysDiffFloor = 0;
      let daysIntervalTarget = 30;
      let dueDateIso: string | null = null;

      // 1. Check Work Order status
      if (wo.status !== WorkOrderStatus.COMPLETED) {
        woReason = "STATUS_NOT_MATCHED";
      } else if (!finishedAt) {
        woReason = "FINISHED_AT_MISSING";
      } else {
        // Evaluate against active reminder rules
        for (const rule of rules) {
          const daysInterval = rule.daysInterval ?? 30;
          daysIntervalTarget = daysInterval;

          const diffMs = now.getTime() - finishedAt.getTime();
          daysDiffExact = Number((diffMs / (1000 * 60 * 60 * 24)).toFixed(3));
          daysDiffFloor = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          const dueDate = new Date(
            finishedAt.getTime() + daysInterval * 24 * 60 * 60 * 1000
          );
          dueDateIso = dueDate.toISOString();

          // Check interval eligibility
          if (daysDiffExact < daysInterval) {
            woReason = "DATE_NOT_DUE";
          } else {
            // Check customer presence
            if (!wo.customer) {
              woReason = "CUSTOMER_NOT_FOUND";
              failedValidation++;
            } else if (!wo.customer.phone || !wo.customer.phone.trim()) {
              woReason = "PHONE_MISSING";
              failedValidation++;
            } else {
              let cleanPhone = wo.customer.phone.replace(/[^0-9+]/g, "").trim();
              if (cleanPhone.startsWith("+")) cleanPhone = cleanPhone.substring(1);
              if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.substring(1);

              if (!cleanPhone.startsWith("62") || cleanPhone.length < 10) {
                woReason = "PHONE_INVALID";
                failedValidation++;
              } else {
                // Check duplicate send in NotificationHistory
                const existingSend = await prisma.notificationHistory.findFirst({
                  where: {
                    recipientPhone: cleanPhone,
                    category: NotificationCategory.SERVICE_REMINDER,
                    status: {
                      in: [NotificationStatus.SENT, NotificationStatus.DELIVERED],
                    },
                    createdAt: { gte: finishedAt },
                  },
                });

                const sessionKey = `${cleanPhone}_${wo.id}`;
                if (existingSend || simulatedSentPhones.has(sessionKey)) {
                  woReason = "ALREADY_REMINDER_SENT";
                  skipped++;
                } else {
                  // ALL ELIGIBILITY CHECKS PASSED
                  woIsEligible = true;
                  woReason = "ELIGIBLE";
                  eligibleCount++;
                  wouldSend++;
                  simulatedSentPhones.add(sessionKey);

                  const serviceName =
                    wo.services && wo.services.length > 0 && wo.services[0].service
                      ? wo.services[0].service.name
                      : "Servis Berkala";

                  const vehicleName = wo.vehicle
                    ? `${wo.vehicle.brand} ${wo.vehicle.model}`.trim()
                    : "Kendaraan Anda";

                  const renderedMessage = TemplateRendererService.render(
                    rule.messageTemplate,
                    {
                      customer: wo.customer,
                      vehicle: wo.vehicle,
                      workOrder: wo,
                      variables: {
                        vehicle_name: vehicleName,
                        vehicleName: vehicleName,
                        service_name: serviceName,
                        serviceName: serviceName,
                        current_km: wo.odometer ? wo.odometer.toLocaleString() : "-",
                        booking_link: "https://bengkelbaik.id/booking",
                      },
                    }
                  );

                  items.push({
                    workOrderId: wo.id,
                    customerName: wo.customer.name,
                    recipientPhone: cleanPhone,
                    templateName: rule.name,
                    dueDate: dueDateIso,
                    renderedMessage,
                    reason: "Eligible untuk dikirim (Simulasi)",
                  });
                }
              }
            }
          }
        }
      }

      diagnostics.push({
        workOrderId: wo.id,
        workOrderCode: wo.code,
        eligible: woIsEligible,
        reason: woReason,
        relevantDates: {
          finishedAt: finishedAt ? finishedAt.toISOString() : null,
          now: now.toISOString(),
          daysDiffExact,
          daysDiffFloor,
          daysInterval: daysIntervalTarget,
          dueDate: dueDateIso,
        },
      });
    }

    return {
      rulesChecked,
      workOrdersChecked,
      eligible: eligibleCount,
      wouldSend,
      skipped,
      failedValidation,
      items,
      diagnostics,
      testFilter,
    };
  }

  /**
   * LIVE Execution:
   * Real dispatch path via Fonnte Provider and real NotificationHistory logging.
   * Strictly filters Prisma WorkOrder query when testWorkOrderId is active.
   */
  private static async executeLiveRun(
    testWorkOrderId: number | null
  ): Promise<ReminderRunSummary> {
    const isTestFilterActive =
      typeof testWorkOrderId === "number" && testWorkOrderId > 0;

    if (isTestFilterActive) {
      console.log(
        `[ReminderEngine] SAFE TEST FILTER IS ACTIVE IN LIVE MODE! Strictly querying database for WorkOrder ID: ${testWorkOrderId}`
      );
    }

    const rules = await prisma.reminderRule.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    const woWhereCondition: any = {
      status: WorkOrderStatus.COMPLETED,
      finishedAt: { not: null },
      deletedAt: null,
    };
    if (isTestFilterActive) {
      woWhereCondition.id = testWorkOrderId;
    }

    const workOrders = await prisma.workOrder.findMany({
      where: woWhereCondition,
      include: {
        customer: true,
        vehicle: true,
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { finishedAt: "desc" },
    });

    const rulesChecked = rules.length;
    const workOrdersChecked = workOrders.length;
    let eligible = 0;
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let failedValidation = 0;

    const items: DryRunItem[] = [];
    const now = new Date();

    const testFilter: TestFilterInfo = {
      enabled: isTestFilterActive,
      workOrderId: isTestFilterActive ? testWorkOrderId : null,
    };

    if (rules.length === 0 || workOrders.length === 0) {
      return {
        rulesChecked,
        workOrdersChecked,
        eligible: 0,
        wouldSend: 0,
        skipped: 0,
        failedValidation: 0,
        items: [],
        testFilter,
      };
    }

    for (const rule of rules) {
      const daysInterval = rule.daysInterval ?? 30;

      for (const wo of workOrders) {
        if (!wo.finishedAt) continue;

        const finishedAt = new Date(wo.finishedAt);
        const diffMs = now.getTime() - finishedAt.getTime();
        const daysDiffExact = diffMs / (1000 * 60 * 60 * 24);

        if (daysDiffExact >= daysInterval) {
          eligible++;

          if (!wo.customer || !wo.customer.phone || !wo.customer.name) {
            failedValidation++;
            continue;
          }

          let cleanPhone = wo.customer.phone.replace(/[^0-9+]/g, "").trim();
          if (cleanPhone.startsWith("+")) cleanPhone = cleanPhone.substring(1);
          if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.substring(1);

          if (!cleanPhone.startsWith("62") || cleanPhone.length < 10) {
            failedValidation++;
            continue;
          }

          const existingSend = await prisma.notificationHistory.findFirst({
            where: {
              recipientPhone: cleanPhone,
              category: NotificationCategory.SERVICE_REMINDER,
              status: {
                in: [NotificationStatus.SENT, NotificationStatus.DELIVERED],
              },
              createdAt: { gte: finishedAt },
            },
          });

          if (existingSend) {
            skipped++;
            continue;
          }

          const serviceName =
            wo.services && wo.services.length > 0 && wo.services[0].service
              ? wo.services[0].service.name
              : "Servis Berkala";

          const vehicleName = wo.vehicle
            ? `${wo.vehicle.brand} ${wo.vehicle.model}`.trim()
            : "Kendaraan Anda";

          const renderedMessage = TemplateRendererService.render(
            rule.messageTemplate,
            {
              customer: wo.customer,
              vehicle: wo.vehicle,
              workOrder: wo,
              variables: {
                vehicle_name: vehicleName,
                vehicleName: vehicleName,
                service_name: serviceName,
                serviceName: serviceName,
                current_km: wo.odometer ? wo.odometer.toLocaleString() : "-",
                booking_link: "https://bengkelbaik.id/booking",
              },
            }
          );

          // 1. Create PENDING history log
          const history = await NotificationHistoryService.createHistory({
            recipientName: wo.customer.name,
            recipientPhone: cleanPhone,
            category: NotificationCategory.SERVICE_REMINDER,
            message: renderedMessage,
            status: NotificationStatus.PENDING,
            provider: "fonnte",
          });

          // 2. Mark PROCESSING
          await NotificationHistoryService.markProcessing(history.id);

          // 3. Dispatch via Fonnte Provider
          const result = await defaultNotificationService.sendText({
            phone: cleanPhone,
            message: renderedMessage,
          });

          if (result.success) {
            await NotificationHistoryService.markSent(
              history.id,
              result.messageId,
              result
            );
            sent++;
          } else {
            await NotificationHistoryService.markFailed(
              history.id,
              result.error || "Gagal mengirim WhatsApp reminder via Fonnte",
              result
            );
            failed++;
          }
        }
      }
    }

    return {
      rulesChecked,
      workOrdersChecked,
      eligible,
      wouldSend: sent,
      skipped,
      failedValidation,
      sent,
      failed,
      customersEligible: eligible,
      items,
      testFilter,
    };
  }

  /**
   * Helper method for backward compatibility
   */
  static async evaluateAndSendReminders(): Promise<ReminderRunSummary> {
    const res = await this.runReminderEngine({ mode: "LIVE" });
    return res.data;
  }
}
