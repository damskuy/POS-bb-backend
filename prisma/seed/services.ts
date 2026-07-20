import { PrismaClient } from "@prisma/client";

export async function seedServices(prisma: PrismaClient) {
  console.log("Seeding services...");

  const servicesData = [
    { name: "Servis Berkala 10.000 KM", price: 150000, description: "Pemeriksaan standar 10k km" },
    { name: "Ganti Oli Mesin", price: 50000, description: "Jasa penggantian oli mesin" },
    { name: "Tune Up Engine", price: 250000, description: "Pembersihan & penyetelan mesin" },
    { name: "Servis Rem Empat Roda", price: 175000, description: "Pembersihan & penyetelan sistem rem" },
    { name: "Ganti Minyak Rem", price: 75000, description: "Kuras dan ganti minyak rem" },
    { name: "Spooring 3D", price: 200000, description: "Penyelarasan roda 3D" },
    { name: "Balancing Roda (per roda)", price: 35000, description: "Balancing pelek dan ban" },
    { name: "Ganti Oli Transmisi", price: 75000, description: "Jasa kuras oli transmisi" },
    { name: "Servis AC Paket Lengkap", price: 350000, description: "Pembersihan evaporator & cuci AC" },
    { name: "Cuci Injektor / Carbon Clean", price: 225000, description: "Pembersihan kerak karbon mesin" },
    { name: "Flush Radiator", price: 100000, description: "Kuras air radiator dan isi ulang" },
    { name: "Ganti Filter Udara", price: 25000, description: "Jasa ganti filter udara" },
    { name: "Ganti Filter AC / Kabin", price: 25000, description: "Jasa ganti filter kabin" },
    { name: "Ganti Busi (Set)", price: 40000, description: "Jasa pasang busi baru" },
    { name: "Ganti Aki", price: 30000, description: "Jasa tes dan ganti aki" },
  ];

  const services = [];
  for (const s of servicesData) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (existing) {
      const updated = await prisma.service.update({
        where: { id: existing.id },
        data: s,
      });
      services.push(updated);
    } else {
      const created = await prisma.service.create({ data: s });
      services.push(created);
    }
  }

  console.log(`Seeded ${services.length} services.`);
  return services;
}
