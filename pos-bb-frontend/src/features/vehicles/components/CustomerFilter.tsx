"use client";

import React, { useState, useEffect, useRef } from "react";
import { Customer } from "@/types/customer";
import { CustomerService } from "@/services/customer.service";

interface CustomerFilterProps {
  selectedCustomerId: string | number;
  onChange: (id: string | number) => void;
}

export const CustomerFilter: React.FC<CustomerFilterProps> = ({
  selectedCustomerId,
  onChange,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await CustomerService.getCustomers({ limit: 100 });
        setCustomers(res.data);
      } catch (err) {
        console.error("Failed to load customer list for filter", err);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedCustomerName = selectedCustomerId
    ? customers.find((c) => String(c.id) === String(selectedCustomerId))?.name
    : "Semua Pelanggan";

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => !loading && setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs select-none cursor-pointer disabled:opacity-50 min-w-[160px]"
      >
        <span className="truncate">Pelanggan: {selectedCustomerName}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
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
        <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200/80 rounded-xl shadow-lg z-30 py-1.5 animate-fadeIn max-h-60 overflow-y-auto">
          <button
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
              selectedCustomerId === "" ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
            }`}
          >
            <span>Semua Pelanggan</span>
            {selectedCustomerId === "" && (
              <span className="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" />
            )}
          </button>
          {customers.map((c) => {
            const isSelected = String(c.id) === String(selectedCustomerId);
            return (
              <button
                key={c.id}
                onClick={() => {
                  onChange(c.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 ${
                  isSelected ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
                }`}
              >
                <span className="truncate">{c.name} <span className="text-[10px] text-slate-400 font-mono">({c.phone})</span></span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
