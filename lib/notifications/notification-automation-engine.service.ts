import { prisma } from "@/lib/prisma";
import { NotificationTrigger, NotificationStatus } from "@prisma/client";
import { NotificationAutomationService } from "@/lib/services/notification-automation.service";
import { NotificationTemplateRendererService } from "@/lib/notifications/notification-template-renderer.service";
import {
  getEffectiveAutomationExecutionMode,
  checkLiveTestFilter,
} from "@/lib/notifications/automation-execution.config";
import { NotificationHistoryService } from "@/lib/services/notification-history.service";

export interface AutomationExecutionResult {
  success: boolean;
  executed: boolean;
  mode: string;
  effectiveMode?: string;
  liveAllowed?: boolean;
  testFilter?: {
    enabled: boolean;
    workOrderId?: number;
    trigger?: string;
  };
  historyId?: string;
  deliveryResult?: any;
  trigger: NotificationTrigger;
  automationId?: number;
  existingHistoryId?: string;
  reason?: string;
  automation?: {
    id: number;
    name: string;
    isEnabled: boolean;
  };
  template?: {
    id: number;
    name: string;
  };
  recipient?: {
    customerId: number;
    name: string;
    phoneMasked: string;
  };
  workOrder?: {
    id: number;
    code: string;
    status: string;
  };
  rendered?: {
    message: string;
    unresolvedVariables: string[];
  };
  history?: {
    id: string;
    status: string;
  };
  delivery?: {
    attempted: boolean;
    providerCalled: boolean;
    success?: boolean;
    reason: string;
  };
}

export class NotificationAutomationEngineService {
  /**
   * Helper to mask phone numbers safely for production logging and responses.
   * e.g. 628123456789 -> 62812****789
   */
  private static maskPhone(phone: string): string {
    if (!phone || phone.length < 8) return "****";
    const prefix = phone.substring(0, 5);
    const suffix = phone.substring(phone.length - 3);
    return `${prefix}****${suffix}`;
  }

  /**
   * Execute automation logic for a specific Work Order trigger event.
   * Resolves mode using effective config check (safety gate) and logs history.
   */
  static async executeForWorkOrder(
    trigger: NotificationTrigger,
    workOrderId: number
  ): Promise<AutomationExecutionResult> {
    const effective = getEffectiveAutomationExecutionMode();
    const mode = effective.mode;

    // Use Prisma transaction to pessimistic-lock the WorkOrder and run duplicate check.
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Pessimistic lock the WorkOrder row to serialize trigger execution for this WorkOrder
      await tx.$executeRawUnsafe(
        `SELECT id FROM "work_orders" WHERE id = $1 FOR UPDATE`,
        workOrderId
      );

      // 2. Fetch active automation
      const automation = await tx.notificationAutomation.findUnique({
        where: { trigger },
        include: { template: true },
      });

      if (!automation || !automation.isEnabled) {
        return {
          status: "AUTOMATION_NOT_FOUND_OR_DISABLED",
        };
      }

      if (!automation.templateId || !automation.template) {
        return {
          status: "TEMPLATE_NOT_CONFIGURED",
          automationId: automation.id,
        };
      }

      // 3. Fetch WorkOrder details
      const workOrder = await tx.workOrder.findFirst({
        where: { id: workOrderId, deletedAt: null },
        include: {
          customer: true,
          vehicle: true,
        },
      });

      if (!workOrder) {
        return {
          status: "WORK_ORDER_NOT_FOUND",
        };
      }

      // Controlled LIVE Test safety filter checks (Fase 2B-2)
      let liveAllowed = mode === "LIVE";
      let testFilterData = undefined;

      if (mode === "LIVE") {
        const filterResult = checkLiveTestFilter(workOrderId, trigger);
        liveAllowed = filterResult.allowed;
        testFilterData = filterResult.filter;

        if (!liveAllowed) {
          return {
            status: "BLOCKED_BY_SAFETY_GATE",
            reason: filterResult.reason,
            testFilterData,
          };
        }
      }

      // 4. Deduplication Check:
      // Prevent duplicate notification for the same WorkOrder + Trigger + Automation combination.
      const duplicateStatuses = mode === "LIVE" && liveAllowed
        ? [NotificationStatus.PENDING, NotificationStatus.PROCESSING, NotificationStatus.SENT, NotificationStatus.DELIVERED]
        : [NotificationStatus.SIMULATED, NotificationStatus.PENDING, NotificationStatus.PROCESSING, NotificationStatus.SENT, NotificationStatus.DELIVERED];

      const duplicate = await tx.notificationHistory.findFirst({
        where: {
          workOrderId,
          trigger,
          automationId: automation.id,
          status: {
            in: duplicateStatuses,
          },
        },
      });

      if (duplicate) {
        return {
          status: "DUPLICATE_AUTOMATION_EXECUTION",
          existingHistoryId: duplicate.id,
          liveAllowed,
          testFilterData,
        };
      }

      // 5. Validate Customer
      if (!workOrder.customer) {
        return {
          status: "CUSTOMER_NOT_FOUND",
          liveAllowed,
          testFilterData,
        };
      }

      if (!workOrder.customer.name || !workOrder.customer.name.trim()) {
        return {
          status: "CUSTOMER_NAME_MISSING",
          liveAllowed,
          testFilterData,
        };
      }

      // 6. Validate and Clean Phone Number
      const rawPhone = workOrder.customer.phone || "";
      if (!rawPhone || !rawPhone.trim()) {
        return {
          status: "PHONE_MISSING",
          liveAllowed,
          testFilterData,
        };
      }

      let cleanPhone = rawPhone.replace(/[^0-9+]/g, "").trim();
      if (cleanPhone.startsWith("+")) cleanPhone = cleanPhone.substring(1);
      if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.substring(1);

      if (!cleanPhone.startsWith("62") || cleanPhone.length < 10) {
        return {
          status: "PHONE_INVALID",
          cleanPhone,
          liveAllowed,
          testFilterData,
        };
      }

      // 7. Render Template
      const rendered = NotificationTemplateRendererService.render(
        automation.template.message,
        {
          customer: workOrder.customer,
          vehicle: workOrder.vehicle,
          workOrder,
        }
      );

      const maskedPhone = NotificationAutomationEngineService.maskPhone(cleanPhone);

      // 8. Create History Log inside transaction
      if (mode === "DRY_RUN") {
        const history = await tx.notificationHistory.create({
          data: {
            recipientName: workOrder.customer.name,
            recipientPhone: cleanPhone,
            channel: "WHATSAPP",
            category: automation.template.category,
            message: rendered.message,
            status: NotificationStatus.SIMULATED,
            provider: "fonnte",
            automationId: automation.id,
            workOrderId: workOrder.id,
            trigger: trigger,
            providerResponse: {
              mode: "DRY_RUN",
              providerCalled: false,
              reason: effective.reason || "AUTOMATION_DRY_RUN",
            },
          },
        });

        return {
          status: "DRY_RUN_CREATED",
          history,
          rendered,
          cleanPhone,
          automation,
          workOrder,
          liveAllowed,
          testFilterData,
          maskedPhone,
        };
      } else {
        const history = await tx.notificationHistory.create({
          data: {
            recipientName: workOrder.customer.name,
            recipientPhone: cleanPhone,
            channel: "WHATSAPP",
            category: automation.template.category,
            message: rendered.message,
            status: NotificationStatus.PENDING,
            provider: "fonnte",
            automationId: automation.id,
            workOrderId: workOrder.id,
            trigger: trigger,
          },
        });

        return {
          status: "LIVE_PENDING_CREATED",
          history,
          rendered,
          cleanPhone,
          automation,
          workOrder,
          liveAllowed,
          testFilterData,
          maskedPhone,
        };
      }
    }, {
      timeout: 15000, // 15s to be extremely safe under concurrent load
    });

    // 9. Process Result Outside Transaction
    if (transactionResult.status === "AUTOMATION_NOT_FOUND_OR_DISABLED") {
      console.log(`[AutomationEngine] Trigger ${trigger} for WO #${workOrderId}: AUTOMATION_NOT_FOUND_OR_DISABLED`);
      return {
        success: true,
        executed: false,
        mode,
        effectiveMode: mode,
        liveAllowed: mode === "LIVE",
        trigger,
        reason: "AUTOMATION_NOT_FOUND_OR_DISABLED",
      };
    }

    if (transactionResult.status === "TEMPLATE_NOT_CONFIGURED") {
      console.log(`[AutomationEngine] Trigger ${trigger} for WO #${workOrderId}: TEMPLATE_NOT_CONFIGURED`);
      return {
        success: true,
        executed: false,
        mode,
        effectiveMode: mode,
        liveAllowed: mode === "LIVE",
        trigger,
        automationId: transactionResult.automationId,
        reason: "TEMPLATE_NOT_CONFIGURED",
      };
    }

    if (transactionResult.status === "WORK_ORDER_NOT_FOUND") {
      console.log(`[AutomationEngine] Trigger ${trigger} for WO #${workOrderId}: WORK_ORDER_NOT_FOUND`);
      return {
        success: false,
        executed: false,
        mode,
        effectiveMode: mode,
        liveAllowed: mode === "LIVE",
        trigger,
        reason: "WORK_ORDER_NOT_FOUND",
      };
    }

    if (transactionResult.status === "BLOCKED_BY_SAFETY_GATE") {
      console.log(`[AutomationEngine] Trigger ${trigger} for WO #${workOrderId} blocked by safety gate: ${transactionResult.reason}`);
      return {
        success: true,
        executed: false,
        mode: "LIVE",
        effectiveMode: "LIVE",
        liveAllowed: false,
        testFilter: transactionResult.testFilterData,
        trigger,
        reason: transactionResult.reason,
        delivery: {
          attempted: false,
          providerCalled: false,
          reason: transactionResult.reason || "",
        },
      };
    }

    if (transactionResult.status === "DUPLICATE_AUTOMATION_EXECUTION") {
      console.log(
        `[AutomationEngine] Trigger ${trigger} for WO #${workOrderId}: DUPLICATE_AUTOMATION_EXECUTION (existing log ID: ${transactionResult.existingHistoryId})`
      );
      return {
        success: true,
        executed: false,
        mode,
        effectiveMode: mode,
        liveAllowed: transactionResult.liveAllowed,
        testFilter: transactionResult.testFilterData,
        trigger,
        existingHistoryId: transactionResult.existingHistoryId,
        historyId: transactionResult.existingHistoryId,
        reason: "DUPLICATE_AUTOMATION_EXECUTION",
        delivery: {
          attempted: false,
          providerCalled: false,
          reason: "DUPLICATE_AUTOMATION_EXECUTION",
        },
      };
    }

    if (transactionResult.status === "CUSTOMER_NOT_FOUND") {
      console.log(`[AutomationEngine] Trigger ${trigger} for WO #${workOrderId}: CUSTOMER_NOT_FOUND`);
      return {
        success: false,
        executed: false,
        mode,
        effectiveMode: mode,
        liveAllowed: transactionResult.liveAllowed,
        testFilter: transactionResult.testFilterData,
        trigger,
        reason: "CUSTOMER_NOT_FOUND",
      };
    }

    if (transactionResult.status === "CUSTOMER_NAME_MISSING") {
      console.log(`[AutomationEngine] Trigger ${trigger} for WO #${workOrderId}: CUSTOMER_NAME_MISSING`);
      return {
        success: false,
        executed: false,
        mode,
        effectiveMode: mode,
        liveAllowed: transactionResult.liveAllowed,
        testFilter: transactionResult.testFilterData,
        trigger,
        reason: "CUSTOMER_NAME_MISSING",
      };
    }

    if (transactionResult.status === "PHONE_MISSING") {
      console.log(`[AutomationEngine] Trigger ${trigger} for WO #${workOrderId}: PHONE_MISSING`);
      return {
        success: false,
        executed: false,
        mode,
        effectiveMode: mode,
        liveAllowed: transactionResult.liveAllowed,
        testFilter: transactionResult.testFilterData,
        trigger,
        reason: "PHONE_MISSING",
      };
    }

    if (transactionResult.status === "PHONE_INVALID") {
      console.log(`[AutomationEngine] Trigger ${trigger} for WO #${workOrderId}: PHONE_INVALID (${NotificationAutomationEngineService.maskPhone(transactionResult.cleanPhone || "")})`);
      return {
        success: false,
        executed: false,
        mode,
        effectiveMode: mode,
        liveAllowed: transactionResult.liveAllowed,
        testFilter: transactionResult.testFilterData,
        trigger,
        reason: "PHONE_INVALID",
      };
    }

    // DRY_RUN success path
    if (transactionResult.status === "DRY_RUN_CREATED") {
      const { history, rendered, automation, workOrder, maskedPhone } = transactionResult;
      return {
        success: true,
        executed: true,
        mode: "DRY_RUN",
        effectiveMode: "DRY_RUN",
        liveAllowed: false,
        trigger,
        automation: {
          id: automation!.id,
          name: automation!.name,
          isEnabled: automation!.isEnabled,
        },
        template: {
          id: automation!.template!.id,
          name: automation!.template!.name,
        },
        recipient: {
          customerId: workOrder!.customer!.id,
          name: workOrder!.customer!.name,
          phoneMasked: maskedPhone!,
        },
        workOrder: {
          id: workOrder!.id,
          code: workOrder!.code,
          status: workOrder!.status,
        },
        rendered: {
          message: rendered!.message,
          unresolvedVariables: rendered!.unresolvedVariables,
        },
        history: {
          id: history!.id,
          status: "SIMULATED",
        },
        historyId: history!.id,
        delivery: {
          attempted: false,
          providerCalled: false,
          reason: effective.reason || "AUTOMATION_DRY_RUN",
        },
      };
    }

    // LIVE_PENDING_CREATED path: Lock is released. Now call external provider safely outside transaction.
    const { history, rendered, cleanPhone, automation, workOrder, liveAllowed, testFilterData, maskedPhone } = transactionResult;

    console.log(
      `[AutomationEngine] Running LIVE for trigger ${trigger} on WO #${workOrderId}`
    );

    // Update log status to PROCESSING
    await NotificationHistoryService.markProcessing(history!.id);

    // Dispatch via defaultNotificationService
    const { defaultNotificationService } = await import(
      "@/lib/notifications/notification.service"
    );
    const result = await defaultNotificationService.sendText({
      phone: cleanPhone!,
      message: rendered!.message,
    });

    let finalStatus: NotificationStatus = NotificationStatus.FAILED;

    if (result.success) {
      await NotificationHistoryService.markSent(
        history!.id,
        result.messageId,
        result
      );
      finalStatus = NotificationStatus.SENT;
    } else {
      await NotificationHistoryService.markFailed(
        history!.id,
        result.error || "Gagal mengirim WhatsApp via Fonnte Provider",
        result
      );
    }

    return {
      success: result.success,
      executed: true,
      mode: "LIVE",
      effectiveMode: "LIVE",
      liveAllowed: true,
      testFilter: testFilterData,
      trigger,
      automation: {
        id: automation!.id,
        name: automation!.name,
        isEnabled: automation!.isEnabled,
      },
      template: {
        id: automation!.template!.id,
        name: automation!.template!.name,
      },
      recipient: {
        customerId: workOrder!.customer!.id,
        name: workOrder!.customer!.name,
        phoneMasked: maskedPhone!,
      },
      workOrder: {
        id: workOrder!.id,
        code: workOrder!.code,
        status: workOrder!.status,
      },
      rendered: {
        message: rendered!.message,
        unresolvedVariables: rendered!.unresolvedVariables,
      },
      history: {
        id: history!.id,
        status: finalStatus,
      },
      historyId: history!.id,
      deliveryResult: result,
      delivery: {
        attempted: true,
        providerCalled: true,
        success: result.success,
        reason: result.success ? "SUCCESS" : result.error || "FAILED",
      },
    };
  }
}
