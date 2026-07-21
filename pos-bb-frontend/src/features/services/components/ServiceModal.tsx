"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Service, ServiceInput, ServiceStatus } from "@/types/service";

const serviceSchema = z.object({
  name: z.string().min(3, "Nama jasa servis minimal 3 karakter"),
  category: z.string().optional().nullable(),
  price: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number().min(0, "Harga tidak boleh negatif")
  ),
  duration: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, "Durasi tidak boleh negatif").optional().nullable()
  ),
  status: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

type ServiceFormData = {
  name: string;
  category: string;
  price: number | string;
  duration: number | string;
  status: ServiceStatus;
  description: string;
};

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
  onSubmit: (input: ServiceInput) => Promise<boolean>;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  service,
  onSubmit,
}) => {
  const isEditing = Boolean(service);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    category: "",
    price: "",
    duration: 60,
    status: "Active",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        category: service.category || "",
        price: service.price || 0,
        duration: service.duration || "",
        status: (service.status as ServiceStatus) || "Active",
        description: service.description || "",
      });
    } else {
      setFormData({
        name: "",
        category: "",
        price: "",
        duration: 60,
        status: "Active",
        description: "",
      });
    }
    setErrors({});
  }, [service, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ServiceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod Validation
    const result = serviceSchema.safeParse(formData);
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
      name: result.data.name,
      category: result.data.category || null,
      price: result.data.price,
      duration: result.data.duration || null,
      status: result.data.status || "Active",
      description: result.data.description || null,
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Jasa Servis" : "Tambah Jasa Servis Baru"}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                {isEditing
                  ? "Perbarui tarif, durasi, dan rincian servis"
                  : "Daftarkan opsi tarif jasa servis baru"}
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
          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Servis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Contoh: Servis Berkala 10.000 KM"
                className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kategori Servis
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="Contoh: Rutin, Tune Up, Rem"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Price & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Harga Tarif (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="Contoh: 150000"
                className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.price
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
                }`}
              />
              {errors.price && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Estimasi Durasi (Menit)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                placeholder="Contoh: 60"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status Servis
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value as ServiceStatus)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi Servis
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Penjelasan rincian pekerjaan servis..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            />
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
                <span>{isEditing ? "Simpan Perubahan" : "Tambah Servis"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
