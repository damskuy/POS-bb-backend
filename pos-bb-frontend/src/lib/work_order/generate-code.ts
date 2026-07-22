import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Generates a unique sequential Work Order code based on the current date.
 * Format: WO-YYYYMMDD-XXXX (e.g. WO-20260717-0001)
 * 
 * @param tx - Optional Prisma transaction client
 * @returns Generated unique code
 */
export async function generateWorkOrderCode(tx?: Prisma.TransactionClient): Promise<string> {
  const client = tx || prisma;
  const today = new Date();

  const date =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const prefix = `WO-${date}`;

  // Find the last work order with today's prefix
  const lastWorkOrder = await client.workOrder.findFirst({
    where: {
      code: {
        startsWith: prefix,
      },
    },
    orderBy: {
      code: "desc",
    },
  });

  let sequence = 1;

  if (lastWorkOrder) {
    const parts = lastWorkOrder.code.split("-");
    const lastSequence = Number(parts[parts.length - 1]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}
