import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { Customer, CustomerInput, GetCustomersParams } from "@/types/customer";

export interface GetCustomersResult {
  data: Customer[];
  total: number;
}

export const CustomerService = {
  getCustomers: async (params?: GetCustomersParams): Promise<GetCustomersResult> => {
    const res = await api.get<ApiResponse<Customer[]> & { total?: number; meta?: { total: number } }>("/api/customers", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
    const data = res.data || [];
    const total = typeof res.total === "number" ? res.total : (res.meta?.total ?? data.length);
    return { data, total };
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    const res = await api.get<ApiResponse<Customer>>(`/api/customers/${id}`);
    if (!res.data) throw new Error("Customer tidak ditemukan");
    return res.data;
  },

  createCustomer: async (data: CustomerInput): Promise<Customer> => {
    const res = await api.post<ApiResponse<Customer>>("/api/customers", data);
    if (!res.data) throw new Error("Gagal membuat data pelanggan");
    return res.data;
  },

  updateCustomer: async (id: number, data: Partial<CustomerInput>): Promise<Customer> => {
    const res = await api.patch<ApiResponse<Customer>>(`/api/customers/${id}`, data);
    if (!res.data) throw new Error("Gagal menguji data pelanggan");
    return res.data;
  },

  deleteCustomer: async (id: number): Promise<Customer> => {
    const res = await api.delete<ApiResponse<Customer>>(`/api/customers/${id}`);
    if (!res.data) throw new Error("Gagal menghapus data pelanggan");
    return res.data;
  },
};
