import { prisma } from "@/lib/prisma";
import { Prisma, PaymentStatus, PaymentMethod, UserRole } from "@prisma/client";
import { getPagination } from "@/lib/pagination";
import { success, error, validationError } from "@/lib/response";
import { paymentSchema } from "@/lib/validators/payment";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: List Payments
 *     description: Mengambil daftar transaksi pembayaran dengan filter status, metode pembayaran, workOrderId, dan paginasi.
 *     tags:
 *       - Payment
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
 *         description: Kata kunci nomor referensi pembayaran
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UNPAID, PARTIAL, PAID]
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CASH, QRIS, TRANSFER, EWALLET]
 *       - in: query
 *         name: workOrderId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar pembayaran
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
 *                     $ref: '#/components/schemas/Payment'
 *   post:
 *     summary: Create Payment
 *     description: Catat transaksi pembayaran untuk Work Order.
 *     tags:
 *       - Payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentInput'
 *     responses:
 *       201:
 *         description: Pembayaran berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Pembayaran untuk Work Order ini sudah ada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    requireRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
    ]);

    const { searchParams } = new URL(request.url);

    const { skip, limit } = getPagination(searchParams);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const method = searchParams.get("method") || "";
    const workOrderId = searchParams.get("workOrderId");

    const allowedSortFields = [
      "createdAt",
      "paidAt",
      "amount",
    ];
    const sortParam = searchParams.get("sort") || "createdAt";
    const sort = allowedSortFields.includes(sortParam) ? sortParam : "createdAt";

    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.PaymentWhereInput = {
      deletedAt: null,
    };

    if (status) {
      const validStatuses = ["UNPAID", "PARTIAL", "PAID"];
      if (validStatuses.includes(status)) {
        where.status = status as PaymentStatus;
      }
    }

    if (method) {
      const validMethods = ["CASH", "QRIS", "TRANSFER", "EWALLET"];
      if (validMethods.includes(method)) {
        where.method = method as PaymentMethod;
      }
    }

    if (workOrderId) {
      const parsedWorkOrderId = Number(workOrderId);
      if (!isNaN(parsedWorkOrderId)) {
        where.workOrderId = parsedWorkOrderId;
      }
    }

    if (search) {
      where.referenceNumber = {
        contains: search,
        mode: "insensitive",
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        workOrder: true,
      },
      orderBy: {
        [sort]: order,
      },
      skip,
      take: limit,
    });

    return success(payments);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch payments");
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

    const result = paymentSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: result.data,
      });

      if (result.data.status === "PAID") {
        await tx.workOrder.update({
          where: { id: result.data.workOrderId },
          data: {
            status: "COMPLETED",
          },
        });
      }

      return p;
    });

    const refetched = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: {
        workOrder: true,
      },
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "Payment",
      entityId: payment.id,
      newData: refetched,
      ipAddress,
      userAgent,
    });

    return success(refetched, 201);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return error("A payment already exists for this work order", 409);
    }

    return error("Failed to create payment");
  }
}
