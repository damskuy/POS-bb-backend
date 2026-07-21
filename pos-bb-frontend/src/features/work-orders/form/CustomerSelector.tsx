"use client";

import React, { useState, useEffect, useRef } from "react";
import { Customer } from "@/types/customer";
import { CustomerService } from "@/services/customer.service";

interface CustomerSelectorProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  error?: string;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({ value, onChange, error }) => {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await CustomerService.getCustomers({ search: query, limit: 10 });
        setCustomers(data);
      } catch {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  const handleSelect = (customer: Customer) => {
    onChange(customer);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        Customer <span className="text-rose-500">*</span>
      </label>

      {value ? (
        <div className={`flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl ${error ? "border-rose-400" : "border-slate-200"}`}>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{value.name}</p>
            <p className="text-xs text-slate-400 font-mono">{value.phone}</p>
          </div>
          <button onClick={handleClear} className="text-slate-400 hover:text-slate-600 ml-2 text-lg font-bold">
            &times;
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Ketik nama atau nomor HP pelanggan..."
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${error ? "border-rose-400" : "border-slate-200 focus:border-blue-600"}`}
          />
          {open && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              {loading ? (
                <div className="px-4 py-3 text-sm text-slate-500 animate-pulse">Memuat...</div>
              ) : customers.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400">Tidak ada customer ditemukan</div>
              ) : (
                <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {customers.map((c) => (
                    <li
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <p className="font-semibold text-slate-900 text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{c.phone}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
