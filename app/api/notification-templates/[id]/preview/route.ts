import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { UserRole } from "@prisma/client";
import { success, error, notFound } from "@/lib/response";
import { ForbiddenError } from "@/lib/auth/errors";
import { TemplateRendererService } from "@/lib/notifications/template-renderer.service";

/**
 * POST /api/notification-templates/:id/preview
 * Preview template message rendering with actual database customer/workOrder context.
 * Does NOT dispatch any WhatsApp message.
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
      UserRole.MECHANIC,
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
    const { customerId, workOrderId, variables } = json;

    let customerData: any = null;
    let vehicleData: any = null;
    let workOrderData: any = null;

    let recipientName = "Pelanggan POS";
    let recipientPhone = "-";

    if (workOrderId) {
      const wo = await prisma.workOrder.findUnique({
        where: { id: Number(workOrderId) },
        include: { customer: true, vehicle: true },
      });
      if (wo) {
        workOrderData = wo;
        customerData = wo.customer;
        vehicleData = wo.vehicle;
        if (wo.customer) {
          recipientName = wo.customer.name;
          recipientPhone = wo.customer.phone;
        }
      }
    } else if (customerId) {
      const cust = await prisma.customer.findUnique({
        where: { id: Number(customerId) },
        include: { vehicles: true },
      });
      if (cust) {
        customerData = cust;
        recipientName = cust.name;
        recipientPhone = cust.phone;
        if (cust.vehicles && cust.vehicles.length > 0) {
          vehicleData = cust.vehicles[0];
        }
      }
    }

    if (variables?.customer_name) recipientName = variables.customer_name;
    if (variables?.customer_phone) recipientPhone = variables.customer_phone;

    const renderedMessage = TemplateRendererService.render(template.message, {
      customer: customerData,
      vehicle: vehicleData,
      workOrder: workOrderData,
      variables,
    });

    return success({
      templateId: template.id,
      templateName: template.name,
      category: template.category,
      recipientName,
      recipientPhone,
      renderedMessage,
    });
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error previewing notification template:", err);
    return error(err.message || "Failed to preview notification template");
  }
}
