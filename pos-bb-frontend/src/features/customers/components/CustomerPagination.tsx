"use client";

import React from "react";

interface CustomerPaginationProps {
  page: number;
  limit: number;
  total: number;
  unitName?: string;
  onPageChange: (page: number) => void;
}

export const CustomerPagination: React.FC<CustomerPaginationProps> = ({
  page,
  limit,
  total,
  unitName = "pelanggan",
  onPageChange,
}) => {
  const totalPages = Math.ceil(total / limit) || 1;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80 text-xs text-slate-500 font-medium">
      <div>
        Menampilkan <span className="font-bold text-slate-900">{startItem}</span> -{" "}
        <span className="font-bold text-slate-900">{endItem}</span> dari{" "}
        <span className="font-bold text-slate-900">{total}</span> {unitName}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Previous
        </button>

        <span className="px-3 py-1.5 font-semibold text-slate-800">
          Halaman {page} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export const Pagination = CustomerPagination;
