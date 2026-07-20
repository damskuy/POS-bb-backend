import { PrismaClient } from "@prisma/client";

export async function seedSpareParts(prisma: PrismaClient) {
  console.log("Seeding spare parts...");

  const baseParts = [
    { name: "Oli Mesin Synthetic 1L", price: 120000 },
    { name: "Oli Mesin Semi-Synthetic 1L", price: 85000 },
    { name: "Oli Transmisi Automatic 1L", price: 110000 },
    { name: "Oli Transmisi Manual 1L", price: 75000 },
    { name: "Minyak Rem DOT4 500ml", price: 45000 },
    { name: "Filter Oli Toyota Avanza/Xenia", price: 35000 },
    { name: "Filter Oli Honda Civic/HRV", price: 45000 },
    { name: "Filter Oli Mitsubishi Xpander", price: 40000 },
    { name: "Filter Udara Toyota Avanza", price: 65000 },
    { name: "Filter Udara Honda Civic", price: 95000 },
    { name: "Filter Udara Mitsubishi Xpander", price: 85000 },
    { name: "Filter Kabin AC Avanza", price: 50000 },
    { name: "Filter Kabin AC Civic", price: 75000 },
    { name: "Busi Iridium (1 pcs)", price: 90000 },
    { name: "Busi Standard (1 pcs)", price: 30000 },
    { name: "Kampas Rem Depan Avanza", price: 250000 },
    { name: "Kampas Rem Depan Civic", price: 450000 },
    { name: "Kampas Rem Depan Xpander", price: 320000 },
    { name: "Kampas Rem Belakang Avanza", price: 180000 },
    { name: "Kampas Rem Belakang Civic", price: 300000 },
    { name: "Dispad Rem Depan", price: 220000 },
    { name: "Aki Mobil 45Ah GS Astra", price: 850000 },
    { name: "Aki Mobil 60Ah Yuasa", price: 1100000 },
    { name: "Coolant Radiator 4L", price: 95000 },
    { name: "Wiper Blade 20 Inch Bosch", price: 60000 },
    { name: "Wiper Blade 16 Inch Bosch", price: 55000 },
    { name: "Fan Belt Toyota Avanza", price: 110000 },
    { name: "Timing Belt Honda", price: 350000 },
    { name: "Bohlam Lampu H4 Osram", price: 45000 },
    { name: "Bohlam Lampu LED H7", price: 175000 },
    { name: "Shockbreaker Depan Avanza (Pair)", price: 850000 },
    { name: "Shockbreaker Belakang Avanza (Pair)", price: 650000 },
    { name: "Tie Rod End Avanza", price: 160000 },
    { name: "Ball Joint Depan", price: 180000 },
    { name: "Karet Stabilizer", price: 35000 },
    { name: "Bearing Roda Depan", price: 240000 },
    { name: "Bearing Roda Belakang", price: 210000 },
    { name: "Radiator Assy Avanza", price: 750000 },
    { name: "Thermostat Radiator", price: 130000 },
    { name: "Pompa Air Radiator (Water Pump)", price: 320000 },
    { name: "Freon AC R134a 1 kaleng", price: 85000 },
    { name: "Karet Wiper Refill 1 pasang", price: 40000 },
    { name: "Kabel Busi Set", price: 175000 },
    { name: "Sensor Oksigen (O2)", price: 450000 },
    { name: "Karter Oli (Oil Pan)", price: 380000 },
    { name: "Injector Pembersih (Chemical)", price: 65000 },
    { name: "Engine Flush 300ml", price: 55000 },
    { name: "Steering Fluid 1L", price: 70000 },
    { name: "Grease CV Joint Tube", price: 35000 },
    { name: "Sekring Set Mobil (Fuse Kit)", price: 25000 },
  ];

  const spareParts = [];
  for (let i = 0; i < baseParts.length; i++) {
    const p = baseParts[i];
    const sku = `SP-${String(i + 1).padStart(3, "0")}`;
    const randomStock = Math.floor(Math.random() * 90) + 10;

    const part = await prisma.sparePart.upsert({
      where: { sku },
      update: {
        name: p.name,
        price: p.price,
        stock: randomStock,
      },
      create: {
        sku,
        name: p.name,
        price: p.price,
        stock: randomStock,
      },
    });

    spareParts.push(part);
  }

  console.log(`Seeded ${spareParts.length} spare parts.`);
  return spareParts;
}
