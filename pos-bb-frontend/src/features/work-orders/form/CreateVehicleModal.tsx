"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Vehicle, VehicleInput, TransmissionType } from "@/types/vehicle";
import { VehicleService } from "@/services/vehicle.service";

const schema = z.object({
  plateNumber: z.string().min(3, "Plat nomor minimal 3 karakter"),
  brand: z.string().min(2, "Merk minimal 2 karakter"),
  model: z.string().min(2, "Model minimal 2 karakter"),
  year: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(1900, "Tahun minimal 1900").max(2100, "Tahun maksimal 2100").optional()
  ),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
});

type FormData = {
  plateNumber: string;
  brand: string;
  model: string;
  year: number | string;
  transmission: TransmissionType;
};

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Customer yang sudah dipilih di Work Order */
  customerId: number;
  customerName: string;
  /** Dipanggil setelah kendaraan berhasil disimpan */
  onSuccess: (vehicle: Vehicle) => void;
}

const emptyForm = (): FormData => ({
  plateNumber: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  transmission: "MANUAL",
});

export const CreateVehicleModal: React.FC<CreateVehicleModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData(emptyForm());
      setErrors({});
      setServerError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      plateNumber: formData.plateNumber.trim().toUpperCase(),
    };

    const result = schema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const input: VehicleInput = {
        customerId,
        plateNumber: result.data.plateNumber,
        brand: result.data.brand,
        model: result.data.model,
        year: result.data.year ?? null,
        transmission: result.data.transmission,
      };
      const newVehicle = await VehicleService.createVehicle(input);
      onSuccess(newVehicle);
    } catch (err: any) {
      setServerError(err?.message || "Gagal menyimpan kendaraan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl z-10 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tambah Kendaraan Baru</h3>
              <p className="text-xs text-slate-500">
                Pemilik:{" "}
                <span className="font-semibold text-teal-700">{customerName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {serverError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {serverError}
            </div>
          )}

          {/* Plat Nomor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Plat Nomor <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.plateNumber}
              onChange={(e) => handleChange("plateNumber", e.target.value)}
              placeholder="Contoh: B 1234 ABC"
              autoFocus
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-mono uppercase font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.plateNumber
                  ? "border-rose-400 focus:ring-rose-500/20"
                  : "border-slate-200 focus:border-teal-600 focus:ring-teal-500/20"
              }`}
            />
            {errors.plateNumber && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.plateNumber}</p>
            )}
          </div>

          {/* Merk & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Merk <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="Toyota, Honda..."
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.brand
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-teal-600 focus:ring-teal-500/20"
                }`}
              />
              {errors.brand && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.brand}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Model <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
                placeholder="Avanza, Brio..."
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.model
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-teal-600 focus:ring-teal-500/20"
                }`}
              />
              {errors.model && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.model}</p>
              )}
            </div>
          </div>

          {/* Tahun & Transmisi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tahun</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleChange("year", e.target.value)}
                placeholder="2022"
                min={1900}
                max={2100}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.year
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-teal-600 focus:ring-teal-500/20"
                }`}
              />
              {errors.year && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.year}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Transmisi <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.transmission}
                onChange={(e) =>
                  handleChange("transmission", e.target.value as TransmissionType)
                }
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
              >
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATIC">Automatic</option>
              </select>
            </div>
          </div>

          {/* Info: customer is locked */}
          <div className="flex items-center gap-2.5 p-3 bg-teal-50 border border-teal-100 rounded-xl">
            <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-teal-700">
              Kendaraan akan didaftarkan atas nama{" "}
              <span className="font-bold">{customerName}</span>
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
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
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Simpan Kendaraan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
