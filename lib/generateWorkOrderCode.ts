import { prisma } from "@/lib/prisma";

export async function generateWorkOrderCode() {
  const today = new Date();

  const date =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const prefix = `WO-${date}`;

  const lastWorkOrder = await prisma.workOrder.findFirst({
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
    const lastSequence = Number(lastWorkOrder.code.split("-").pop());

    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}