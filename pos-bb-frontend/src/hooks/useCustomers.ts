"use client";

import { useState, useEffect, useCallback } from "react";
import { Customer, CustomerInput } from "@/types/customer";
import { CustomerService } from "@/services/customer.service";
import { useToast } from "@/components/common/Toast";

export function useCustomers() {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
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
      setPage(1); // Reset to first page on search change
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    if (customers.length === 0) {
      setLoading(true);
    }
    setIsFetching(true);
    setError(null);
    try {
      const { data, total: totalCount } = await CustomerService.getCustomers({
        page,
        limit,
        search: debouncedSearch,
        sort: "createdAt",
        order,
      });

      setCustomers(data);
      setTotal(totalCount);
    } catch (err: any) {
      const msg = err.message || "Failed to load customers";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [page, limit, debouncedSearch, order, showToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = async (input: CustomerInput): Promise<boolean> => {
    try {
      await CustomerService.createCustomer(input);
      showToast("Pelanggan berhasil ditambahkan", "success");
      fetchCustomers();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menambahkan pelanggan";
      showToast(msg, "error");
      return false;
    }
  };

  const editCustomer = async (id: number, input: CustomerInput): Promise<boolean> => {
    try {
      await CustomerService.updateCustomer(id, input);
      showToast("Data pelanggan berhasil diperbarui", "success");
      fetchCustomers();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menguji data pelanggan";
      showToast(msg, "error");
      return false;
    }
  };

  const removeCustomer = async (id: number): Promise<boolean> => {
    try {
      await CustomerService.deleteCustomer(id);
      showToast("Pelanggan berhasil dihapus", "success");
      fetchCustomers();
      return true;
    } catch (err: any) {
      const msg = err.message || "Gagal menghapus pelanggan";
      showToast(msg, "error");
      return false;
    }
  };

  return {
    customers,
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
    fetchCustomers,
    addCustomer,
    editCustomer,
    removeCustomer,
  };
}
