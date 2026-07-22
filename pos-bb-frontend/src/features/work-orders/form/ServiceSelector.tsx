"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Service } from "@/types/service";
import { ServiceService } from "@/services/service.service";
import { formatRupiah } from "@/utils/format";
import { WorkOrderServiceInput } from "@/types/workOrder";

interface ServiceSelectorProps {
  selectedServices: WorkOrderServiceInput[];
  onAdd: (item: WorkOrderServiceInput) => void;
  onRemove: (serviceId: number) => void;
  onUpdateQty?: (serviceId: number, qty: number) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedServices,
  onAdd,
  onRemove,
}) => {
  const [search, setSearch] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ServiceService.getServices({
        search: search || undefined,
        limit: 20,
        status: "Active",
      });
      setServices(data);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchServices, 300);
    return () => clearTimeout(t);
  }, [fetchServices]);

  const isSelected = (serviceId: number) =>
    selectedServices.some((s) => s.serviceId === serviceId);

  const handleAdd = (service: Service) => {
    onAdd({ serviceId: service.id, price: service.price, quantity: 1 });
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Search bar */}
      <div className="p-3 border-b border-slate-100 bg-slate-50">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jasa servis..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Service list */}
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : services.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            {search ? "Tidak ada jasa yang cocok" : "Belum ada jasa"}
          </div>
        ) : (
          services.map((s) => {
            const selected = isSelected(s.id);
            return (
              <div key={s.id} className={`flex items-center justify-between px-4 py-3 transition-colors ${selected ? "bg-blue-50/60" : "hover:bg-slate-50"}`}>
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-blue-600">{formatRupiah(s.price)}</span>
                    {s.category && <span className="text-[10px] text-slate-400 font-medium">{s.category}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                        <svg className="w-3 h-3 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Terpilih
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(s.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Jasa Servis"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdd(s)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
