import { prisma } from "@/lib/prisma";
import { NotificationCategory, NotificationStatus } from "@prisma/client";
import { TemplateRendererService } from "@/lib/notifications/template-renderer.service";
import { defaultNotificationService } from "@/lib/notifications/notification.service";
import { NotificationHistoryService } from "@/lib/services/notification-history.service";

export class AutoNotificationService {
  /**
   * Automatically dispatch WORK_ORDER_COMPLETED WhatsApp message to customer
   * when a Work Order status transition to COMPLETED occurs.
   */
  static async triggerWorkOrderCompleted(workOrderId: number): Promise<boolean> {
    try {
      // 1. Find active WORK_ORDER_COMPLETED notification template
      const template = await prisma.notificationTemplate.findFirst({
        where: {
          category: NotificationCategory.WORK_ORDER_COMPLETED,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!template) {
        console.log(`[AutoNotification] No active WORK_ORDER_COMPLETED template found.`);
        return false;
      }

      // 2. Fetch WorkOrder details
      const wo = await prisma.workOrder.findUnique({
        where: { id: workOrderId },
        include: {
          customer: true,
          vehicle: true,
          services: {
            include: { service: true },
          },
        },
      });

      if (!wo || !wo.customer || !wo.customer.phone) {
        console.log(`[AutoNotification] Customer or phone number missing for WO #${workOrderId}.`);
        return false;
      }

      // Normalize phone
      let cleanPhone = wo.customer.phone.replace(/[^0-9+]/g, "").trim();
      if (cleanPhone.startsWith("+")) cleanPhone = cleanPhone.substring(1);
      if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.substring(1);

      if (!cleanPhone.startsWith("62") || cleanPhone.length < 10) {
        console.log(`[AutoNotification] Invalid phone format: ${cleanPhone}`);
        return false;
      }

      // Render message
      const renderedMessage = TemplateRendererService.render(template.message, {
        customer: wo.customer,
        vehicle: wo.vehicle,
        workOrder: wo,
      });

      if (!renderedMessage || !renderedMessage.trim()) return false;

      // Log PENDING
      const history = await NotificationHistoryService.createHistory({
        recipientName: wo.customer.name,
        recipientPhone: cleanPhone,
        category: NotificationCategory.WORK_ORDER_COMPLETED,
        message: renderedMessage,
        status: NotificationStatus.PENDING,
        provider: "fonnte",
      });

      // Mark PROCESSING
      await NotificationHistoryService.markProcessing(history.id);

      // Dispatch WhatsApp via Fonnte
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
        console.log(`[AutoNotification] Successfully sent WORK_ORDER_COMPLETED WhatsApp to ${cleanPhone}`);
        return true;
      } else {
        await NotificationHistoryService.markFailed(
          history.id,
          result.error || "Failed to dispatch WORK_ORDER_COMPLETED notification",
          result
        );
        console.error(`[AutoNotification] Failed to send WORK_ORDER_COMPLETED WhatsApp: ${result.error}`);
        return false;
      }
    } catch (err) {
      console.error("[AutoNotification] Error executing triggerWorkOrderCompleted:", err);
      return false;
    }
  }
}
