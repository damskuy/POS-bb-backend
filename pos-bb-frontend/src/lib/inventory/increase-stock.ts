import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function increaseStock(
  sparePartId: number,
  quantity: number,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;

  return await client.sparePart.update({
    where: {
      id: sparePartId,
    },
    data: {
      stock: {
        increment: quantity,
      },
    },
  });
}