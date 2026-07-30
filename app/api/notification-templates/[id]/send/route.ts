import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { UserRole, NotificationStatus } from "@prisma/client";
import { success, error, notFound } from "@/lib/response";
import { ForbiddenError } from "@/lib/auth/errors";
import { TemplateRendererService } from "@/lib/notifications/template-renderer.service";
import { defaultNotificationService } from "@/lib/notifications/notification.service";
import { NotificationHistoryService } from "@/lib/services/notification-history.service";

/**
 * POST /api/notification-templates/:id/send
 * Render and dispatch a notification template to a real WhatsApp target via Fonnte Provider,
 * and record the attempt in NotificationHistory.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
    ]);

    const { id } = await params;
    const templateId = Number(id);

    const template = await prisma.notificationTemplate.findFirst({
      where: { id: templateId, deletedAt: null },
    });

    if (!template) {
      return notFound("Notification template");
    }

    if (!template.isActive) {
      return error("Notification template sedang tidak aktif", 400);
    }

    const json = await request.json().catch(() => ({}));
    const { customerId, workOrderId, phone, recipientName: manualRecipientName, variables } = json;

    let customerData: any = null;
    let vehicleData: any = null;
    let workOrderData: any = null;

    let targetPhone = phone || "";
    let targetRecipientName = manualRecipientName || "Pelanggan POS";

    if (workOrderId) {
      const wo = await prisma.workOrder.findUnique({
        where: { id: Number(workOrderId) },
        include: { customer: true, vehicle: true },
      });
      if (!wo) {
        return notFound("Work Order");
      }
      workOrderData = wo;
      customerData = wo.customer;
      vehicleData = wo.vehicle;
      if (wo.customer) {
        if (!targetPhone) targetPhone = wo.customer.phone;
        if (!manualRecipientName) targetRecipientName = wo.customer.name;
      }
    } else if (customerId) {
      const cust = await prisma.customer.findUnique({
        where: { id: Number(customerId) },
        include: { vehicles: true },
      });
      if (!cust) {
        return notFound("Customer");
      }
      customerData = cust;
      if (!targetPhone) targetPhone = cust.phone;
      if (!manualRecipientName) targetRecipientName = cust.name;
      if (cust.vehicles && cust.vehicles.length > 0) {
        vehicleData = cust.vehicles[0];
      }
    }

    if (!targetPhone || !targetPhone.trim()) {
      return error("Nomor WhatsApp penerima wajib diisi", 400);
    }

    // Normalize phone number to Indonesian format 628...
    let cleanPhone = targetPhone.replace(/[^0-9+]/g, "").trim();
    if (cleanPhone.startsWith("+")) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.substring(1);

    if (!cleanPhone.startsWith("62") || cleanPhone.length < 10) {
      return error("Format nomor WhatsApp tidak valid. Contoh: 081234567890", 400);
    }

    const renderedMessage = TemplateRendererService.render(template.message, {
      customer: customerData,
      vehicle: vehicleData,
      workOrder: workOrderData,
      variables,
    });

    if (!renderedMessage || !renderedMessage.trim()) {
      return error("Hasil render isi pesan template tidak boleh kosong", 400);
    }

    // 1. Log PENDING in NotificationHistory
    const history = await NotificationHistoryService.createHistory({
      recipientName: targetRecipientName,
      recipientPhone: cleanPhone,
      category: template.category,
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
      const updatedHistory = await NotificationHistoryService.markSent(
        history.id,
        result.messageId,
        result
      );
      return success({
        sent: true,
        historyId: updatedHistory.id,
        recipientName: targetRecipientName,
        recipientPhone: cleanPhone,
        message: renderedMessage,
        provider: "fonnte",
      });
    } else {
      const updatedHistory = await NotificationHistoryService.markFailed(
        history.id,
        result.error || "Gagal mengirim WhatsApp via Fonnte Provider",
        result
      );
      return error(
        result.error || "Gagal mengirim pesan WhatsApp via Fonnte Provider",
        500
      );
    }
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error sending notification template:", err);
    return error(err.message || "Failed to send notification template");
  }
}
