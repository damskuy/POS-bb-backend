import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { success, error, validationError, notFound } from "@/lib/response";
import { workOrderSchema } from "@/lib/validators/workOrder";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/work-orders/{id}:
 *   get:
 *     summary: Get Work Order Details
 *     description: Mengambil detail lengkap Work Order berdasarkan ID.
 *     tags:
 *       - WorkOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Work Order
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail Work Order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WorkOrder'
 *       404:
 *         description: Work Order tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update Work Order / Change Status
 *     description: Perbarui data atau transisi status Work Order.
 *     tags:
 *       - WorkOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Work Order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkOrderInput'
 *     responses:
 *       200:
 *         description: Work Order berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WorkOrder'
 *       400:
 *         description: Transisi status tidak valid atau data gagal divalidasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Work Order tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete Work Order
 *     description: Soft delete Work Order berdasarkan ID.
 *     tags:
 *       - WorkOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Work Order
 *     responses:
 *       200:
 *         description: Work Order berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WorkOrder'
 *       404:
 *         description: Work Order tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(
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

    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
      include: {
        customer: true,
        vehicle: true,
        mechanic: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        services: {
          where: {
            deletedAt: null,
          },
          include: {
            service: true,
          },
        },
        parts: {
          where: {
            deletedAt: null,
          },
          include: {
            sparePart: true,
          },
        },
        payment: true,
        invoice: true,
      },
    });

    if (!workOrder) {
      return notFound("Work order");
    }

    const { payment, invoice, ...rest } = workOrder;
    const cleanedWorkOrder = {
      ...rest,
      payment: payment && payment.deletedAt === null ? payment : null,
      invoice: invoice && invoice.deletedAt === null ? invoice : null,
    };

    return success(cleanedWorkOrder);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch work order");
  }
}

export async function PATCH(
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

    const existing = await prisma.workOrder.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
      include: {
        services: {
          where: {
            deletedAt: null,
          },
        },
        parts: {
          where: {
            deletedAt: null,
          },
        },
        payment: true,
      },
    });

    if (!existing) {
      return notFound("Work order");
    }

    const json = await request.json();

    const result = workOrderSchema.partial().safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    // Validate status transition if status is being updated
    if (json.status !== undefined) {
      const { canTransitionStatus } = await import("@/lib/work_order/status");
      
      // Determine effective status of existing work order
      let effectiveStatus: string = existing.status;
      if (existing.status === "COMPLETED" && existing.payment && existing.payment.status === "PAID") {
        effectiveStatus = "PAID";
      }

      if (!canTransitionStatus(effectiveStatus, result.data.status!)) {
        return error("Invalid status transition", 400);
      }
    }

    // Determine final list of services and parts to calculate subtotal and grandTotal
    const finalServices = result.data.services !== undefined
      ? result.data.services
      : existing.services.map((s) => ({
          serviceId: s.serviceId,
          price: s.price,
          quantity: s.quantity,
        }));

    const finalParts = result.data.parts !== undefined
      ? result.data.parts
      : existing.parts.map((p) => ({
          sparePartId: p.sparePartId,
          price: p.price,
          quantity: p.quantity,
        }));

    const calculatedSubtotal =
      finalServices.reduce((sum, s) => sum + s.price * s.quantity, 0) +
      finalParts.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const discount = json.discount !== undefined ? (result.data.discount ?? 0) : existing.discount;
    const tax = json.tax !== undefined ? (result.data.tax ?? 0) : existing.tax;
    const grandTotal = Math.max(0, calculatedSubtotal - discount + tax);

    const workOrder = await prisma.$transaction(async (tx) => {
      // 1. If services are provided, update services relation by deleting old ones and creating new ones
      if (result.data.services !== undefined) {
        await tx.workOrderService.deleteMany({
          where: {
            workOrderId: existing.id,
          },
        });
      }

      // 2. If parts are provided, update parts relation by deleting old ones and creating new ones
      if (result.data.parts !== undefined) {
        await tx.workOrderPart.deleteMany({
          where: {
            workOrderId: existing.id,
          },
        });
      }

      // 3. Perform update of work order itself
      const statusUpdate = json.status;
      let finalStatus: string | undefined = statusUpdate;
      
      if (statusUpdate === "PAID") {
        finalStatus = "COMPLETED";

        // Find or create payment
        const existingPayment = await tx.payment.findUnique({
          where: { workOrderId: existing.id },
        });

        if (existingPayment) {
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: "PAID",
              paidAt: new Date(),
            },
          });
        } else {
          await tx.payment.create({
            data: {
              workOrderId: existing.id,
              method: "CASH",
              amount: grandTotal,
              status: "PAID",
              paidAt: new Date(),
            },
          });
        }
      }

      return await tx.workOrder.update({
        where: {
          id: existing.id,
        },
        data: {
          customerId: result.data.customerId,
          vehicleId: result.data.vehicleId,
          mechanicId: result.data.mechanicId,
          userId: result.data.userId,
          status: finalStatus !== undefined ? (finalStatus as any) : undefined,
          complaint: result.data.complaint,
          odometer: result.data.odometer,
          notes: result.data.notes,
          subtotal: calculatedSubtotal,
          discount,
          tax,
          grandTotal,
          checkInAt: result.data.checkInAt,
          finishedAt: result.data.finishedAt,
          scheduleDate: result.data.scheduleDate,
          services: result.data.services !== undefined
            ? {
                create: result.data.services.map((s) => ({
                  serviceId: s.serviceId,
                  price: s.price,
                  quantity: s.quantity,
                  subtotal: s.price * s.quantity,
                })),
              }
            : undefined,
          parts: result.data.parts !== undefined
            ? {
                create: result.data.parts.map((p) => ({
                  sparePartId: p.sparePartId,
                  price: p.price,
                  quantity: p.quantity,
                  subtotal: p.price * p.quantity,
                })),
              }
            : undefined,
        },
        include: {
          customer: true,
          vehicle: true,
          mechanic: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          services: {
            where: {
              deletedAt: null,
            },
            include: {
              service: true,
            },
          },
          parts: {
            where: {
              deletedAt: null,
            },
            include: {
              sparePart: true,
            },
          },
          payment: true,
          invoice: true,
        },
      });
    });

    const { payment, invoice, ...rest } = workOrder;
    const cleanedWorkOrder = {
      ...rest,
      payment: payment && payment.deletedAt === null ? payment : null,
      invoice: invoice && invoice.deletedAt === null ? invoice : null,
    };

    const actionType = (json.status !== undefined && json.status !== existing.status) ? "CHANGE_STATUS" : "UPDATE";
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: actionType,
      entity: "WorkOrder",
      entityId: existing.id,
      oldData: existing,
      newData: cleanedWorkOrder,
      ipAddress,
      userAgent,
    });

    return success(cleanedWorkOrder);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return error("Work order code already exists", 409);
      }
      if (err.code === "P2003") {
        return error("Invalid reference ID. One or more referenced records (customer, vehicle, mechanic, user, service, or spare part) do not exist.", 400);
      }
    }

    return error("Failed to update work order");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
    ]);

    const { id } = await params;

    const existing = await prisma.workOrder.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Work order");
    }

    const workOrder = await prisma.workOrder.update({
      where: {
        id: existing.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "DELETE",
      entity: "WorkOrder",
      entityId: workOrder.id,
      oldData: existing,
      newData: workOrder,
      ipAddress,
      userAgent,
    });

    return success(workOrder);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to delete work order");
  }
}
