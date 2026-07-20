import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function checkStock(
  sparePartId: number,
  quantity: number,
  tx?: Prisma.TransactionClient
): Promise<boolean> {
  const client = tx || prisma;

  const sparePart = await client.sparePart.findUnique({
    where: { id: sparePartId },
    select: { stock: true },
  });

  if (!sparePart) {
    return false;
  }

  return sparePart.stock >= quantity;
}