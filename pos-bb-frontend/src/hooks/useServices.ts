"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Service, ServiceInput } from "@/types/service";
import { ServiceService } from "@/services/service.service";
import { useToast } from "@/components/common/Toast";

export function useServices() {
  const { showToast } = useToast();

  const [rawServices, setRawServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search change
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusFilterChange = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const fetchServices = useCallback(async () => {
    if (rawServices.length === 0) {
      setLoading(true);
    }
    setIsFetching(true);
    setError(null);
    try {
      const { data, total: totalCount } = await ServiceService.getServices({
        page,
        limit,
        search: debouncedSearch,
        status: selectedStatus !== "All" ? selectedStatus : undefined,
        sort: "createdAt",
        order,
      });

      setRawServices(data);
      setTotal(totalCount);
    } catch (err: any) {
      const msg = err.message || "Gagal memuat daftar servis";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [page, limit, debouncedSearch, selectedStatus, order, showToast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Client-side status filter fallback
  const filteredServices = useMemo(() => {
    if (selectedStatus === "All") return rawServices;
    return rawServices.filter((s) => {
      const isInactive = s.status === "Inactive";
      return selectedStatus === "Inactive" ? isInactive : !isInactive;
    });
  }, [rawServices, selectedStatus]);

  const addService = async (input: ServiceInput): Promise<boolean> => {
    try {
      await ServiceService.createService(input);
      showToast("Service created", "success");
      fetchServices();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menambahkan jasa servis";
      showToast(msg, "error");
      return false;
    }
  };

  const editService = async (id: number, input: ServiceInput): Promise<boolean> => {
    try {
      await ServiceService.updateService(id, input);
      showToast("Service updated", "success");
      fetchServices();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menguji data jasa servis";
      showToast(msg, "error");
      return false;
    }
  };

  const removeService = async (id: number): Promise<boolean> => {
    try {
      await ServiceService.deleteService(id);
      showToast("Service deleted", "success");
      fetchServices();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menghapus jasa servis";
      showToast(msg, "error");
      return false;
    }
  };

  return {
    services: filteredServices,
    loading,
    isFetching,
    error,
    search,
    setSearch,
    selectedStatus,
    setSelectedStatus: handleStatusFilterChange,
    order,
    setOrder,
    page,
    setPage,
    limit,
    setLimit,
    total,
    fetchServices,
    addService,
    editService,
    removeService,
  };
}
