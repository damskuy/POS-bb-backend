import { PrismaClient, Customer, Transmission } from "@prisma/client";

export async function seedVehicles(prisma: PrismaClient, customers: Customer[]) {
  console.log("Seeding vehicles...");

  const brandsModels = [
    { brand: "Toyota", model: "Avanza", trans: Transmission.AUTOMATIC },
    { brand: "Honda", model: "Civic", trans: Transmission.AUTOMATIC },
    { brand: "Mitsubishi", model: "Xpander", trans: Transmission.MANUAL },
    { brand: "Suzuki", model: "Ertiga", trans: Transmission.MANUAL },
    { brand: "Daihatsu", model: "Xenia", trans: Transmission.MANUAL },
    { brand: "Nissan", model: "Livina", trans: Transmission.AUTOMATIC },
    { brand: "Hyundai", model: "Stargazer", trans: Transmission.AUTOMATIC },
    { brand: "Wuling", model: "Confero", trans: Transmission.MANUAL },
    { brand: "Toyota", model: "Innova", trans: Transmission.AUTOMATIC },
    { brand: "Honda", model: "HR-V", trans: Transmission.AUTOMATIC },
  ];

  const vehicles = [];

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const item = brandsModels[i % brandsModels.length];
    const plateNumber = `B ${1001 + i} ${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i + 1) % 26))}`;

    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber },
      update: {
        customerId: customer.id,
        brand: item.brand,
        model: item.model,
        year: 2018 + (i % 7),
        transmission: item.trans,
      },
      create: {
        customerId: customer.id,
        plateNumber,
        brand: item.brand,
        model: item.model,
        year: 2018 + (i % 7),
        transmission: item.trans,
      },
    });

    vehicles.push(vehicle);
  }

  console.log(`Seeded ${vehicles.length} vehicles.`);
  return vehicles;
}
