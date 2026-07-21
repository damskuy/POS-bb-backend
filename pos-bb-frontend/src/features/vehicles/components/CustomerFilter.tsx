"use client";

import React, { useState, useEffect } from "react";
import { Customer } from "@/types/customer";
import { CustomerService } from "@/services/customer.service";

interface CustomerFilterProps {
  selectedCustomerId: string | number;
  onChange: (id: string | number) => void;
}

export const CustomerFilter: React.FC<CustomerFilterProps> = ({
  selectedCustomerId,
  onChange,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await CustomerService.getCustomers({ limit: 100 });
        setCustomers(res.data);
      } catch (err) {
        console.error("Failed to load customer list for filter", err);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  return (
    <div className="relative min-w-[200px]">
      <select
        value={selectedCustomerId}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
      >
        <option value="">Semua Pelanggan</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.phone})
          </option>
        ))}
      </select>
    </div>
  );
};
