import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { Mechanic, MechanicInput, GetMechanicsParams } from "@/types/mechanic";

export interface GetMechanicsResult {
  data: Mechanic[];
  total: number;
}

export const MechanicService = {
  getMechanics: async (params?: GetMechanicsParams): Promise<GetMechanicsResult> => {
    const res = await api.get<ApiResponse<Mechanic[]> & { total?: number; meta?: { total: number } }>("/api/mechanics", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
    const data = res.data || [];
    const total = typeof res.total === "number" ? res.total : (res.meta?.total ?? data.length);
    return { data, total };
  },

  getMechanicById: async (id: number): Promise<Mechanic> => {
    const res = await api.get<ApiResponse<Mechanic>>(`/api/mechanics/${id}`);
    if (!res.data) throw new Error("Mekanik tidak ditemukan");
    return res.data;
  },

  createMechanic: async (data: MechanicInput): Promise<Mechanic> => {
    const res = await api.post<ApiResponse<Mechanic>>("/api/mechanics", {
      name: data.name,
      phone: data.phone,
      address: data.address || null,
    });
    if (!res.data) throw new Error("Gagal menambahkan mekanik");
    return res.data;
  },

  updateMechanic: async (id: number, data: Partial<MechanicInput>): Promise<Mechanic> => {
    const res = await api.patch<ApiResponse<Mechanic>>(`/api/mechanics/${id}`, {
      name: data.name,
      phone: data.phone,
      address: data.address || null,
    });
    if (!res.data) throw new Error("Gagal menguji data mekanik");
    return res.data;
  },

  deleteMechanic: async (id: number): Promise<Mechanic> => {
    const res = await api.delete<ApiResponse<Mechanic>>(`/api/mechanics/${id}`);
    if (!res.data) throw new Error("Gagal menghapus data mekanik");
    return res.data;
  },
};
