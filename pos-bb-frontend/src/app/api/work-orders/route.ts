import { prisma } from "@/lib/prisma";
import { Prisma, WorkOrderStatus, PaymentStatus, UserRole } from "@prisma/client";
import { getPagination } from "@/lib/pagination";
import { success, error, validationError } from "@/lib/response";
import { workOrderSchema } from "@/lib/validators/workOrder";
import { generateWorkOrderCode } from "@/lib/generateWorkOrderCode";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/work-orders:
 *   get:
 *     summary: List Work Orders
 *     description: Mengambil daftar Work Order / Perintah Kerja dengan filter status, customerId, mechanicId, vehicleId, paymentStatus, rentang tanggal, paginasi, & pencarian.
 *     tags:
 *       - WorkOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pencarian kode WO, keluhan, catatan, nama/telepon pelanggan, plat kendaraan, nama mekanik
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, WAITING_PART, READY, COMPLETED, CANCELLED]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: mechanicId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [UNPAID, PARTIAL, PAID]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar Work Order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkOrder'
 *   post:
 *     summary: Create Work Order
 *     description: Membuat Work Order baru beserta daftar item jasa dan suku cadang jika ada.
 *     tags:
 *       - WorkOrder
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkOrderInput'
 *     responses:
 *       201:
 *         description: Work Order berhasil dibuat
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
 *         description: Validasi gagal atau referensi ID tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
      UserRole.MECHANIC,
    ]);

    const { searchParams } = new URL(request.url);

    const { skip, limit } = getPagination(searchParams);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const customerId = searchParams.get("customerId");
    const mechanicId = searchParams.get("mechanicId");
    const vehicleId = searchParams.get("vehicleId");
    const userId = searchParams.get("userId");
    const paymentStatus = searchParams.get("paymentStatus");

    const allowedSortFields = [
      "createdAt",
      "scheduleDate",
      "status",
      "total",
    ];
    const sortParam = searchParams.get("sort") || "createdAt";
    const sortKey = allowedSortFields.includes(sortParam) ? sortParam : "createdAt";
    const sort = sortKey === "total" ? "grandTotal" : sortKey;

    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.WorkOrderWhereInput = {
      deletedAt: null,
    };

    if (status) {
      const validStatuses = ["PENDING", "IN_PROGRESS", "WAITING_PART", "READY", "COMPLETED", "CANCELLED"];
      if (validStatuses.includes(status)) {
        where.status = status as WorkOrderStatus;
      }
    }

    if (customerId) {
      const parsedCustomerId = Number(customerId);
      if (!isNaN(parsedCustomerId)) {
        where.customerId = parsedCustomerId;
      }
    }

    if (mechanicId) {
      const parsedMechanicId = Number(mechanicId);
      if (!isNaN(parsedMechanicId)) {
        where.mechanicId = parsedMechanicId;
      }
    }

    if (vehicleId) {
      const parsedVehicleId = Number(vehicleId);
      if (!isNaN(parsedVehicleId)) {
        where.vehicleId = parsedVehicleId;
      }
    }

    if (userId) {
      const parsedUserId = Number(userId);
      if (!isNaN(parsedUserId)) {
        where.userId = parsedUserId;
      }
    }

    if (paymentStatus) {
      const validPaymentStatuses = ["UNPAID", "PARTIAL", "PAID"];
      if (validPaymentStatuses.includes(paymentStatus)) {
        where.payment = {
          status: paymentStatus as PaymentStatus,
          deletedAt: null,
        };
      }
    }

    // Created At date range filter
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      where.createdAt = dateFilter;
    }

    // Check In At date range filter
    const checkInStartDate = searchParams.get("checkInStartDate");
    const checkInEndDate = searchParams.get("checkInEndDate");
    if (checkInStartDate || checkInEndDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (checkInStartDate) {
        dateFilter.gte = new Date(checkInStartDate);
      }
      if (checkInEndDate) {
        dateFilter.lte = new Date(checkInEndDate);
      }
      where.checkInAt = dateFilter;
    }

    if (search) {
      where.OR = [
        {
          code: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          complaint: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          notes: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          customer: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          customer: {
            phone: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          vehicle: {
            plateNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          mechanic: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
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
      orderBy: {
        [sort]: order,
      },
      skip,
      take: limit,
    });

    const cleanedWorkOrders = workOrders.map((wo) => {
      const { payment, invoice, ...rest } = wo;
      return {
        ...rest,
        payment: payment && payment.deletedAt === null ? payment : null,
        invoice: invoice && invoice.deletedAt === null ? invoice : null,
      };
    });

    return success(cleanedWorkOrders);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch work orders");
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
    ]);

    const json = await request.json();

    const result = workOrderSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    // Generate unique code if not provided
    const code = await generateWorkOrderCode();

    const servicesData = result.data.services || [];
    const partsData = result.data.parts || [];

    const calculatedSubtotal =
      servicesData.reduce((sum, s) => sum + s.price * s.quantity, 0) +
      partsData.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const discount = result.data.discount ?? 0;
    const tax = result.data.tax ?? 0;
    const grandTotal = Math.max(0, calculatedSubtotal - discount + tax);

    const workOrder = await prisma.$transaction(async (tx) => {
      // Deduct stock for each spare part
      for (const p of partsData) {
        const sparePart = await tx.sparePart.findFirst({
          where: { id: p.sparePartId, deletedAt: null },
        });

        if (!sparePart) {
          throw new Error(`Suku cadang tidak ditemukan.`);
        }

        if (sparePart.stock < p.quantity) {
          throw new Error(`Stok suku cadang "${sparePart.name}" tidak mencukupi (Sisa stok: ${sparePart.stock}, dibutuhkan: ${p.quantity}).`);
        }

        await tx.sparePart.update({
          where: { id: p.sparePartId },
          data: {
            stock: {
              decrement: p.quantity,
            },
          },
        });
      }

      return await tx.workOrder.create({
        data: {
          code,
          customerId: result.data.customerId,
          vehicleId: result.data.vehicleId,
          mechanicId: result.data.mechanicId,
          userId: result.data.userId,
          status: (result.data.status as any) || "PENDING",
          complaint: result.data.complaint,
          notes: result.data.notes,
          odometer: result.data.odometer,
          subtotal: calculatedSubtotal,
          discount,
          tax,
          grandTotal,
          checkInAt: result.data.checkInAt,
          finishedAt: result.data.finishedAt,
          scheduleDate: result.data.scheduleDate,
          services: {
            create: servicesData.map((s) => ({
              serviceId: s.serviceId,
              price: s.price,
              quantity: s.quantity,
              subtotal: s.price * s.quantity,
            })),
          },
          parts: {
            create: partsData.map((p) => ({
              sparePartId: p.sparePartId,
              price: p.price,
              quantity: p.quantity,
              subtotal: p.price * p.quantity,
            })),
          },
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

    const { payment, invoice, ...rest } = workOrder as any;
    const cleanedWorkOrder = {
      ...rest,
      payment: payment && payment.deletedAt === null ? payment : null,
      invoice: invoice && invoice.deletedAt === null ? invoice : null,
    };

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "WorkOrder",
      entityId: workOrder.id,
      newData: cleanedWorkOrder,
      ipAddress,
      userAgent,
    });

    return success(cleanedWorkOrder, 201);
  } catch (err: any) {
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

    if (err instanceof Error && err.message) {
      return error(err.message, 400);
    }

    return error("Failed to create work order");
  }
}
