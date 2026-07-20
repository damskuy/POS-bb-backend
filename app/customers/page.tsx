import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany();

  return (
    <div>
      <h1>Customers</h1>

      <pre>
        {JSON.stringify(customers, null, 2)}
      </pre>
    </div>
  );
}