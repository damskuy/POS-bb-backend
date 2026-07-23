"use client";

import React, { useState, useEffect, useRef } from "react";

interface WorkOrderFilterProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

export const WorkOrderFilter: React.FC<WorkOrderFilterProps> = ({
  statusFilter,
  onStatusChange,
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
      case "PENDING":
        return "Status: Waiting";
      case "IN_PROGRESS":
        return "Status: In Progress";
      case "WAITING_PART":
        return "Status: Waiting Part";
      case "READY":
        return "Status: Ready";
      case "COMPLETED":
        return "Status: Finished";
      case "CANCELLED":
        return "Status: Cancelled";
      default:
        return "Status: Semua";
    }
  };

  const options = [
    { value: "", label: "Status: Semua" },
    { value: "PENDING", label: "Waiting" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "WAITING_PART", label: "Waiting Part" },
    { value: "READY", label: "Ready" },
    { value: "COMPLETED", label: "Finished" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs select-none cursor-pointer"
      >
        <span>{getLabel(statusFilter)}</span>
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
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onStatusChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                statusFilter === opt.value ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
              }`}
            >
              <span>{opt.label}</span>
              {statusFilter === opt.value && (
                <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
