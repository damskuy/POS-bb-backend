"use client";

import { useState, useEffect, useCallback } from "react";
import { Vehicle, VehicleInput } from "@/types/vehicle";
import { VehicleService } from "@/services/vehicle.service";
import { useToast } from "@/components/common/Toast";

export function useVehicles() {
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | number>("");
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

  // Reset page when customer filter changes
  const handleCustomerFilterChange = (id: string | number) => {
    setSelectedCustomerId(id);
    setPage(1);
  };

  const fetchVehicles = useCallback(async () => {
    if (vehicles.length === 0) {
      setLoading(true);
    }
    setIsFetching(true);
    setError(null);
    try {
      const { data, total: totalCount } = await VehicleService.getVehicles({
        page,
        limit,
        search: debouncedSearch,
        customerId: selectedCustomerId || undefined,
        sort: "createdAt",
        order,
      });

      setVehicles(data);
      setTotal(totalCount);
    } catch (err: any) {
      const msg = err.message || "Gagal memuat daftar kendaraan";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [page, limit, debouncedSearch, selectedCustomerId, order, showToast]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const addVehicle = async (input: VehicleInput): Promise<boolean> => {
    try {
      await VehicleService.createVehicle(input);
      showToast("Vehicle created successfully", "success");
      fetchVehicles();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menambahkan kendaraan";
      showToast(msg, "error");
      return false;
    }
  };

  const editVehicle = async (id: number, input: VehicleInput): Promise<boolean> => {
    try {
      await VehicleService.updateVehicle(id, input);
      showToast("Vehicle updated successfully", "success");
      fetchVehicles();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menguji data kendaraan";
      showToast(msg, "error");
      return false;
    }
  };

  const removeVehicle = async (id: number): Promise<boolean> => {
    try {
      await VehicleService.deleteVehicle(id);
      showToast("Vehicle deleted successfully", "success");
      fetchVehicles();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menghapus kendaraan";
      showToast(msg, "error");
      return false;
    }
  };

  return {
    vehicles,
    loading,
    isFetching,
    error,
    search,
    setSearch,
    selectedCustomerId,
    setSelectedCustomerId: handleCustomerFilterChange,
    order,
    setOrder,
    page,
    setPage,
    limit,
    setLimit,
    total,
    fetchVehicles,
    addVehicle,
    editVehicle,
    removeVehicle,
  };
}
