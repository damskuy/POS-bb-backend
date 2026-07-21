import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { SparePart, SparePartInput, GetSparePartsParams } from "@/types/sparePart";

export interface GetSparePartsResult {
  data: SparePart[];
  total: number;
}

export const SparePartService = {
  getSpareParts: async (params?: GetSparePartsParams): Promise<GetSparePartsResult> => {
    const res = await api.get<ApiResponse<SparePart[]> & { total?: number; meta?: { total: number } }>("/api/spare_parts", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
    const data = res.data || [];
    const total = typeof res.total === "number" ? res.total : (res.meta?.total ?? data.length);
    return { data, total };
  },

  getSparePartById: async (id: number): Promise<SparePart> => {
    const res = await api.get<ApiResponse<SparePart>>(`/api/spare_parts/${id}`);
    if (!res.data) throw new Error("Spare part tidak ditemukan");
    return res.data;
  },

  createSparePart: async (data: SparePartInput): Promise<SparePart> => {
    const res = await api.post<ApiResponse<SparePart>>("/api/spare_parts", {
      name: data.name,
      sku: data.sku || null,
      stock: data.stock,
      price: data.price,
    });
    if (!res.data) throw new Error("Gagal menambahkan suku cadang");
    return res.data;
  },

  updateSparePart: async (id: number, data: Partial<SparePartInput>): Promise<SparePart> => {
    const res = await api.patch<ApiResponse<SparePart>>(`/api/spare_parts/${id}`, {
      name: data.name,
      sku: data.sku || null,
      stock: data.stock,
      price: data.price,
    });
    if (!res.data) throw new Error("Gagal menguji suku cadang");
    return res.data;
  },

  deleteSparePart: async (id: number): Promise<SparePart> => {
    const res = await api.delete<ApiResponse<SparePart>>(`/api/spare_parts/${id}`);
    if (!res.data) throw new Error("Gagal menghapus suku cadang");
    return res.data;
  },
};
