import { PrismaClient } from "@prisma/client";

export async function seedCustomers(prisma: PrismaClient) {
  console.log("Seeding customers...");

  const customersData = [
    { name: "Andi Wijaya", phone: "081100000001", address: "Jl. Melati No. 1", notes: "Pelanggan setia" },
    { name: "Bambang Susilo", phone: "081100000002", address: "Jl. Mawar No. 2", notes: "" },
    { name: "Citra Dewi", phone: "081100000003", address: "Jl. Anggrek No. 3", notes: "" },
    { name: "Deni Kurniawan", phone: "081100000004", address: "Jl. Dahila No. 4", notes: "" },
    { name: "Eka Rahmawati", phone: "081100000005", address: "Jl. Kenanga No. 5", notes: "" },
    { name: "Fajar Hidayat", phone: "081100000006", address: "Jl. Kamboja No. 6", notes: "" },
    { name: "Gita Gutawa", phone: "081100000007", address: "Jl. Flamboyan No. 7", notes: "" },
    { name: "Hendra Setiawan", phone: "081100000008", address: "Jl. Bougenville No. 8", notes: "" },
    { name: "Indah Permata", phone: "081100000009", address: "Jl. Cempaka No. 9", notes: "" },
    { name: "Joko Widodo", phone: "081100000010", address: "Jl. Veteran No. 10", notes: "" },
    { name: "Kartika Putri", phone: "081100000011", address: "Jl. Pemuda No. 11", notes: "" },
    { name: "Lukman Hakim", phone: "081100000012", address: "Jl. Pahlawan No. 12", notes: "" },
    { name: "Maya Ahmad", phone: "081100000013", address: "Jl. Diponegoro No. 13", notes: "" },
    { name: "Nugroho", phone: "081100000014", address: "Jl. Gajah Mada No. 14", notes: "" },
    { name: "Oktavia Nur", phone: "081100000015", address: "Jl. Hayam Wuruk No. 15", notes: "" },
    { name: "Pratama Arhan", phone: "081100000016", address: "Jl. Imam Bonjol No. 16", notes: "" },
    { name: "Qory Sandioriva", phone: "081100000017", address: "Jl. Raden Inten No. 17", notes: "" },
    { name: "Rizky Febian", phone: "081100000018", address: "Jl. Teuku Umar No. 18", notes: "" },
    { name: "Siti Badriah", phone: "081100000019", address: "Jl. Cut Nyak Dien No. 19", notes: "" },
    { name: "Taufik Hidayat", phone: "081100000020", address: "Jl. Pattimura No. 20", notes: "" },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: { name: c.name, address: c.address, notes: c.notes },
      create: c,
    });
    customers.push(customer);
  }

  console.log(`Seeded ${customers.length} customers.`);
  return customers;
}
