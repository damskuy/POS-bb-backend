import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { success, error, validationError, notFound } from "@/lib/response";
import { invoiceSchema } from "@/lib/validators/invoice";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireRole } from "@/lib/auth/roles";
import { ForbiddenError } from "@/lib/auth/errors";

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

const invoiceIncludes = {
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
};

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get Invoice Details
 *     description: Mengambil rincian faktur berdasarkan ID.
 *     tags:
 *       - Invoice
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Faktur
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail faktur
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
 *       404:
 *         description: Faktur tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update Invoice
 *     description: Perbarui data faktur (status, tanggal terbit, dll).
 *     tags:
 *       - Invoice
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Faktur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceInput'
 *     responses:
 *       200:
 *         description: Faktur berhasil diperbarui
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
 *       404:
 *         description: Faktur tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete Invoice
 *     description: Soft delete faktur berdasarkan ID.
 *     tags:
 *       - Invoice
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Faktur
 *     responses:
 *       200:
 *         description: Faktur berhasil dihapus
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
 *       404:
 *         description: Faktur tidak ditemukan
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
    ]);

    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
      include: invoiceIncludes,
    });

    if (!invoice) {
      return notFound("Invoice");
    }

    return success(formatInvoice(invoice));
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to fetch invoice");
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

    const existing = await prisma.invoice.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Invoice");
    }

    const json = await request.json();

    const result = invoiceSchema.partial().safeParse(json);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const invoice = await prisma.invoice.update({
      where: {
        id: Number(id),
      },
      data: result.data,
      include: invoiceIncludes,
    });

    return success(formatInvoice(invoice));
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to update invoice");
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

    const existing = await prisma.invoice.findFirst({
      where: {
        id: Number(id),
        deletedAt: null,
      },
    });

    if (!existing) {
      return notFound("Invoice");
    }

    const invoice = await prisma.invoice.update({
      where: {
        id: Number(id),
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return success(invoice);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return error("Forbidden", 403);
    }
    console.error(err);
    return error("Failed to delete invoice");
  }
}

