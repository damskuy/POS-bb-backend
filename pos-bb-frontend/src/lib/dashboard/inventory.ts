import { prisma } from "@/lib/prisma";

export async function getInventory() {
  const lowStockParts = await prisma.sparePart.findMany({
    where: {
      stock: {
        lte: 5,
      },
      deletedAt: null,
    },
    orderBy: {
      stock: "asc",
    },
    take: 10,
  });

  return lowStockParts;
}
