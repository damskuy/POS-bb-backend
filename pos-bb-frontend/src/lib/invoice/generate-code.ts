import { prisma } from "@/lib/prisma";

/**
 * Generates a sequential Invoice Number in the format:
 * INV-YYYYMMDD-XXXX
 * 
 * Logic:
 * 1. Get today's date in YYYYMMDD format.
 * 2. Find the last invoice with this prefix.
 * 3. Extract sequence number, increment by 1.
 * 4. Return formatted invoice number.
 * 
 * @param tx - Optional Prisma transaction client
 * @returns Generated invoice number string
 */
export async function generateInvoiceNumber(tx?: any): Promise<string> {
  const client = tx || prisma;
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`; // YYYYMMDD

  // Find last invoice created today
  const lastInvoice = await client.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `INV-${dateStr}-`,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
  });

  let nextSeq = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("-");
    const lastSeqStr = parts[parts.length - 1];
    const lastSeqNum = parseInt(lastSeqStr, 10);
    if (!isNaN(lastSeqNum)) {
      nextSeq = lastSeqNum + 1;
    }
  }

  const seqStr = String(nextSeq).padStart(4, "0");
  return `INV-${dateStr}-${seqStr}`;
}
