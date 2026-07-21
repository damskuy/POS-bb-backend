"use client";

import React from "react";
import { Customer } from "@/types/customer";
import { formatDate } from "@/utils/format";
import { EmptyState } from "@/components/common/EmptyState";

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  isFetching?: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onAddClick?: () => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  isFetching = false,
  onEdit,
  onDelete,
  onAddClick,
}) => {
  if (loading && customers.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between animate-pulse gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              <div className="space-y-1.5">
                <div className="w-32 h-4 bg-slate-200 rounded" />
                <div className="w-24 h-3 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-24 h-4 bg-slate-200 rounded hidden sm:block" />
            <div className="w-32 h-4 bg-slate-200 rounded hidden md:block" />
            <div className="w-16 h-4 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (customers.length === 0 && !loading) {
    return (
      <EmptyState
        title="Belum Ada Data Pelanggan"
        description="Belum ada pelanggan yang terdaftar. Klik tombol 'Tambah Pelanggan' untuk membuat data baru."
        action={
          onAddClick && (
            <button
              onClick={onAddClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Pelanggan Baru</span>
            </button>
          )
        }
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs relative transition-all">
      {/* Top Loading Progress Bar */}
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600/30 overflow-hidden z-20">
          <div className="h-full bg-blue-600 animate-pulse w-full" />
        </div>
      )}

      <div className={`overflow-x-auto transition-opacity duration-200 ${isFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Nama Pelanggan</th>
              <th className="py-3.5 px-4">Nomor HP</th>
              <th className="py-3.5 px-4">Alamat</th>
              <th className="py-3.5 px-4 text-center">Jumlah Kendaraan</th>
              <th className="py-3.5 px-4">Terdaftar</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700 animate-fadeIn">
            {customers.map((customer) => {
              const vehicleCount =
                customer._count?.vehicles ?? customer.vehicles?.length ?? 0;

              return (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* Name */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">
                          {customer.name}
                        </p>
                        {customer.notes && (
                          <p className="text-xs text-slate-400 font-normal truncate max-w-xs mt-0.5">
                            {customer.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-4 px-4 font-semibold text-slate-800">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-xs font-mono text-slate-700 border border-slate-200/60">
                      <svg
                        className="w-3.5 h-3.5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {customer.phone}
                    </div>
                  </td>

                  {/* Address */}
                  <td className="py-4 px-4 text-xs text-slate-600 max-w-xs truncate">
                    {customer.address || <span className="text-slate-300 italic">-</span>}
                  </td>

                  {/* Vehicles count */}
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      {vehicleCount} Unit
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-4 px-4 text-xs text-slate-500 font-normal">
                    {formatDate(customer.createdAt)}
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(customer)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Pelanggan"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(customer)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Pelanggan"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
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
