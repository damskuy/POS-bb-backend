import {
  PrismaClient,
  Customer,
  Vehicle,
  Mechanic,
  Service,
  SparePart,
  User,
  WorkOrderStatus,
} from "@prisma/client";

interface Context {
  customers: Customer[];
  vehicles: Vehicle[];
  mechanics: Mechanic[];
  services: Service[];
  spareparts: SparePart[];
  users: User[];
}

export async function seedWorkOrders(prisma: PrismaClient, ctx: Context) {
  console.log("Seeding work orders...");

  const statuses: WorkOrderStatus[] = [
    WorkOrderStatus.PENDING,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.COMPLETED,
  ];

  const complaints = [
    "Bunyi mencicit saat mengerem",
    "Mesin agak bergetar saat stasioner",
    "Servis berkala rutin dan ganti oli",
    "AC kurang dingin saat siang hari",
    "Lampu utama mati sebelah kanan",
    "Setir agak menarik ke sebelah kiri",
    "Pedal kopling terasa agak berat",
    "Mesin kurang bertenaga saat tanjakan",
    "Oli menetes sedikit di bawah mesin",
    "Indikator cek mesin menyala sesekali",
  ];

  const workOrders = [];

  for (let i = 0; i < 10; i++) {
    const code = `WO-20260720-${String(i + 1).padStart(3, "0")}`;
    const customer = ctx.customers[i % ctx.customers.length];
    
    const customerVehicles = ctx.vehicles.filter((v) => v.customerId === customer.id);
    const vehicle = customerVehicles.length > 0 ? customerVehicles[0] : ctx.vehicles[i % ctx.vehicles.length];
    
    const mechanic = ctx.mechanics[i % ctx.mechanics.length];
    const user = ctx.users[i % ctx.users.length];
    const status = statuses[i % statuses.length];

    const s1 = ctx.services[i % ctx.services.length];
    const s2 = ctx.services[(i + 5) % ctx.services.length];

    const p1 = ctx.spareparts[i % ctx.spareparts.length];
    const p2 = ctx.spareparts[(i + 10) % ctx.spareparts.length];

    const serviceSubtotal = s1.price + s2.price;
    const partSubtotal = p1.price * 1 + p2.price * 2;
    const subtotal = serviceSubtotal + partSubtotal;
    const discount = 0;
    const tax = Math.round(subtotal * 0.11);
    const grandTotal = subtotal - discount + tax;

    const existing = await prisma.workOrder.findUnique({ where: { code } });
    if (existing) {
      await prisma.workOrderService.deleteMany({ where: { workOrderId: existing.id } });
      await prisma.workOrderPart.deleteMany({ where: { workOrderId: existing.id } });
    }

    const wo = await prisma.workOrder.upsert({
      where: { code },
      update: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        mechanicId: mechanic.id,
        userId: user.id,
        status,
        complaint: complaints[i % complaints.length],
        odometer: 15000 + i * 4500,
        subtotal,
        discount,
        tax,
        grandTotal,
        checkInAt: new Date(Date.now() - (10 - i) * 86400000),
        finishedAt: status === WorkOrderStatus.COMPLETED ? new Date(Date.now() - (10 - i) * 86400000 + 7200000) : null,
        services: {
          create: [
            { serviceId: s1.id, price: s1.price, quantity: 1, subtotal: s1.price },
            { serviceId: s2.id, price: s2.price, quantity: 1, subtotal: s2.price },
          ],
        },
        parts: {
          create: [
            { sparePartId: p1.id, price: p1.price, quantity: 1, subtotal: p1.price * 1 },
            { sparePartId: p2.id, price: p2.price, quantity: 2, subtotal: p2.price * 2 },
          ],
        },
      },
      create: {
        code,
        customerId: customer.id,
        vehicleId: vehicle.id,
        mechanicId: mechanic.id,
        userId: user.id,
        status,
        complaint: complaints[i % complaints.length],
        odometer: 15000 + i * 4500,
        subtotal,
        discount,
        tax,
        grandTotal,
        checkInAt: new Date(Date.now() - (10 - i) * 86400000),
        finishedAt: status === WorkOrderStatus.COMPLETED ? new Date(Date.now() - (10 - i) * 86400000 + 7200000) : null,
        services: {
          create: [
            { serviceId: s1.id, price: s1.price, quantity: 1, subtotal: s1.price },
            { serviceId: s2.id, price: s2.price, quantity: 1, subtotal: s2.price },
          ],
        },
        parts: {
          create: [
            { sparePartId: p1.id, price: p1.price, quantity: 1, subtotal: p1.price * 1 },
            { sparePartId: p2.id, price: p2.price, quantity: 2, subtotal: p2.price * 2 },
          ],
        },
      },
    });

    workOrders.push(wo);
  }

  console.log(`Seeded ${workOrders.length} work orders.`);
  return workOrders;
}
