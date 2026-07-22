export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER" | "EWALLET";
export type InvoiceStatus = "DRAFT" | "ISSUED" | "CANCELLED";

export interface InvoiceServiceItem {
  serviceId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface InvoicePartItem {
  sparePartId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface InvoicePayment {
  id: number;
  workOrderId: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  amount: number;
  referenceNumber?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceWorkOrder {
  id: number;
  code: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  odometer?: number | null;
  complaint?: string | null;
  notes?: string | null;
  createdAt: string;
  customer?: {
    id: number;
    name: string;
    phone: string;
    address?: string | null;
  } | null;
  vehicle?: {
    id: number;
    plateNumber: string;
    brand: string;
    model: string;
    year?: number | null;
    transmission: string;
  } | null;
  mechanic?: {
    id: number;
    name: string;
    phone: string;
  } | null;
  payment?: InvoicePayment | null;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  workOrderId: number;
  status: InvoiceStatus;
  issuedAt?: string | null;
  printedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  /** Derived from workOrder by backend formatInvoice() */
  services: InvoiceServiceItem[];
  parts: InvoicePartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  payment: InvoicePayment | null;
  workOrder: InvoiceWorkOrder | null;
}

export interface InvoiceInput {
  workOrderId: number;
  status?: InvoiceStatus;
  issuedAt?: string | null;
  printedAt?: string | null;
}

export interface PaymentInput {
  workOrderId: number;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  referenceNumber?: string | null;
  paidAt?: string | null;
}

export interface GetInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  workOrderId?: number;
  sort?: string;
  order?: "asc" | "desc";
}
