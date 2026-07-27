"use client";

import React, { useState } from "react";
import { Customer } from "@/types/customer";
import { Modal } from "@/components/common";

interface DeleteCustomerDialogProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<boolean>;
}

export const DeleteCustomerDialog: React.FC<DeleteCustomerDialogProps> = ({
  customer,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!customer) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    const success = await onConfirm(customer.id);
    setSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hapus Pelanggan"
      description="Tindakan ini tidak dapat dibatalkan."
      maxWidthClassName="max-w-md"
      icon={
        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="btn-danger"
          >
            {submitting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-sm text-slate-700 space-y-1">
          <p><span className="font-semibold text-slate-900">Nama:</span> {customer.name}</p>
          <p><span className="font-semibold text-slate-900">Nomor HP:</span> {customer.phone}</p>
          {customer.address && <p><span className="font-semibold text-slate-900">Alamat:</span> {customer.address}</p>}
        </div>

        <p className="text-sm text-slate-600">
          Apakah Anda yakin ingin menghapus data pelanggan <strong className="text-slate-900">{customer.name}</strong>?
        </p>
      </div>
    </Modal>
  );
};
