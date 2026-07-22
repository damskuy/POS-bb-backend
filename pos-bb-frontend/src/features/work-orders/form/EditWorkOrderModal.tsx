"use client";

import React, { useState, useEffect } from "react";
import { WorkOrder, WorkOrderServiceInput, WorkOrderPartInput } from "@/types/workOrder";
import { WorkOrderService as WOService } from "@/services/workorder.service";
import { ServiceSelector } from "./ServiceSelector";
import { SparePartSelector } from "./SparePartSelector";
import { useToast } from "@/components/common/Toast";
import { formatRupiah } from "@/utils/format";

interface EditWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  onSuccess: () => void;
}

export const EditWorkOrderModal: React.FC<EditWorkOrderModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [selectedServices, setSelectedServices] = useState<WorkOrderServiceInput[]>([]);
  const [selectedParts, setSelectedParts] = useState<WorkOrderPartInput[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && workOrder) {
      const initialServices: WorkOrderServiceInput[] = (workOrder.services || []).map((s) => ({
        serviceId: s.serviceId,
        price: s.price,
        quantity: s.quantity || 1,
      }));
      const initialParts: WorkOrderPartInput[] = (workOrder.parts || []).map((p) => ({
        sparePartId: p.sparePartId,
        price: p.price,
        quantity: p.quantity || 1,
      }));

      setSelectedServices(initialServices);
      setSelectedParts(initialParts);
    }
  }, [isOpen, workOrder]);

  if (!isOpen) return null;

  const handleAddService = (item: WorkOrderServiceInput) => {
    setSelectedServices((prev) => [...prev, item]);
  };

  const handleRemoveService = (serviceId: number) => {
    setSelectedServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  };

  const handleAddPart = (item: WorkOrderPartInput) => {
    setSelectedParts((prev) => [...prev, item]);
  };

  const handleRemovePart = (sparePartId: number) => {
    setSelectedParts((prev) => prev.filter((p) => p.sparePartId !== sparePartId));
  };

  const handleUpdatePartQty = (sparePartId: number, qty: number) => {
    setSelectedParts((prev) =>
      prev.map((p) => (p.sparePartId === sparePartId ? { ...p, quantity: qty } : p))
    );
  };

  const totalServices = selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const totalParts = selectedParts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const calculatedGrandTotal = Math.max(0, totalServices + totalParts - (workOrder.discount || 0) + (workOrder.tax || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await WOService.updateWorkOrder(workOrder.id, {
        services: selectedServices,
        parts: selectedParts,
      });
      showToast("Work Order berhasil diperbarui", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Gagal memperbarui Work Order", "error");
    } finally {
      setSubmitting(false);
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
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tambah / Edit Jasa & Suku Cadang
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {workOrder.code}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Services Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Jasa Servis ({selectedServices.length})
              </h4>
              <span className="font-mono text-xs font-bold text-blue-600">{formatRupiah(totalServices)}</span>
            </div>
            <ServiceSelector
              selectedServices={selectedServices}
              onAdd={handleAddService}
              onRemove={handleRemoveService}
            />
          </div>

          {/* Spare Parts Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Suku Cadang ({selectedParts.length})
              </h4>
              <span className="font-mono text-xs font-bold text-orange-600">{formatRupiah(totalParts)}</span>
            </div>
            <SparePartSelector
              selectedParts={selectedParts}
              onAdd={handleAddPart}
              onRemove={handleRemovePart}
              onUpdateQty={handleUpdatePartQty}
            />
          </div>

          {/* Grand Total Preview Card */}
          <div className="bg-slate-900 rounded-xl p-4 text-white flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Estimasi Grand Total Baru</p>
              <p className="text-xs text-slate-300">Total Jasa: {formatRupiah(totalServices)} | Part: {formatRupiah(totalParts)}</p>
            </div>
            <p className="font-mono text-xl font-black text-emerald-400">
              {formatRupiah(calculatedGrandTotal)}
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />}
              <span>{submitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
