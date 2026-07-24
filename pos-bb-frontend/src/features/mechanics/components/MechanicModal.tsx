"use client";

import React, { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { Mechanic, MechanicInput, MechanicStatus } from "@/types/mechanic";

const mechanicSchema = z.object({
  name: z.string().min(3, "Nama mekanik minimal 3 karakter"),
  phone: z.string().min(8, "Nomor HP minimal 8 karakter"),
  address: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type MechanicFormData = {
  name: string;
  phone: string;
  address: string;
  skills: string;
  status: MechanicStatus;
  notes: string;
};

interface MechanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  mechanic?: Mechanic | null;
  onSubmit: (input: MechanicInput) => Promise<boolean>;
}

export const MechanicModal: React.FC<MechanicModalProps> = ({
  isOpen,
  onClose,
  mechanic,
  onSubmit,
}) => {
  const isEditing = Boolean(mechanic);

  const [formData, setFormData] = useState<MechanicFormData>({
    name: "",
    phone: "",
    address: "",
    skills: "",
    status: "Active",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mechanic) {
      setFormData({
        name: mechanic.name || "",
        phone: mechanic.phone || "",
        address: mechanic.address || "",
        skills: mechanic.skills || "",
        status: (mechanic.status as MechanicStatus) || "Active",
        notes: mechanic.notes || "",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        address: "",
        skills: "",
        status: "Active",
        notes: "",
      });
    }
    setErrors({});
  }, [mechanic, isOpen]);

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

  const handleChange = (field: keyof MechanicFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod Validation
    const result = mechanicSchema.safeParse(formData);
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
      phone: result.data.phone,
      address: result.data.address || null,
      skills: result.data.skills || null,
      status: result.data.status || "Active",
      notes: result.data.notes || null,
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">
                {isEditing ? "Edit Data Mekanik" : "Tambah Mekanik Baru"}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {isEditing
                  ? "Perbarui informasi profil dan keahlian mekanik"
                  : "Daftarkan mekanik teknisi baru ke dalam sistem"}
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
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Mekanik <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Contoh: Budi Santoso"
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
                Nomor HP <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Contoh: 08123456789"
                className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${
                  errors.phone
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200"
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Skills & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Keahlian (Specialization)
              </label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => handleChange("skills", e.target.value)}
                placeholder="Contoh: Mesin, Kelistrikan"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status
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
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alamat
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Alamat tempat tinggal mekanik..."
              className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Catatan tambahan (opsional)..."
              className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
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
                <span>{isEditing ? "Simpan Perubahan" : "Tambah Mekanik"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
