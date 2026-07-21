"use client";

import React from "react";
import { SparePart } from "@/types/sparePart";
import { formatDate, formatRupiah } from "@/utils/format";
import { EmptyState } from "@/components/common/EmptyState";

interface SparePartTableProps {
  spareParts: SparePart[];
  loading: boolean;
  isFetching?: boolean;
  onEdit: (sparePart: SparePart) => void;
  onDelete: (sparePart: SparePart) => void;
  onAddClick?: () => void;
}

export const SparePartTable: React.FC<SparePartTableProps> = ({
  spareParts,
  loading,
  isFetching = false,
  onEdit,
  onDelete,
  onAddClick,
}) => {
  if (loading && spareParts.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between animate-pulse gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              <div className="space-y-1.5">
                <div className="w-36 h-4 bg-slate-200 rounded" />
                <div className="w-24 h-3 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-24 h-4 bg-slate-200 rounded hidden sm:block" />
            <div className="w-20 h-4 bg-slate-200 rounded hidden md:block" />
            <div className="w-16 h-4 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (spareParts.length === 0 && !loading) {
    return (
      <EmptyState
        title="Belum Ada Data Suku Cadang"
        description="Belum ada suku cadang terdaftar dalam inventaris. Klik tombol 'Tambah Suku Cadang' untuk membuat data baru."
        action={
          onAddClick && (
            <button
              onClick={onAddClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Suku Cadang Baru</span>
            </button>
          )
        }
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs relative transition-all">
      {/* Top Loading Progress Bar */}
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600/30 overflow-hidden z-20">
          <div className="h-full bg-blue-600 animate-pulse w-full" />
        </div>
      )}

      <div className={`overflow-x-auto transition-opacity duration-200 ${isFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Kode Part (SKU)</th>
              <th className="py-3.5 px-4">Nama Suku Cadang</th>
              <th className="py-3.5 px-4">Kategori</th>
              <th className="py-3.5 px-4 text-right">Harga</th>
              <th className="py-3.5 px-4 text-center">Stok</th>
              <th className="py-3.5 px-4 text-center">Status Stok</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700 animate-fadeIn">
            {spareParts.map((item) => {
              const minStock = item.minStock ?? 5;
              const isOutOfStock = item.stock === 0;
              const isLowStock = item.stock > 0 && item.stock <= minStock;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* SKU */}
                  <td className="py-4 px-4 sm:px-6 font-mono text-xs font-bold text-blue-600 uppercase">
                    {item.sku || <span className="text-slate-400 font-normal italic">-</span>}
                  </td>

                  {/* Name */}
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-400 font-normal truncate max-w-xs mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                      {item.category || "Umum"}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 text-right font-mono font-semibold text-slate-900 text-xs sm:text-sm">
                    {formatRupiah(item.price)}
                  </td>

                  {/* Stock */}
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`font-mono font-bold text-xs sm:text-sm px-2.5 py-1 rounded-lg border ${
                        isOutOfStock
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : isLowStock
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      {item.stock} Unit
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4 text-center">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        In Stock
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Suku Cadang"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Suku Cadang"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
