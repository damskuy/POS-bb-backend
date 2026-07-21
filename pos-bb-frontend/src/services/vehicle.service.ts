import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { Vehicle, VehicleInput, GetVehiclesParams } from "@/types/vehicle";

export interface GetVehiclesResult {
  data: Vehicle[];
  total: number;
}

export const VehicleService = {
  getVehicles: async (params?: GetVehiclesParams): Promise<GetVehiclesResult> => {
    const res = await api.get<ApiResponse<Vehicle[]> & { total?: number; meta?: { total: number } }>("/api/vehicles", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
    const data = res.data || [];
    const total = typeof res.total === "number" ? res.total : (res.meta?.total ?? data.length);
    return { data, total };
  },

  getVehicleById: async (id: number): Promise<Vehicle> => {
    const res = await api.get<ApiResponse<Vehicle>>(`/api/vehicles/${id}`);
    if (!res.data) throw new Error("Kendaraan tidak ditemukan");
    return res.data;
  },

  createVehicle: async (data: VehicleInput): Promise<Vehicle> => {
    const res = await api.post<ApiResponse<Vehicle>>("/api/vehicles", data);
    if (!res.data) throw new Error("Gagal menambahkan kendaraan");
    return res.data;
  },

  updateVehicle: async (id: number, data: Partial<VehicleInput>): Promise<Vehicle> => {
    const res = await api.patch<ApiResponse<Vehicle>>(`/api/vehicles/${id}`, data);
    if (!res.data) throw new Error("Gagal menguji data kendaraan");
    return res.data;
  },

  deleteVehicle: async (id: number): Promise<Vehicle> => {
    const res = await api.delete<ApiResponse<Vehicle>>(`/api/vehicles/${id}`);
    if (!res.data) throw new Error("Gagal menghapus kendaraan");
    return res.data;
  },
};
