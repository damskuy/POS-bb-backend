import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { getPagination } from "@/lib/pagination";
import { success, error, validationError } from "@/lib/response";
import { invoiceSchema } from "@/lib/validators/invoice";
import { generateInvoiceNumber } from "@/lib/invoice/generate-code";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

function formatInvoice(invoice: any) {
  const { workOrder, ...rest } = invoice;
  if (!workOrder || workOrder.deletedAt !== null) {
    return {
      ...rest,
      workOrder: null,
      payment: null,
      services: [],
      parts: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      grandTotal: 0,
      paymentStatus: "UNPAID",
    };
  }

  const payment = workOrder.payment && workOrder.payment.deletedAt === null
    ? workOrder.payment
    : null;

  return {
    ...rest,
    services: (workOrder.services || []).map((s: any) => ({
      serviceId: s.serviceId,
      name: s.service ? s.service.name : "",
      price: s.price,
      quantity: s.quantity,
      subtotal: s.subtotal,
    })),
    parts: (workOrder.parts || []).map((p: any) => ({
      sparePartId: p.sparePartId,
      name: p.sparePart ? p.sparePart.name : "",
      price: p.price,
      quantity: p.quantity,
      subtotal: p.subtotal,
    })),
    subtotal: workOrder.subtotal,
    discount: workOrder.discount,
    tax: workOrder.tax,
    grandTotal: workOrder.grandTotal,
    paymentStatus: payment ? payment.status : "UNPAID",
    workOrder: {
      ...workOrder,
      payment,
    },
    payment,
  };
}

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: List Invoices
 *     description: Mengambil daftar invoice/faktur dengan paginasi, filter status, workOrderId, & pencarian nomor faktur.
 *     tags:
 *       - Invoice
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
 *         description: Kata kunci nomor faktur
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: workOrderId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar faktur
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
 *                     $ref: '#/components/schemas/Invoice'
 *   post:
 *     summary: Create Invoice
 *     description: Buat faktur tagihan baru untuk Work Order.
 *     tags:
 *       - Invoice
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceInput'
 *     responses:
 *       201:
 *         description: Faktur berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Faktur untuk Work Order ini sudah ada
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
    const workOrderId = searchParams.get("workOrderId");

    const allowedSortFields = [
      "createdAt",
      "issuedAt",
    ];
    const sortParam = searchParams.get("sort") || "createdAt";
    const sort = allowedSortFields.includes(sortParam) ? sortParam : "createdAt";

    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
    };

    if (status) {
      if (status === "PAID" || status === "PARTIAL") {
        where.workOrder = {
          payment: {
            status: status as any,
            deletedAt: null,
          },
          deletedAt: null,
        };
      } else if (status === "UNPAID") {
        where.workOrder = {
          OR: [
            { payment: null },
            {
              payment: {
                status: "UNPAID",
                deletedAt: null,
              },
            },
            {
              payment: {
                deletedAt: { not: null },
              },
            },
          ],
          deletedAt: null,
        };
      } else {
        where.status = status;
      }
    }

    if (workOrderId) {
      const parsedWorkOrderId = Number(workOrderId);
      if (!isNaN(parsedWorkOrderId)) {
        where.workOrderId = parsedWorkOrderId;
      }
    }

    if (search) {
      where.OR = [
        {
          invoiceNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          workOrder: {
            customer: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          workOrder: {
            vehicle: {
              plateNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        workOrder: {
          include: {
            customer: true,
            vehicle: true,
            mechanic: true,
            payment: true,
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
          },
        },
      },
      orderBy: {
        [sort]: order,
      },
      skip,
      take: limit,
    });

    const cleanedInvoices = invoices.map(formatInvoice);
    return success(cleanedInvoices);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch invoices");
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

    const result = invoiceSchema.safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    // Auto-generate invoice number sequential code inside a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const generatedCode = await generateInvoiceNumber(tx);
      
      return await tx.invoice.create({
        data: {
          ...result.data,
          invoiceNumber: generatedCode,
        },
        include: {
          workOrder: {
            include: {
              customer: true,
              vehicle: true,
              mechanic: true,
              payment: true,
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
            },
          },
        },
      });
    });

    const formattedInvoice = formatInvoice(invoice);

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "Invoice",
      entityId: invoice.id,
      newData: formattedInvoice,
      ipAddress,
      userAgent,
    });

    return success(formattedInvoice, 201);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return error("An invoice already exists for this work order or invoice number exists", 409);
    }

    return error("Failed to create invoice");
  }
}

