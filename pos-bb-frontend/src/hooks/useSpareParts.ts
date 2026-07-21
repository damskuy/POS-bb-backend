"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SparePart, SparePartInput } from "@/types/sparePart";
import { SparePartService } from "@/services/sparepart.service";
import { useToast } from "@/components/common/Toast";

export function useSpareParts() {
  const { showToast } = useToast();

  const [rawSpareParts, setRawSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("All");
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

  const handleStockFilterChange = (filter: string) => {
    setStockFilter(filter);
    setPage(1);
  };

  const fetchSpareParts = useCallback(async () => {
    if (rawSpareParts.length === 0) {
      setLoading(true);
    }
    setIsFetching(true);
    setError(null);
    try {
      const { data, total: totalCount } = await SparePartService.getSpareParts({
        page,
        limit,
        search: debouncedSearch,
        lowStock: stockFilter === "Low Stock" ? "true" : undefined,
        sort: "createdAt",
        order,
      });

      setRawSpareParts(data);
      setTotal(totalCount);
    } catch (err: any) {
      const msg = err.message || "Gagal memuat suku cadang";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [page, limit, debouncedSearch, stockFilter, order, showToast]);

  useEffect(() => {
    fetchSpareParts();
  }, [fetchSpareParts]);

  // Client-side filtering logic for "In Stock" vs "Low Stock"
  const filteredSpareParts = useMemo(() => {
    if (stockFilter === "All") return rawSpareParts;
    return rawSpareParts.filter((sp) => {
      const min = sp.minStock ?? 5;
      if (stockFilter === "In Stock") {
        return sp.stock > min;
      }
      if (stockFilter === "Low Stock") {
        return sp.stock <= min;
      }
      return true;
    });
  }, [rawSpareParts, stockFilter]);

  const addSparePart = async (input: SparePartInput): Promise<boolean> => {
    try {
      await SparePartService.createSparePart(input);
      showToast("Spare Part created", "success");
      fetchSpareParts();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menambahkan suku cadang";
      showToast(msg, "error");
      return false;
    }
  };

  const editSparePart = async (id: number, input: SparePartInput): Promise<boolean> => {
    try {
      await SparePartService.updateSparePart(id, input);
      showToast("Spare Part updated", "success");
      fetchSpareParts();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menguji data suku cadang";
      showToast(msg, "error");
      return false;
    }
  };

  const removeSparePart = async (id: number): Promise<boolean> => {
    try {
      await SparePartService.deleteSparePart(id);
      showToast("Spare Part deleted", "success");
      fetchSpareParts();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menghapus suku cadang";
      showToast(msg, "error");
      return false;
    }
  };

  return {
    spareParts: filteredSpareParts,
    loading,
    isFetching,
    error,
    search,
    setSearch,
    stockFilter,
    setStockFilter: handleStockFilterChange,
    order,
    setOrder,
    page,
    setPage,
    limit,
    setLimit,
    total,
    fetchSpareParts,
    addSparePart,
    editSparePart,
    removeSparePart,
  };
}
