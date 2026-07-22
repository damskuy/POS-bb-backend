"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Vehicle } from "@/types/vehicle";
import { VehicleService } from "@/services/vehicle.service";

interface VehicleComboboxProps {
  customerId: number | null;
  value: Vehicle | null;
  onChange: (vehicle: Vehicle | null) => void;
  onAddNew: () => void;
  /** Diperlukan untuk refresh setelah kendaraan baru dibuat */
  refreshKey?: number;
  error?: string;
}

function vehicleLabel(v: Vehicle): string {
  return `${v.plateNumber} — ${v.brand} ${v.model}${v.year ? ` (${v.year})` : ""}`;
}

export const VehicleCombobox: React.FC<VehicleComboboxProps> = ({
  customerId,
  value,
  onChange,
  onAddNew,
  refreshKey = 0,
  error,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filtered, setFiltered] = useState<Vehicle[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const disabled = !customerId;

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

  // Fetch vehicles when customerId or refreshKey changes
  useEffect(() => {
    if (!customerId) {
      setVehicles([]);
      setFiltered([]);
      onChange(null);
      return;
    }
    setLoading(true);
    VehicleService.getVehicles({ customerId, limit: 100 })
      .then(({ data }) => {
        setVehicles(data);
        setFiltered(data);
      })
      .catch(() => {
        setVehicles([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, refreshKey]);

  // Local filter on query change
  useEffect(() => {
    if (!query.trim()) {
      setFiltered(vehicles);
    } else {
      const q = query.toLowerCase();
      setFiltered(
        vehicles.filter(
          (v) =>
            v.plateNumber.toLowerCase().includes(q) ||
            v.brand.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q)
        )
      );
    }
    setFocusedIndex(-1);
  }, [query, vehicles]);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setFocusedIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = useCallback(
    (vehicle: Vehicle) => {
      onChange(vehicle);
      setOpen(false);
      setQuery("");
      setFocusedIndex(-1);
    },
    [onChange]
  );

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = filtered.length + 1; // +1 for add new button
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + total) % total);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filtered.length) {
        handleSelect(filtered[focusedIndex]);
      } else if (focusedIndex === filtered.length) {
        setOpen(false);
        onAddNew();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setFocusedIndex(-1);
    }
  };

  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[focusedIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        Kendaraan <span className="text-rose-500">*</span>
      </label>

      {/* Disabled placeholder */}
      {disabled ? (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-not-allowed">
          <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span className="text-sm text-slate-400">Pilih customer terlebih dahulu</span>
        </div>
      ) : value && !open ? (
        /* Selected value */
        <div
          onClick={handleOpen}
          className={`flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl cursor-pointer hover:border-blue-400 transition-all ${
            error ? "border-rose-400" : "border-slate-200"
          }`}
        >
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm font-mono">{value.plateNumber}</p>
            <p className="text-xs text-slate-500">
              {value.brand} {value.model}{value.year ? ` · ${value.year}` : ""}
            </p>
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
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onClick={handleOpen}
              onKeyDown={handleKeyDown}
              placeholder="Pilih kendaraan..."
              className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                error ? "border-rose-400" : "border-slate-200 focus:border-blue-600"
              }`}
            />
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              {loading ? (
                <div className="px-4 py-4 flex items-center gap-2.5 text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span>Memuat kendaraan...</span>
                </div>
              ) : filtered.length === 0 ? (
                /* Empty state */
                <div className="px-4 py-5 flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {query ? "Kendaraan tidak ditemukan" : "Customer belum memiliki kendaraan"}
                  </p>
                  {query && (
                    <p className="text-xs text-slate-400">
                      Tidak ada hasil untuk &quot;{query}&quot;
                    </p>
                  )}
                </div>
              ) : (
                <ul ref={listRef} className="max-h-52 overflow-y-auto divide-y divide-slate-100/80">
                  {filtered.map((v, idx) => (
                    <li
                      key={v.id}
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(v); }}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className={`px-4 py-2.5 cursor-pointer transition-colors ${
                        focusedIndex === idx ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-bold text-slate-900 text-sm font-mono">{v.plateNumber}</p>
                      <p className="text-xs text-slate-500">
                        {v.brand} {v.model}{v.year ? ` · ${v.year}` : ""} · {v.transmission}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add New — always at bottom */}
              <div className="border-t border-slate-100 p-1.5">
                <button
                  type="button"
                  onMouseDown={handleAddNew}
                  onMouseEnter={() => setFocusedIndex(filtered.length)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    focusedIndex === filtered.length
                      ? "bg-blue-50 text-blue-700"
                      : "text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  Tambah Kendaraan
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
