"use client";

import React, { useState } from "react";
import { Vehicle } from "@/types/vehicle";

interface DeleteVehicleDialogProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<boolean>;
}

export const DeleteVehicleDialog: React.FC<DeleteVehicleDialogProps> = ({
  vehicle,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen || !vehicle) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    const success = await onConfirm(vehicle.id);
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
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 z-10 space-y-4 animate-scaleUp">
        <div className="flex items-center gap-4 text-rose-600">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Hapus Kendaraan</h3>
            <p className="text-xs text-slate-500 font-normal">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 space-y-1">
          <p><span className="font-semibold text-slate-900">Plat Nomor:</span> <span className="font-mono uppercase font-bold text-blue-600">{vehicle.plateNumber}</span></p>
          <p><span className="font-semibold text-slate-900">Kendaraan:</span> {vehicle.brand} {vehicle.model} ({vehicle.year || "-"})</p>
          {vehicle.customer && <p><span className="font-semibold text-slate-900">Pemilik:</span> {vehicle.customer.name}</p>}
        </div>

        <p className="text-xs text-slate-600">
          Apakah Anda yakin ingin menghapus data kendaraan plat <strong className="text-slate-900 uppercase">{vehicle.plateNumber}</strong>?
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <span>Ya, Hapus</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
