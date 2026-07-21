import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { Service, ServiceInput, GetServicesParams } from "@/types/service";

export interface GetServicesResult {
  data: Service[];
  total: number;
}

export const ServiceService = {
  getServices: async (params?: GetServicesParams): Promise<GetServicesResult> => {
    const res = await api.get<ApiResponse<Service[]> & { total?: number; meta?: { total: number } }>("/api/services", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
    const data = res.data || [];
    const total = typeof res.total === "number" ? res.total : (res.meta?.total ?? data.length);
    return { data, total };
  },

  getServiceById: async (id: number): Promise<Service> => {
    const res = await api.get<ApiResponse<Service>>(`/api/services/${id}`);
    if (!res.data) throw new Error("Jasa servis tidak ditemukan");
    return res.data;
  },

  createService: async (data: ServiceInput): Promise<Service> => {
    const res = await api.post<ApiResponse<Service>>("/api/services", {
      name: data.name,
      price: data.price,
      description: data.description || null,
    });
    if (!res.data) throw new Error("Gagal menambahkan jasa servis");
    return res.data;
  },

  updateService: async (id: number, data: Partial<ServiceInput>): Promise<Service> => {
    const res = await api.patch<ApiResponse<Service>>(`/api/services/${id}`, {
      name: data.name,
      price: data.price,
      description: data.description || null,
    });
    if (!res.data) throw new Error("Gagal menguji data jasa servis");
    return res.data;
  },

  deleteService: async (id: number): Promise<Service> => {
    const res = await api.delete<ApiResponse<Service>>(`/api/services/${id}`);
    if (!res.data) throw new Error("Gagal menghapus jasa servis");
    return res.data;
  },
};
