import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import {
  WorkOrder,
  WorkOrderInput,
  GetWorkOrdersParams,
} from "@/types/workOrder";

export interface GetWorkOrdersResult {
  data: WorkOrder[];
  total: number;
}

export const WorkOrderService = {
  getWorkOrders: async (params?: GetWorkOrdersParams): Promise<GetWorkOrdersResult> => {
    const res = await api.get<ApiResponse<WorkOrder[]> & { total?: number; meta?: { total: number } }>(
      "/api/work-orders",
      { params: params as Record<string, string | number | boolean | undefined> }
    );
    const data = res.data || [];
    const total = typeof res.total === "number" ? res.total : (res.meta?.total ?? data.length);
    return { data, total };
  },

  getWorkOrderById: async (id: number): Promise<WorkOrder> => {
    const res = await api.get<ApiResponse<WorkOrder>>(`/api/work-orders/${id}`);
    if (!res.data) throw new Error("Work order tidak ditemukan");
    return res.data;
  },

  createWorkOrder: async (data: WorkOrderInput): Promise<WorkOrder> => {
    const res = await api.post<ApiResponse<WorkOrder>>("/api/work-orders", data);
    if (!res.data) throw new Error("Gagal membuat work order");
    return res.data;
  },

  updateWorkOrder: async (id: number, data: Partial<WorkOrderInput> & { status?: string }): Promise<WorkOrder> => {
    const res = await api.patch<ApiResponse<WorkOrder>>(`/api/work-orders/${id}`, data);
    if (!res.data) throw new Error("Gagal memperbarui work order");
    return res.data;
  },

  deleteWorkOrder: async (id: number): Promise<WorkOrder> => {
    const res = await api.delete<ApiResponse<WorkOrder>>(`/api/work-orders/${id}`);
    if (!res.data) throw new Error("Gagal menghapus work order");
    return res.data;
  },
};
