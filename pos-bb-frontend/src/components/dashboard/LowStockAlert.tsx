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

const levelConfig = {
  critical: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    icon: "text-rose-500",
  },
  low: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "text-amber-500",
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
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Low Stock Alert</h3>
          {!loading && items.length > 0 && (
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
              {criticalCount} critical
            </span>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="p-5 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-50 border border-slate-100 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-xs text-slate-400 italic py-6">
            Semua stok aman dan mencukupi.
          </div>
        ) : (
          <div className="space-y-2.5 flex-1">
            {items.slice(0, 4).map((item) => {
              const level = getStockLevel(item.stock);
              const config = levelConfig[level];
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${config.bg} ${config.border} transition-colors animate-fadeIn`}
                >
                  <div className={`shrink-0 ${config.icon}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${config.text} truncate`}>{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Tersisa{" "}
                      <span className={`font-mono font-bold ${config.text}`}>
                        {item.stock} pcs
                      </span>
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border ${config.badge} capitalize`}>
                    {level}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/40">
        <Link
          href="/spare-parts"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View Inventory
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};
