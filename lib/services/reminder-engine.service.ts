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

export interface ReminderRunSummary {
  rulesChecked: number;
  workOrdersChecked: number;
  eligible: number;
  wouldSend: number;
  skipped: number;
  failedValidation: number;
  items: DryRunItem[];
  // Live mode backward compatibility fields
  sent?: number;
  failed?: number;
  customersEligible?: number;
}

export interface RunReminderOptions {
  mode?: "DRY_RUN" | "LIVE";
}

export class ReminderEngineService {
  /**
   * Main entry point for Reminder Engine supporting DRY_RUN and LIVE modes.
   * Default mode during testing is "DRY_RUN" which simulates eligibility and rendering
   * WITHOUT dispatching any HTTP requests to Fonnte or writing fake SENT logs.
   */
  static async runReminderEngine(options: RunReminderOptions = {}): Promise<{
    success: boolean;
    mode: "DRY_RUN" | "LIVE";
    data: ReminderRunSummary;
  }> {
    const mode = options.mode || "DRY_RUN";

    if (mode === "DRY_RUN") {
      const summary = await this.executeDryRun();
      return {
        success: true,
        mode: "DRY_RUN",
        data: summary,
      };
    } else {
      const summary = await this.executeLiveRun();
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
   * ABSOLUTELY NO HTTP REQUESTS TO FONNTE ARE MADE.
   * ABSOLUTELY NO FAKE "SENT" LOGS ARE CREATED IN NOTIFICATION HISTORY.
   */
  private static async executeDryRun(): Promise<ReminderRunSummary> {
    const rules = await prisma.reminderRule.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    const workOrders = await prisma.workOrder.findMany({
      where: {
        status: WorkOrderStatus.COMPLETED,
        finishedAt: { not: null },
        deletedAt: null,
      },
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
    let wouldSend = 0;
    let skipped = 0;
    let failedValidation = 0;

    const items: DryRunItem[] = [];
    const simulatedSentPhones = new Set<string>();
    const now = new Date();

    if (rules.length === 0 || workOrders.length === 0) {
      return {
        rulesChecked,
        workOrdersChecked,
        eligible: 0,
        wouldSend: 0,
        skipped: 0,
        failedValidation: 0,
        items: [],
      };
    }

    for (const rule of rules) {
      const daysInterval = rule.daysInterval ?? 30;

      for (const wo of workOrders) {
        if (!wo.finishedAt) continue;

        const finishedAt = new Date(wo.finishedAt);
        const daysDiff = Math.floor(
          (now.getTime() - finishedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if Work Order is eligible based on daysInterval
        if (daysDiff >= daysInterval) {
          eligible++;

          const dueDate = new Date(
            finishedAt.getTime() + daysInterval * 24 * 60 * 60 * 1000
          );

          // Validation Check: Customer & Phone presence
          if (!wo.customer || !wo.customer.phone || !wo.customer.name) {
            failedValidation++;
            continue;
          }

          // Phone normalization and validation
          let cleanPhone = wo.customer.phone.replace(/[^0-9+]/g, "").trim();
          if (cleanPhone.startsWith("+")) cleanPhone = cleanPhone.substring(1);
          if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.substring(1);

          if (!cleanPhone.startsWith("62") || cleanPhone.length < 10) {
            failedValidation++;
            continue;
          }

          // Duplicate Prevention Check in Real NotificationHistory
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

          // Check if already processed in this dry run session for the same phone & finishedAt
          const sessionKey = `${cleanPhone}_${wo.id}`;
          if (existingSend || simulatedSentPhones.has(sessionKey)) {
            skipped++;
            continue;
          }

          simulatedSentPhones.add(sessionKey);

          // Render message using TemplateRendererService
          const serviceName =
            wo.services && wo.services.length > 0 && wo.services[0].service
              ? wo.services[0].service.name
              : "Servis Berkala";

          const vehicleName = wo.vehicle
            ? `${wo.vehicle.brand} ${wo.vehicle.model}`.trim()
            : "Kendaraan Anda";

          const formattedServiceDate = finishedAt.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });

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

          wouldSend++;
          items.push({
            workOrderId: wo.id,
            customerName: wo.customer.name,
            recipientPhone: cleanPhone,
            templateName: rule.name,
            dueDate: dueDate.toISOString(),
            renderedMessage,
            reason: "Eligible untuk dikirim (Simulasi)",
          });
        }
      }
    }

    return {
      rulesChecked,
      workOrdersChecked,
      eligible,
      wouldSend,
      skipped,
      failedValidation,
      items,
    };
  }

  /**
   * LIVE Execution:
   * Real dispatch path via Fonnte Provider and real NotificationHistory logging.
   * (NOT USED BY DEFAULT DURING DRY RUN TESTING)
   */
  private static async executeLiveRun(): Promise<ReminderRunSummary> {
    const rules = await prisma.reminderRule.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    const workOrders = await prisma.workOrder.findMany({
      where: {
        status: WorkOrderStatus.COMPLETED,
        finishedAt: { not: null },
        deletedAt: null,
      },
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

    if (rules.length === 0 || workOrders.length === 0) {
      return {
        rulesChecked,
        workOrdersChecked,
        eligible: 0,
        wouldSend: 0,
        skipped: 0,
        failedValidation: 0,
        items: [],
      };
    }

    for (const rule of rules) {
      const daysInterval = rule.daysInterval ?? 30;

      for (const wo of workOrders) {
        if (!wo.finishedAt) continue;

        const finishedAt = new Date(wo.finishedAt);
        const daysDiff = Math.floor(
          (now.getTime() - finishedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff >= daysInterval) {
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
