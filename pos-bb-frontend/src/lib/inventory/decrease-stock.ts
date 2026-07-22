import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function decreaseStock(
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
        decrement: quantity,
      },
    },
  });
}