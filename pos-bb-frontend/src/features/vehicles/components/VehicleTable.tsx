"use client";

import React from "react";
import { Vehicle } from "@/types/vehicle";
import { formatDate } from "@/utils/format";
import { EmptyState } from "@/components/common/EmptyState";

interface VehicleTableProps {
  vehicles: Vehicle[];
  loading: boolean;
  isFetching?: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onAddClick?: () => void;
}

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  loading,
  isFetching = false,
  onEdit,
  onDelete,
  onAddClick,
}) => {
  if (loading && vehicles.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between animate-pulse gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              <div className="space-y-1.5">
                <div className="w-28 h-4 bg-slate-200 rounded" />
                <div className="w-20 h-3 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-32 h-4 bg-slate-200 rounded hidden sm:block" />
            <div className="w-24 h-4 bg-slate-200 rounded hidden md:block" />
            <div className="w-16 h-4 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (vehicles.length === 0 && !loading) {
    return (
      <EmptyState
        title="Belum Ada Data Kendaraan"
        description="Belum ada kendaraan yang terdaftar dalam sistem. Klik tombol 'Tambah Kendaraan' untuk membuat data baru."
        action={
          onAddClick && (
            <button
              onClick={onAddClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Kendaraan Baru</span>
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
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Plat Nomor</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pemilik (Pelanggan)</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Merk & Model</th>
              <th className="text-center px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tahun</th>
              <th className="text-center px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transmisi</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Terdaftar</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((vehicle) => (
              <tr
                key={vehicle.id}
                className="group hover:bg-slate-50/60 transition-colors"
              >
                {/* Plate Number */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/80 flex items-center justify-center text-blue-600 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM4 9h16M4 9a2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 00-2-2M4 9l2-4h12l2 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        {vehicle.plateNumber}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Customer */}
                <td className="px-6 py-4">
                  {vehicle.customer ? (
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {vehicle.customer.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {vehicle.customer.phone}
                      </p>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">-</span>
                  )}
                </td>

                {/* Brand & Model */}
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {vehicle.brand} {vehicle.model}
                  </p>
                </td>

                {/* Year */}
                <td className="px-6 py-4 text-center">
                  <span className="text-xs text-slate-600 font-semibold">
                    {vehicle.year || "-"}
                  </span>
                </td>

                {/* Transmission */}
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      vehicle.transmission === "AUTOMATIC"
                        ? "bg-purple-50 text-purple-700 border-purple-200/60"
                        : "bg-slate-100 text-slate-800 border-slate-200/60"
                    }`}
                  >
                    {vehicle.transmission === "AUTOMATIC" ? "Matik" : "Manual"}
                  </span>
                </td>

                {/* Date */}
                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                  {formatDate(vehicle.createdAt)}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(vehicle)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Kendaraan"
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
                      onClick={() => onDelete(vehicle)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Kendaraan"
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
