"use client";

import React from "react";
import { Mechanic } from "@/types/mechanic";
import { formatDate } from "@/utils/format";
import { EmptyState } from "@/components/common/EmptyState";

interface MechanicTableProps {
  mechanics: Mechanic[];
  loading: boolean;
  isFetching?: boolean;
  onEdit: (mechanic: Mechanic) => void;
  onDelete: (mechanic: Mechanic) => void;
  onAddClick?: () => void;
}

export const MechanicTable: React.FC<MechanicTableProps> = ({
  mechanics,
  loading,
  isFetching = false,
  onEdit,
  onDelete,
  onAddClick,
}) => {
  if (loading && mechanics.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between animate-pulse gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full" />
              <div className="space-y-1.5">
                <div className="w-28 h-4 bg-slate-200 rounded" />
                <div className="w-20 h-3 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-24 h-4 bg-slate-200 rounded hidden sm:block" />
            <div className="w-16 h-4 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (mechanics.length === 0 && !loading) {
    return (
      <EmptyState
        title="Belum Ada Data Mekanik"
        description="Belum ada mekanik yang terdaftar dalam sistem. Klik tombol 'Tambah Mekanik' untuk mendaftarkan data baru."
        action={
          onAddClick && (
            <button
              onClick={onAddClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Mekanik Baru</span>
            </button>
          )
        }
      />
    );
  }

  return (
    <div className="relative">
      {/* Top Loading Progress Bar */}
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-200 overflow-hidden z-20">
          <div className="h-full bg-slate-900 animate-pulse w-full" />
        </div>
      )}

      <div className={`overflow-x-auto transition-opacity duration-200 ${isFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/80">
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nomor HP</th>
              <th className="text-center px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keahlian & Alamat</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Terdaftar</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mechanics.map((mechanic) => {
              const isActive = mechanic.status !== "Inactive";
              
              // Generate initials for avatar
              const initials = mechanic.name
                ? mechanic.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "M";

              return (
                <tr
                  key={mechanic.id}
                  className="group hover:bg-slate-50/60 transition-colors"
                >
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                        {initials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {mechanic.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-slate-800 font-semibold">
                      {mechanic.phone}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : "bg-slate-100 text-slate-800 border-slate-200/60"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Skills & Address */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {mechanic.skills || "Umum (General)"}
                      </p>
                      {mechanic.address && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {mechanic.address}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {formatDate(mechanic.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(mechanic)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Mekanik"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(mechanic)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Mekanik"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
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
