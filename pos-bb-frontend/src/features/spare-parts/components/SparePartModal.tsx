"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { SparePart, SparePartInput } from "@/types/sparePart";

const sparePartSchema = z.object({
  sku: z.string().optional().nullable(),
  name: z.string().min(3, "Nama suku cadang minimal 3 karakter"),
  category: z.string().optional().nullable(),
  price: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number().min(0, "Harga tidak boleh negatif")
  ),
  stock: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number().min(0, "Stok tidak boleh negatif")
  ),
  minStock: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 5 : Number(val)),
    z.number().min(0, "Stok minimum tidak boleh negatif").optional()
  ),
  supplier: z.string().optional().nullable(),
  rackLocation: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

type SparePartFormData = {
  sku: string;
  name: string;
  category: string;
  price: string;
  stock: number | string;
  minStock: number | string;
  supplier: string;
  rackLocation: string;
  description: string;
};

interface SparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart?: SparePart | null;
  onSubmit: (input: SparePartInput) => Promise<boolean>;
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

export const SparePartModal: React.FC<SparePartModalProps> = ({
  isOpen,
  onClose,
  sparePart,
  onSubmit,
}) => {
  const isEditing = Boolean(sparePart);

  const [formData, setFormData] = useState<SparePartFormData>({
    sku: "",
    name: "",
    category: "",
    price: "",
    stock: "",
    minStock: 5,
    supplier: "",
    rackLocation: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (sparePart) {
      setFormData({
        sku: sparePart.sku || "",
        name: sparePart.name || "",
        category: sparePart.category || "",
        price: formatNumber(sparePart.price || 0),
        stock: sparePart.stock ?? 0,
        minStock: sparePart.minStock ?? 5,
        supplier: sparePart.supplier || "",
        rackLocation: sparePart.rackLocation || "",
        description: sparePart.description || "",
      });
    } else {
      setFormData({
        sku: "",
        name: "",
        category: "",
        price: "",
        stock: "",
        minStock: 5,
        supplier: "",
        rackLocation: "",
        description: "",
      });
    }
    setErrors({});
  }, [sparePart, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof SparePartFormData, value: any) => {
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
    const result = sparePartSchema.safeParse(payload);
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
      sku: result.data.sku || null,
      name: result.data.name,
      category: result.data.category || null,
      price: result.data.price,
      stock: result.data.stock,
      minStock: result.data.minStock ?? 5,
      supplier: result.data.supplier || null,
      rackLocation: result.data.rackLocation || null,
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">
                {isEditing ? "Edit Suku Cadang" : "Tambah Suku Cadang Baru"}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {isEditing
                  ? "Perbarui stok, harga, dan lokasi rak spare part"
                  : "Daftarkan spare part baru ke dalam inventaris"}
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
          {/* SKU & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kode / SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                placeholder="Contoh: SKU-01"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-mono uppercase font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Suku Cadang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Contoh: Oli Mesin"
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
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kategori
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="Contoh: Oli & Pelumas"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Harga Jual (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="Contoh: 75.000"
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
          </div>

          {/* Stock & Minimum Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jumlah Stok <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => handleChange("stock", e.target.value)}
                placeholder="Contoh: 25"
                className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${
                  errors.stock
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200"
                }`}
              />
              {errors.stock && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.stock}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Batas Minimum Stok
              </label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => handleChange("minStock", e.target.value)}
                placeholder="Default: 5"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>
          </div>

          {/* Supplier & Rack Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => handleChange("supplier", e.target.value)}
                placeholder="Contoh: Astra Otoparts"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lokasi Rak
              </label>
              <input
                type="text"
                value={formData.rackLocation}
                onChange={(e) => handleChange("rackLocation", e.target.value)}
                placeholder="Contoh: Rak A-02"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi Suku Cadang
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Catatan rincian spesifikasi atau info garansi..."
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
                <span>{isEditing ? "Simpan Perubahan" : "Tambah Suku Cadang"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
