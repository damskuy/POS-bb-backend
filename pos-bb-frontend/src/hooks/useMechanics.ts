"use client";

import { useState, useEffect, useCallback } from "react";
import { Mechanic, MechanicInput } from "@/types/mechanic";
import { MechanicService } from "@/services/mechanic.service";
import { useToast } from "@/components/common/Toast";

export function useMechanics() {
  const { showToast } = useToast();

  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
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

  const fetchMechanics = useCallback(async () => {
    if (mechanics.length === 0) {
      setLoading(true);
    }
    setIsFetching(true);
    setError(null);
    try {
      const { data, total: totalCount } = await MechanicService.getMechanics({
        page,
        limit,
        search: debouncedSearch,
        sort: "createdAt",
        order,
      });

      setMechanics(data);
      setTotal(totalCount);
    } catch (err: any) {
      const msg = err.message || "Gagal memuat daftar mekanik";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [page, limit, debouncedSearch, order, showToast]);

  useEffect(() => {
    fetchMechanics();
  }, [fetchMechanics]);

  const addMechanic = async (input: MechanicInput): Promise<boolean> => {
    try {
      await MechanicService.createMechanic(input);
      showToast("Mechanic created", "success");
      fetchMechanics();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menambahkan mekanik";
      showToast(msg, "error");
      return false;
    }
  };

  const editMechanic = async (id: number, input: MechanicInput): Promise<boolean> => {
    try {
      await MechanicService.updateMechanic(id, input);
      showToast("Mechanic updated", "success");
      fetchMechanics();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menguji data mekanik";
      showToast(msg, "error");
      return false;
    }
  };

  const removeMechanic = async (id: number): Promise<boolean> => {
    try {
      await MechanicService.deleteMechanic(id);
      showToast("Mechanic deleted", "success");
      fetchMechanics();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menghapus mekanik";
      showToast(msg, "error");
      return false;
    }
  };

  return {
    mechanics,
    loading,
    isFetching,
    error,
    search,
    setSearch,
    order,
    setOrder,
    page,
    setPage,
    limit,
    setLimit,
    total,
    fetchMechanics,
    addMechanic,
    editMechanic,
    removeMechanic,
  };
}
