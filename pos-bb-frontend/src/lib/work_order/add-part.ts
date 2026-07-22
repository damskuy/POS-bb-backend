import { prisma } from "@/lib/prisma";
import { recalculateWorkOrderTotal } from "./total";
import { checkStock } from "@/lib/inventory/check-stock";
import { decreaseStock } from "@/lib/inventory/decrease-stock";

export async function addPartToWorkOrder(
  workOrderId: number,
  sparePartId: number,
  quantity: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Cari Work Order
    const workOrder = await tx.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      throw new Error("Work Order not found");
    }

    // 2. Cari Spare Part & Cek Stok
    const sparePart = await tx.sparePart.findUnique({
      where: { id: sparePartId },
    });

    if (!sparePart) {
      throw new Error("Spare Part not found");
    }

    const hasStock = await checkStock(sparePartId, quantity, tx);
    if (!hasStock) {
      throw new Error("Insufficient stock");
    }

    // 3. Hitung subtotal
    const price = sparePart.price;
    const subtotal = price * quantity;

    // 4. Simpan WorkOrderPart
    const workOrderPart = await tx.workOrderPart.create({
      data: {
        workOrderId,
        sparePartId,
        price,
        quantity,
        subtotal,
      },
    });

    // 5. Kurangi stok
    await decreaseStock(sparePartId, quantity, tx);

    // 6. Hitung ulang total Work Order
    await recalculateWorkOrderTotal(workOrderId, tx);

    return workOrderPart;
  });
}