"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";

interface SparePartInventory {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  price: number;
}

const priorityConfig = {
  critical: {
    dot: "bg-rose-500",
    text: "text-rose-600",
    label: "Critical",
  },
  low: {
    dot: "bg-amber-500",
    text: "text-amber-600",
    label: "Low",
  },
};

export const LowStockAlert: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SparePartInventory[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get<ApiResponse<any>>("/api/dashboard");
        setItems(res.data?.inventory || []);
      } catch (err) {
        console.error("Error fetching low stock inventory:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const getStockLevel = (stock: number): "critical" | "low" => {
    return stock <= 2 ? "critical" : "low";
  };

  const criticalCount = items.filter((i) => i.stock <= 2).length;

  return (
    <div className="bg-white rounded-2xl shadow-2xs overflow-hidden border border-slate-100 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-[14px] font-bold text-slate-800">Low Stock Alert</h3>
        </div>
        {!loading && items.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50/60 text-rose-700 border border-rose-100 animate-pulse">
            {criticalCount} critical
          </span>
        )}
      </div>

      {/* Items List */}
      <div className="p-6 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                  <div className="h-3.5 w-32 bg-slate-100 rounded" />
                </div>
                <div className="h-3 w-10 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-xs text-slate-400 italic py-6">
            Semua stok aman dan mencukupi.
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {items.slice(0, 4).map((item) => {
              const level = getStockLevel(item.stock);
              const config = priorityConfig[level];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1 hover:bg-slate-50/40 transition-colors rounded-lg group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Compact Product Icon */}
                    <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {item.sku || "-"}</p>
                    </div>
                  </div>

                  {/* Stock ratio & Priority */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-bold text-slate-700 font-tabular">
                      {item.stock} / 5 pcs
                    </p>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${config.text} mt-0.5`}>
                      <span className={`w-1 h-1 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/10 flex justify-end">
        <Link
          href="/spare-parts"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          View Inventory
          <svg className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};
