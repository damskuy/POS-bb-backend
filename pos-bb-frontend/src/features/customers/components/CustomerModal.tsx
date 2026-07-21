"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Customer, CustomerInput } from "@/types/customer";

const customerSchema = z.object({
  name: z.string().min(2, "Nama pelanggan minimal 2 karakter"),
  phone: z.string().min(8, "Nomor HP minimal 8 karakter").max(20, "Nomor HP maksimal 20 karakter"),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSubmit: (input: CustomerInput) => Promise<boolean>;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSubmit,
}) => {
  const isEditing = Boolean(customer);

  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        notes: customer.notes || "",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        address: "",
        notes: "",
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod validation
    const result = customerSchema.safeParse(formData);
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
    const success = await onSubmit(result.data);
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

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl z-10 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                {isEditing
                  ? "Perbarui informasi kontak pelanggan"
                  : "Isi formulir untuk menambahkan pelanggan baru"}
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
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Contoh: Budi Santoso"
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

          {/* Phone Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nomor Telepon / HP <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Contoh: 081234567890"
              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.phone
                  ? "border-rose-400 focus:ring-rose-500/20"
                  : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.phone}</p>
            )}
          </div>

          {/* Address Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alamat Lengkap
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Contoh: Jl. Sudirman No. 45, Jakarta"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Pelanggan (Opsional)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Contoh: Pelanggan langganan servis rutin"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                <span>{isEditing ? "Simpan Perubahan" : "Tambah Pelanggan"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
