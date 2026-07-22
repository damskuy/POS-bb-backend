"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Customer } from "@/types/customer";
import { CustomerService } from "@/services/customer.service";

interface CustomerComboboxProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  onAddNew: () => void;
  error?: string;
}

export const CustomerCombobox: React.FC<CustomerComboboxProps> = ({
  value,
  onChange,
  onAddNew,
  error,
}) => {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    setFocusedIndex(-1);
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await CustomerService.getCustomers({ search: query, limit: 20 });
        setCustomers(data);
      } catch {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = useCallback((customer: Customer) => {
    onChange(customer);
    setOpen(false);
    setQuery("");
    setFocusedIndex(-1);
  }, [onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery("");
  };

  const handleAddNew = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onAddNew();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Total items = customers + 1 (add new button)
    const total = customers.length + 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + total) % total);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < customers.length) {
        handleSelect(customers[focusedIndex]);
      } else if (focusedIndex === customers.length) {
        setOpen(false);
        onAddNew();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setFocusedIndex(-1);
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[focusedIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        Customer <span className="text-rose-500">*</span>
      </label>

      {/* Selected value display */}
      {value && !open ? (
        <div
          onClick={handleOpen}
          className={`flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl cursor-pointer hover:border-blue-400 transition-all ${
            error ? "border-rose-400" : "border-slate-200"
          }`}
        >
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{value.name}</p>
            <p className="text-xs text-slate-400 font-mono">{value.phone}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 w-5 h-5 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 flex items-center justify-center flex-shrink-0 transition-colors"
            title="Hapus pilihan"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* Search input */
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {loading ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Cari nama customer atau nomor HP..."
              className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                error ? "border-rose-400" : "border-slate-200 focus:border-blue-600"
              }`}
            />
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              {/* Customer list */}
              {loading ? (
                <div className="px-4 py-4 flex items-center gap-2.5 text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span>Memuat daftar customer...</span>
                </div>
              ) : customers.length === 0 ? (
                /* Empty state */
                <div className="px-4 py-5 flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Tidak ada customer ditemukan</p>
                  {query && (
                    <p className="text-xs text-slate-400">
                      Tidak ditemukan hasil untuk &quot;{query}&quot;
                    </p>
                  )}
                </div>
              ) : (
                <ul ref={listRef} className="max-h-52 overflow-y-auto divide-y divide-slate-100/80">
                  {customers.map((c, idx) => (
                    <li
                      key={c.id}
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(c); }}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className={`px-4 py-2.5 cursor-pointer transition-colors ${
                        focusedIndex === idx ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-semibold text-slate-900 text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{c.phone}</p>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add New — always at bottom */}
              <div className="border-t border-slate-100 p-1.5">
                <button
                  type="button"
                  onMouseDown={handleAddNew}
                  onMouseEnter={() => setFocusedIndex(customers.length)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    focusedIndex === customers.length
                      ? "bg-blue-50 text-blue-700"
                      : "text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  Tambah Customer Baru
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
