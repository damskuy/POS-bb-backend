"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SparePart } from "@/types/sparePart";
import { SparePartService } from "@/services/sparepart.service";
import { formatRupiah } from "@/utils/format";
import { WorkOrderPartInput } from "@/types/workOrder";

interface SparePartSelectorProps {
  selectedParts: WorkOrderPartInput[];
  onAdd: (item: WorkOrderPartInput) => void;
  onRemove: (sparePartId: number) => void;
  onUpdateQty: (sparePartId: number, qty: number) => void;
}

export const SparePartSelector: React.FC<SparePartSelectorProps> = ({
  selectedParts,
  onAdd,
  onRemove,
  onUpdateQty,
}) => {
  const [search, setSearch] = useState("");
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await SparePartService.getSpareParts({
        search: search || undefined,
        limit: 20,
      });
      setParts(data);
    } catch {
      setParts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchParts, 300);
    return () => clearTimeout(t);
  }, [fetchParts]);

  const isSelected = (id: number) => selectedParts.some((p) => p.sparePartId === id);
  const getQty = (id: number) => selectedParts.find((p) => p.sparePartId === id)?.quantity || 1;

  const handleAdd = (part: SparePart) => {
    onAdd({ sparePartId: part.id, price: part.price, quantity: 1 });
  };

  const handleQtyChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const qty = Math.max(1, parseInt(e.target.value, 10) || 1);
    onUpdateQty(id, qty);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Search bar */}
      <div className="p-3 border-b border-slate-100 bg-slate-50">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari suku cadang..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Parts list */}
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : parts.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            {search ? "Tidak ada suku cadang yang cocok" : "Belum ada suku cadang"}
          </div>
        ) : (
          parts.map((p) => {
            const selected = isSelected(p.id);
            return (
              <div key={p.id} className={`flex items-center justify-between px-4 py-3 transition-colors ${selected ? "bg-orange-50/60" : "hover:bg-slate-50"}`}>
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-orange-600">{formatRupiah(p.price)}</span>
                    {p.sku && <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>}
                    <span className="text-[10px] text-slate-500">Stok: {p.stock}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected ? (
                    <>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQtyChange(p.id, { target: { value: String(getQty(p.id) - 1) } } as any)}
                          className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                        >-</button>
                        <input
                          type="number"
                          min="1"
                          value={getQty(p.id)}
                          onChange={(e) => handleQtyChange(p.id, e)}
                          className="w-12 text-center text-xs font-bold border border-slate-200 rounded-lg py-1 focus:outline-none focus:border-blue-400"
                        />
                        <button
                          onClick={() => handleQtyChange(p.id, { target: { value: String(getQty(p.id) + 1) } } as any)}
                          className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                        >+</button>
                      </div>
                      <button
                        onClick={() => onRemove(p.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAdd(p)}
                      disabled={p.stock === 0}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      {p.stock === 0 ? "Habis" : "Tambah"}
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
