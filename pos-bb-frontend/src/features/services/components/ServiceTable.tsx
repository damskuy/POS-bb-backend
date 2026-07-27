"use client";

import React from "react";
import { Service } from "@/types/service";
import { formatDate, formatRupiah, formatDuration } from "@/utils/format";
import { EmptyState } from "@/components/common/EmptyState";

interface ServiceTableProps {
  services: Service[];
  loading: boolean;
  isFetching?: boolean;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onAddClick?: () => void;
  canManage?: boolean;
}

export const ServiceTable: React.FC<ServiceTableProps> = ({
  services,
  loading,
  isFetching = false,
  onEdit,
  onDelete,
  onAddClick,
  canManage = true,
}) => {
  if (loading && services.length === 0) {
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

  if (services.length === 0 && !loading) {
    return (
      <EmptyState
        title="Belum Ada Data Jasa Servis"
        description="Belum ada daftar tarif jasa servis yang terdaftar. Klik tombol 'Tambah Servis' untuk membuat data baru."
        action={
          onAddClick && (
            <button
              onClick={onAddClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Jasa Servis Baru</span>
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
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Service</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
              <th className="text-right px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Harga (Tarif)</th>
              <th className="text-center px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Terdaftar</th>
              {canManage && <th className="px-6 py-4 text-right"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((service) => {
              const isActive = service.status !== "Inactive";
              return (
                <tr
                  key={service.id}
                  className="group hover:bg-slate-50/60 transition-colors"
                >
                  {/* Service Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50/80 flex items-center justify-center text-blue-600 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-snug">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-slate-400 font-normal mt-0.5 line-clamp-1 max-w-xs">{service.description}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                      {service.category || "Umum"}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 text-right font-medium text-slate-900 text-sm font-tabular">
                    {formatRupiah(service.price)}
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {isActive ? "Aktif" : "Non-aktif"}
                    </span>
                  </td>

                  {/* Registered Date */}
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500 font-tabular whitespace-nowrap">
                    {service.createdAt ? formatDate(service.createdAt) : "-"}
                  </td>

                  {/* Action Buttons */}
                  {canManage && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(service)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Jasa Servis"
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
                          onClick={() => onDelete(service)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Jasa Servis"
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
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
