"use client";

import React from "react";

interface SparePartSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SparePartSearch: React.FC<SparePartSearchProps> = ({
  value,
  onChange,
  placeholder = "Cari suku cadang (Nama, Kode Part, atau Kategori)...",
}) => {
  return (
    <div className="relative flex-1 max-w-md">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
      />
      <svg
        className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
          title="Clear search"
        >
          &times;
        </button>
      )}
    </div>
  );
};
