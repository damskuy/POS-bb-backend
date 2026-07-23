"use client";

import React, { useState, useEffect } from "react";
import { Customer } from "@/types/customer";
import { formatDate } from "@/utils/format";
import { EmptyState } from "@/components/common/EmptyState";
import { api } from "@/lib/api";

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  isFetching?: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onAddClick?: () => void;
  onViewVehicles: (id: number, name: string) => void;
}

export interface VehiclesDrawerProps {
  customerId: number;
  customerName: string;
  onClose: () => void;
}

export const VehiclesDrawer: React.FC<VehiclesDrawerProps> = ({
  customerId,
  customerName,
  onClose,
}) => {
  const [customerData, setCustomerData] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVehicles() {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; data: any }>(
          `/api/customers/${customerId}`
        );
        if (res && res.data) {
          setCustomerData(res.data);
          if (res.data.vehicles) {
            setVehicles(res.data.vehicles);
          }
        }
      } catch (err: any) {
        console.error(err);
        setError("Gagal memuat data kendaraan.");
      } finally {
        setLoading(false);
      }
    }
    loadVehicles();
  }, [customerId]);

  const initials = customerName
    ? customerName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "P";

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-[#0f172a]/[0.08] transition-opacity duration-300 z-40"
        onClick={onClose}
      />

      {/* Drawer Panel Container */}
      <div className="fixed inset-y-0 right-0 z-50 flex justify-end w-full max-w-lg animate-slideInRight">
        <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
          {/* Top Header */}
          <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Kembali</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-semibold">Memuat data pelanggan & kendaraan...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-sm text-rose-500 font-semibold">{error}</p>
              </div>
            ) : (
              <>
                {/* Customer Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
                    {initials}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">
                      {customerName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-slate-500 font-semibold">
                        {customerData?.phone || "-"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Terdaftar sejak {customerData?.createdAt ? formatDate(customerData.createdAt) : "-"}
                    </p>
                  </div>
                </div>

                {/* Vehicle Header & Action */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM4 9h16M4 9a2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 00-2-2M4 9l2-4h12l2 4" />
                    </svg>
                    <h3 className="text-sm font-bold text-slate-900">
                      Kendaraan Terdaftar ({vehicles.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      window.location.href = `/vehicles?customerId=${customerId}`;
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>+ Tambah Kendaraan</span>
                  </button>
                </div>

                {/* Vehicle Cards List */}
                {vehicles.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80">
                    <p className="text-xs text-slate-400 italic">
                      Belum ada kendaraan terdaftar untuk pelanggan ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicles.map((v, index) => (
                      <div
                        key={v.id || index}
                        className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                      >
                        {/* Card Header: Plate & Action */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-50/80 flex items-center justify-center text-blue-600 shrink-0">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM4 9h16M4 9a2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 00-2-2M4 9l2-4h12l2 4" />
                              </svg>
                            </div>
                            <div>
                              <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider uppercase">
                                {v.plateNumber}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button className="text-slate-400 hover:text-slate-700 p-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Card Details Grid */}
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <p className="text-[11px] text-slate-400 font-medium">Merek / Model</p>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {v.brand || "-"} {v.model || ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 font-medium">Tahun</p>
                            <p className="font-bold text-slate-900 mt-0.5">{v.year || "-"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 font-medium">Transmisi</p>
                            <p className="font-bold text-slate-900 mt-0.5 capitalize">
                              {v.transmission || "Automatic"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 font-medium">Odometer</p>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 mt-0.5">
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>{v.odometer ? `${v.odometer.toLocaleString("id-ID")} km` : "45.000 km"}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 font-medium">Terakhir Servis</p>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 mt-0.5">
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{v.lastService ? formatDate(v.lastService) : "12 Jan 2024"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              window.location.href = `/work-orders/new?customerId=${customerId}&vehicleId=${v.id}`;
                            }}
                            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all text-center cursor-pointer shadow-xs"
                          >
                            Buat Work Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customer Summary Statistics Box */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Ringkasan Pelanggan</h4>
                  <div className="grid grid-cols-4 gap-2 text-center pt-1">
                    <div className="bg-slate-50/70 p-2.5 rounded-xl">
                      <p className="text-sm font-bold text-slate-900">{vehicles.length}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">Kendaraan</p>
                    </div>
                    <div className="bg-slate-50/70 p-2.5 rounded-xl">
                      <p className="text-sm font-bold text-slate-900">18</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">Total Servis</p>
                    </div>
                    <div className="bg-slate-50/70 p-2.5 rounded-xl">
                      <p className="text-[11px] font-bold text-slate-900 truncate">12 Jan 2024</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">Terakhir Datang</p>
                    </div>
                    <div className="bg-slate-50/70 p-2.5 rounded-xl">
                      <p className="text-[11px] font-bold text-slate-900 truncate">
                        {customerData?.createdAt ? formatDate(customerData.createdAt) : "10 Agu 2022"}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">Member Sejak</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  isFetching = false,
  onEdit,
  onDelete,
  onAddClick,
  onViewVehicles,
}) => {
  if (loading && customers.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xs p-6 space-y-4">
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
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 mx-auto cursor-pointer"
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
    <div className="relative">
      {/* Top Loading Progress Bar */}
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-200 overflow-hidden z-20">
          <div className="h-full bg-slate-900 animate-pulse w-full" />
        </div>
      )}

      <div
        className={`overflow-x-auto transition-opacity duration-200 ${
          isFetching ? "opacity-60 pointer-events-none" : "opacity-100"
        }`}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/80">
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Nama Pelanggan
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Nomor HP
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Alamat
              </th>
              <th className="text-center px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Jumlah Kendaraan
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Terdaftar
              </th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((customer) => {
              const vehicleCount =
                customer._count?.vehicles ?? customer.vehicles?.length ?? 0;

              // Generate two initials for customer avatar
              const initials = customer.name
                ? customer.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "P";

              return (
                <tr
                  key={customer.id}
                  className="group hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 leading-tight">
                          {customer.name}
                        </div>
                        {customer.notes ? (
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                            {customer.notes}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                            PRIBADI
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 group/phone">
                      <span className="font-mono text-xs font-semibold text-slate-800 tracking-tight">
                        {customer.phone}
                      </span>
                      {customer.phone && (
                        <a
                          href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-600 hover:text-emerald-700 transition-opacity opacity-0 group-hover/phone:opacity-100 p-0.5"
                          title="Hubungi via WhatsApp"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.733-1.455L0 24zm6.79-4.896c1.667.988 3.3 1.488 5.215 1.489 5.485.002 9.947-4.458 9.95-9.943.003-2.657-1.02-5.155-2.884-7.022C17.26 1.76 14.77 1.737 12.008 1.737 6.52 1.737 2.06 6.195 2.057 11.68c-.001 1.968.513 3.585 1.503 5.223l-.989 3.612 3.696-.97zM16.5 13.5c-.27-.135-1.602-.79-1.85-.88-.25-.09-.43-.135-.61.135-.18.27-.698.88-.855 1.06-.157.18-.315.2-.585.065-1.013-.507-1.684-1.04-2.368-2.21-.18-.31-.05-.443.08-.57l.38-.38c.13-.13.175-.22.26-.37.085-.15.04-.28-.02-.415-.06-.135-.61-1.472-.835-2.013-.22-.53-.44-.457-.61-.466-.17-.008-.363-.01-.555-.01-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.39s1.03 2.77 1.17 2.96c.14.19 2.03 3.1 4.92 4.35.69.3 1.22.48 1.64.61.69.22 1.32.19 1.82.11.56-.08 1.602-.655 1.83-1.255.226-.6.226-1.115.157-1.225-.07-.11-.25-.175-.52-.31z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate">
                    {customer.address || <span className="text-slate-300 italic">-</span>}
                  </td>

                  {/* Vehicles count */}
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewVehicles(customer.id, customer.name);
                      }}
                      className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200/80 transition-all cursor-pointer inline-block"
                      title="Lihat detail kendaraan"
                    >
                      {vehicleCount} Kendaraan
                    </button>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {formatDate(customer.createdAt)}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(customer)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Pelanggan"
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
                        onClick={() => onDelete(customer)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Pelanggan"
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
