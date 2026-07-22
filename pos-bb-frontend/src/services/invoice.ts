import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { Invoice, InvoiceInput, GetInvoicesParams } from "@/types/invoice";

export interface GetInvoicesResult {
  data: Invoice[];
  total: number;
}

export const InvoiceService = {
  getInvoices: async (params?: GetInvoicesParams): Promise<GetInvoicesResult> => {
    const res = await api.get<ApiResponse<Invoice[]> & { total?: number; meta?: { total: number } }>(
      "/api/invoices",
      { params: params as Record<string, string | number | boolean | undefined> }
    );
    const data = res.data || [];
    const total = typeof res.total === "number" ? res.total : (res.meta?.total ?? data.length);
    return { data, total };
  },

  getInvoiceById: async (id: number): Promise<Invoice> => {
    const res = await api.get<ApiResponse<Invoice>>(`/api/invoices/${id}`);
    if (!res.data) throw new Error("Invoice tidak ditemukan");
    return res.data;
  },

  createInvoice: async (workOrderId: number): Promise<Invoice> => {
    const res = await api.post<ApiResponse<Invoice>>("/api/invoices", { workOrderId });
    if (!res.data) throw new Error("Gagal membuat invoice");
    return res.data;
  },

  updateInvoice: async (id: number, data: Partial<InvoiceInput>): Promise<Invoice> => {
    const res = await api.patch<ApiResponse<Invoice>>(`/api/invoices/${id}`, data);
    if (!res.data) throw new Error("Gagal memperbarui invoice");
    return res.data;
  },
};
