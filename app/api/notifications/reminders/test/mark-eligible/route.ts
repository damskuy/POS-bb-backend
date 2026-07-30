import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { UserRole, WorkOrderStatus } from "@prisma/client";
import { success, error, notFound } from "@/lib/response";
import { ForbiddenError } from "@/lib/auth/errors";

/**
 * POST /api/notifications/reminders/test/mark-eligible
 * Development & Admin testing utility endpoint to set a WorkOrder's finishedAt date
 * to 1 day in the past so it becomes eligible for 1-day reminder rules.
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [UserRole.ADMIN, UserRole.OWNER]);

    // Safety environment check
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_TEST_ENDPOINTS !== "true") {
      return error("Endpoint ini hanya tersedia untuk lingkungan pengujian/development.", 403);
    }

    const body = await request.json();
    const { workOrderId } = body;

    if (!workOrderId) {
      return error("workOrderId wajib diisi", 400);
    }

    const parsedId = Number(workOrderId);
    const existingWo = await prisma.workOrder.findUnique({
      where: { id: parsedId },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    if (!existingWo) {
      return notFound("Work Order");
    }

    const previousFinishedAt = existingWo.finishedAt;

    // Set finishedAt to exactly 1 day and 5 minutes ago so it satisfies 1-day interval
    const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000 + 5 * 60 * 1000));

    // Ensure status is COMPLETED
    const updatedWo = await prisma.workOrder.update({
      where: { id: parsedId },
      data: {
        status: WorkOrderStatus.COMPLETED,
        finishedAt: oneDayAgo,
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    return success({
      workOrderId: updatedWo.id,
      workOrderCode: updatedWo.code,
      customerName: updatedWo.customer.name,
      customerPhone: updatedWo.customer.phone,
      vehicle: `${updatedWo.vehicle.brand} ${updatedWo.vehicle.model}`,
      previousFinishedAt: previousFinishedAt ? previousFinishedAt.toISOString() : null,
      newFinishedAt: updatedWo.finishedAt ? updatedWo.finishedAt.toISOString() : null,
      status: updatedWo.status,
      message: `Work Order ${updatedWo.code} berhasil diubah menjadi eligible untuk 1-day reminder.`,
    });
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error("Error marking WO eligible for test:", err);
    return error(err.message || "Gagal mengubah status tanggal Work Order");
  }
}
