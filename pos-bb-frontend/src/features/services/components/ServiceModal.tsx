"use client";

import React, { useState, useEffect, useRef } from "react";
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
  price: string;
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

// Formatting Helper Functions
const formatNumber = (numStr: string | number): string => {
  if (numStr === "" || numStr === undefined || numStr === null) return "";
  const clean = String(numStr).replace(/\D/g, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (formattedStr: string): number => {
  const clean = formattedStr.replace(/\./g, "");
  return clean ? Number(clean) : 0;
};

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

  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        category: service.category || "",
        price: formatNumber(service.price || 0),
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

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!isOpen) return null;

  const handleChange = (field: keyof ServiceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePriceChange = (value: string) => {
    const formatted = formatNumber(value);
    handleChange("price", formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      price: parseNumber(formData.price),
    };

    // Zod Validation
    const result = serviceSchema.safeParse(payload);
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">
                {isEditing ? "Edit Jasa Servis" : "Tambah Jasa Servis Baru"}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {isEditing
                  ? "Perbarui tarif, durasi, dan rincian servis"
                  : "Daftarkan opsi tarif jasa servis baru"}
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
                placeholder="Contoh: Servis Berkala"
                className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${
                  errors.name
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200"
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
                placeholder="Contoh: Tune Up, Rem"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Harga Tarif (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="Contoh: 150.000"
              className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${
                errors.price
                  ? "border-rose-400 focus:ring-rose-500/20"
                  : "border-slate-200"
              }`}
            />
            {errors.price && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.price}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status Servis
            </label>
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                onClick={() => setStatusOpen(!statusOpen)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all shadow-2xs select-none cursor-pointer"
              >
                <span>{formData.status === "Active" ? "Active" : "Inactive"}</span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    statusOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {statusOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-xl shadow-lg z-30 py-1.5 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      handleChange("status", "Active");
                      setStatusOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                      formData.status === "Active" ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
                    }`}
                  >
                    <span>Active</span>
                    {formData.status === "Active" && (
                      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleChange("status", "Inactive");
                      setStatusOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                      formData.status === "Inactive" ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
                    }`}
                  >
                    <span>Inactive</span>
                    {formData.status === "Inactive" && (
                      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi Servis
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Penjelasan rincian pekerjaan servis..."
              className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all resize-none"
            />
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
                <span>{isEditing ? "Simpan Perubahan" : "Tambah Servis"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
