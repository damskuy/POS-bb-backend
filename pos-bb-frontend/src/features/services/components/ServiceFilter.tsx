"use client";

import React, { useState, useEffect, useRef } from "react";

interface ServiceFilterProps {
  selectedStatus: string;
  onChange: (status: string) => void;
}

export const ServiceFilter: React.FC<ServiceFilterProps> = ({
  selectedStatus,
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

  const getLabel = (status: string) => {
    switch (status) {
      case "Active":
        return "Status: Active";
      case "Inactive":
        return "Status: Inactive";
      default:
        return "Status: Semua";
    }
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs select-none cursor-pointer"
      >
        <span>{getLabel(selectedStatus)}</span>
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
        <div className="absolute left-0 mt-2 w-44 bg-white border border-slate-200/80 rounded-xl shadow-lg z-30 py-1.5 animate-fadeIn">
          {(["All", "Active", "Inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                onChange(status);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                selectedStatus === status ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
              }`}
            >
              <span>{getLabel(status)}</span>
              {selectedStatus === status && (
                <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
