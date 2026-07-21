"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Vehicle, VehicleInput, TransmissionType } from "@/types/vehicle";
import { Customer } from "@/types/customer";
import { CustomerService } from "@/services/customer.service";

const vehicleSchema = z.object({
  customerId: z.number().positive("Pilih pelanggan pemilik kendaraan"),
  plateNumber: z.string().min(3, "Plat nomor minimal 3 karakter"),
  brand: z.string().min(2, "Merk kendaraan minimal 2 karakter"),
  model: z.string().min(2, "Model kendaraan minimal 2 karakter"),
  year: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(1900, "Tahun minimal 1900").max(2100, "Tahun maksimal 2100").optional()
  ),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
});

type VehicleFormData = {
  customerId: number | string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number | string;
  transmission: TransmissionType;
};

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
  onSubmit: (input: VehicleInput) => Promise<boolean>;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSubmit,
}) => {
  const isEditing = Boolean(vehicle);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);

  const [formData, setFormData] = useState<VehicleFormData>({
    customerId: "",
    plateNumber: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    transmission: "MANUAL",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch customers list for dropdown
  useEffect(() => {
    if (isOpen) {
      const fetchCustomerList = async () => {
        try {
          const list = await CustomerService.getCustomers({ limit: 100 });
          setCustomers(list.data);
        } catch (err) {
          console.error("Gagal mengambil daftar customer", err);
        } finally {
          setLoadingCustomers(false);
        }
      };
      fetchCustomerList();
    }
  }, [isOpen]);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        customerId: vehicle.customerId || "",
        plateNumber: vehicle.plateNumber || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        year: vehicle.year || "",
        transmission: vehicle.transmission || "MANUAL",
      });
    } else {
      setFormData({
        customerId: "",
        plateNumber: "",
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        transmission: "MANUAL",
      });
    }
    setErrors({});
  }, [vehicle, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof VehicleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      customerId: Number(formData.customerId),
      plateNumber: formData.plateNumber.trim().toUpperCase(),
    };

    // Zod Validation
    const result = vehicleSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const success = await onSubmit({
      customerId: Number(result.data.customerId),
      plateNumber: result.data.plateNumber,
      brand: result.data.brand,
      model: result.data.model,
      year: result.data.year || null,
      transmission: result.data.transmission,
    });
    setSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl z-10 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Data Kendaraan" : "Tambah Kendaraan Baru"}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                {isEditing
                  ? "Perbarui spesifikasi dan pemilik kendaraan"
                  : "Daftarkan kendaraan baru ke dalam sistem"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pemilik Pelanggan <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => handleChange("customerId", e.target.value)}
              disabled={loadingCustomers}
              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                errors.customerId
                  ? "border-rose-400 focus:ring-rose-500/20"
                  : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
              }`}
            >
              <option value="">-- Pilih Pelanggan --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.customerId}</p>
            )}
          </div>

          {/* Plate Number & Transmission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Plat Nomor (Nomor Polisi) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.plateNumber}
                onChange={(e) => handleChange("plateNumber", e.target.value)}
                placeholder="Contoh: B 1234 ABC"
                className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm font-mono uppercase font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.plateNumber
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
                }`}
              />
              {errors.plateNumber && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.plateNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Transmisi <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.transmission}
                onChange={(e) => handleChange("transmission", e.target.value as TransmissionType)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATIC">Automatic</option>
              </select>
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Merk Kendaraan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="Contoh: Toyota, Honda, Yamaha"
                className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.brand
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
                }`}
              />
              {errors.brand && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.brand}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Model Kendaraan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
                placeholder="Contoh: Avanza, Brio, Vario"
                className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.model
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
                }`}
              />
              {errors.model && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.model}</p>
              )}
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tahun Kendaraan
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => handleChange("year", e.target.value)}
              placeholder="Contoh: 2022"
              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.year
                  ? "border-rose-400 focus:ring-rose-500/20"
                  : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
              }`}
            />
            {errors.year && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.year}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEditing ? "Simpan Perubahan" : "Tambah Kendaraan"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
