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

  // Generate simple pagination numbers array
  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - 1 && i <= page + 1)
    ) {
      pages.push(i);
    } else if (
      (i === page - 2 && page - 2 > 1) ||
      (i === page + 2 && page + 2 < totalPages)
    ) {
      pages.push("...");
    }
  }

  const uniquePages = pages.filter((item, index) => pages.indexOf(item) === index);

  return (
    <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="text-xs text-slate-500 font-medium">
        Menampilkan {startItem} - {endItem} dari {total} {unitName}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {uniquePages.map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                p === page
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-1 text-slate-400 text-xs">
              ...
            </span>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const Pagination = CustomerPagination;
