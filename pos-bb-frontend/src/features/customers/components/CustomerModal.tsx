"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Customer, CustomerInput } from "@/types/customer";
import { Modal } from "@/components/common";

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

  const handleChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
      description={isEditing ? "Perbarui informasi kontak pelanggan" : "Isi formulir untuk menambahkan pelanggan baru"}
      maxWidthClassName="max-w-md"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting
              ? "Menyimpan..."
              : isEditing
              ? "Simpan Perubahan"
              : "Tambah Pelanggan"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${
              errors.name
                ? "border-rose-400 focus:ring-rose-500/20"
                : "border-slate-200"
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
            className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${
              errors.phone
                ? "border-rose-400 focus:ring-rose-500/20"
                : "border-slate-200"
            }`}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.phone}</p>
          )}
        </div>

        {/* Address Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Alamat Tinggal
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Alamat lengkap pelanggan..."
            rows={3}
            className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
          />
        </div>

        {/* Notes Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Catatan Tambahan
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Catatan khusus pelanggan..."
            rows={2}
            className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
          />
        </div>
      </form>
    </Modal>
  );
};
