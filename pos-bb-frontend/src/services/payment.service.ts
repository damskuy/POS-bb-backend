import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { InvoicePayment, PaymentInput } from "@/types/invoice";

export const PaymentService = {
  /**
   * Buat payment baru untuk sebuah Work Order.
   * Backend hanya izinkan 1 payment per workOrderId (unique constraint).
   */
  createPayment: async (data: PaymentInput): Promise<InvoicePayment> => {
    const res = await api.post<ApiResponse<InvoicePayment>>("/api/payments", data);
    if (!res.data) throw new Error("Gagal membuat pembayaran");
    return res.data;
  },

  /**
   * Update payment yang sudah ada (partial payment → full payment, dll).
   */
  updatePayment: async (id: number, data: Partial<PaymentInput>): Promise<InvoicePayment> => {
    const res = await api.patch<ApiResponse<InvoicePayment>>(`/api/payments/${id}`, data);
    if (!res.data) throw new Error("Gagal memperbarui pembayaran");
    return res.data;
  },

  /**
   * Ambil payment berdasarkan workOrderId.
   */
  getPaymentByWorkOrder: async (workOrderId: number): Promise<InvoicePayment | null> => {
    const res = await api.get<ApiResponse<InvoicePayment[]>>("/api/payments", {
      params: { workOrderId, limit: 1 },
    });
    const list = res.data || [];
    return list.length > 0 ? list[0] : null;
  },
};
