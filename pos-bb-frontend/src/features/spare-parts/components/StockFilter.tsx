"use client";

import React, { useState, useEffect, useRef } from "react";

interface StockFilterProps {
  stockFilter: string;
  onChange: (filter: string) => void;
}

export const StockFilter: React.FC<StockFilterProps> = ({
  stockFilter,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const getLabel = (filter: string) => {
    switch (filter) {
      case "In Stock":
        return "Stok: In Stock (Aman)";
      case "Low Stock":
        return "Stok: Low Stock (Menipis)";
      default:
        return "Stok: Semua";
    }
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs select-none cursor-pointer"
      >
        <span>{getLabel(stockFilter)}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200/80 rounded-xl shadow-lg z-30 py-1.5 animate-fadeIn">
          {(["All", "In Stock", "Low Stock"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                onChange(filter);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                stockFilter === filter ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
              }`}
            >
              <span>{getLabel(filter)}</span>
              {stockFilter === filter && (
                <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
