"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkOrder, WorkOrderInput, WorkOrderStatus, GetWorkOrdersParams } from "@/types/workOrder";
import { WorkOrderService } from "@/services/workorder.service";
import { useToast } from "@/components/common/Toast";

export function useWorkOrders(initialParams?: GetWorkOrdersParams) {
  const { showToast } = useToast();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [mechanicFilter, setMechanicFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchWorkOrders = useCallback(async () => {
    if (workOrders.length === 0) setLoading(true);
    setIsFetching(true);
    setError(null);
    try {
      const params: GetWorkOrdersParams = {
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        mechanicId: mechanicFilter ? Number(mechanicFilter) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sort: "createdAt",
        order,
      };
      const { data, total: totalCount } = await WorkOrderService.getWorkOrders(params);
      setWorkOrders(data);
      setTotal(totalCount);
    } catch (err: any) {
      const msg = err.message || "Gagal memuat work order";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, mechanicFilter, startDate, endDate, order, showToast]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const createWorkOrder = async (input: WorkOrderInput): Promise<WorkOrder | null> => {
    try {
      const wo = await WorkOrderService.createWorkOrder(input);
      showToast("Work Order created", "success");
      fetchWorkOrders();
      return wo;
    } catch (err: any) {
      const msg = err.message || "Gagal membuat work order";
      showToast(msg, "error");
      return null;
    }
  };

  const updateWorkOrder = async (id: number, input: Partial<WorkOrderInput> & { status?: string }): Promise<WorkOrder | null> => {
    try {
      const wo = await WorkOrderService.updateWorkOrder(id, input);
      showToast("Work Order updated", "success");
      fetchWorkOrders();
      return wo;
    } catch (err: any) {
      const msg = err.message || "Gagal memperbarui work order";
      showToast(msg, "error");
      return null;
    }
  };

  const updateStatus = async (id: number, status: WorkOrderStatus): Promise<WorkOrder | null> => {
    try {
      const wo = await WorkOrderService.updateWorkOrder(id, { status });
      showToast("Status updated", "success");
      fetchWorkOrders();
      return wo;
    } catch (err: any) {
      const msg = err.message || "Gagal memperbarui status";
      showToast(msg, "error");
      return null;
    }
  };

  const deleteWorkOrder = async (id: number): Promise<boolean> => {
    try {
      await WorkOrderService.deleteWorkOrder(id);
      showToast("Work Order deleted", "success");
      fetchWorkOrders();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menghapus work order";
      showToast(msg, "error");
      return false;
    }
  };

  return {
    workOrders,
    loading,
    isFetching,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter: (s: string) => { setStatusFilter(s); setPage(1); },
    mechanicFilter,
    setMechanicFilter: (m: string) => { setMechanicFilter(m); setPage(1); },
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    order,
    setOrder,
    page,
    setPage,
    limit,
    total,
    fetchWorkOrders,
    createWorkOrder,
    updateWorkOrder,
    updateStatus,
    deleteWorkOrder,
  };
}
