"use client";

import React, { useState, useEffect, useRef } from "react";
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

  // Dropdown States & Refs
  const [customerOpen, setCustomerOpen] = useState(false);
  const [transmissionOpen, setTransmissionOpen] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
  const transmissionRef = useRef<HTMLDivElement>(null);

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

  // Click Outside Event Handlers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setCustomerOpen(false);
      }
      if (transmissionRef.current && !transmissionRef.current.contains(e.target as Node)) {
        setTransmissionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-2xl z-10 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            {/* Icon Badge */}
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">
                {isEditing ? "Edit Data Kendaraan" : "Tambah Kendaraan Baru"}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {isEditing
                  ? "Perbarui spesifikasi dan pemilik kendaraan"
                  : "Daftarkan kendaraan baru ke dalam sistem"}
              </p>
            </div>
          </div>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pemilik Pelanggan <span className="text-rose-500">*</span>
            </label>
            <div className="relative" ref={customerRef}>
              <button
                type="button"
                onClick={() => !loadingCustomers && setCustomerOpen(!customerOpen)}
                disabled={loadingCustomers}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all shadow-2xs select-none cursor-pointer disabled:opacity-50 ${
                  errors.customerId
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200"
                }`}
              >
                <span className="truncate">
                  {formData.customerId
                    ? customers.find((c) => String(c.id) === String(formData.customerId))?.name || "-- Pilih Pelanggan --"
                    : "-- Pilih Pelanggan --"}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    customerOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {customerOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-xl shadow-lg z-30 py-1.5 animate-fadeIn max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleChange("customerId", "");
                      setCustomerOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                      formData.customerId === "" ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
                    }`}
                  >
                    <span>-- Pilih Pelanggan --</span>
                    {formData.customerId === "" && (
                      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" />
                    )}
                  </button>
                  {customers.map((c) => {
                    const isSelected = String(c.id) === String(formData.customerId);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          handleChange("customerId", c.id);
                          setCustomerOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 ${
                          isSelected ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
                        }`}
                      >
                        <span className="truncate">
                          {c.name} <span className="text-[10px] text-slate-400 font-mono">({c.phone})</span>
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {errors.customerId && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.customerId}</p>
            )}
          </div>

          {/* Plate Number & Transmission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Plat Nomor <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.plateNumber}
                onChange={(e) => handleChange("plateNumber", e.target.value)}
                placeholder="Contoh: B 1234 ABC"
                className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-mono uppercase font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${
                  errors.plateNumber
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200"
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
              <div className="relative" ref={transmissionRef}>
                <button
                  type="button"
                  onClick={() => setTransmissionOpen(!transmissionOpen)}
                  className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all shadow-2xs select-none cursor-pointer"
                >
                  <span>{formData.transmission === "MANUAL" ? "Manual" : "Automatic"}</span>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      transmissionOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {transmissionOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-xl shadow-lg z-30 py-1.5 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("transmission", "MANUAL");
                        setTransmissionOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        formData.transmission === "MANUAL" ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
                      }`}
                    >
                      <span>Manual</span>
                      {formData.transmission === "MANUAL" && (
                        <span className="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("transmission", "AUTOMATIC");
                        setTransmissionOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        formData.transmission === "AUTOMATIC" ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
                      }`}
                    >
                      <span>Automatic</span>
                      {formData.transmission === "AUTOMATIC" && (
                        <span className="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" />
                      )}
                    </button>
                  </div>
                )}
              </div>
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
                placeholder="Contoh: Toyota, Honda"
                className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${
                  errors.brand
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200"
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
                placeholder="Contoh: Avanza, Brio"
                className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${
                  errors.model
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200"
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
              className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${
                errors.year
                  ? "border-rose-400 focus:ring-rose-500/20"
                  : "border-slate-200"
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
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-4 py-2.5 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
