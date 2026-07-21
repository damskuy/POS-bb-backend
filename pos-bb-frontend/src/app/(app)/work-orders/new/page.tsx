"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/common";
import { CustomerSelector } from "@/features/work-orders/form/CustomerSelector";
import { VehicleSelector } from "@/features/work-orders/form/VehicleSelector";
import { MechanicSelector } from "@/features/work-orders/form/MechanicSelector";
import { ServiceSelector } from "@/features/work-orders/form/ServiceSelector";
import { SparePartSelector } from "@/features/work-orders/form/SparePartSelector";
import { SummaryCard } from "@/features/work-orders/form/SummaryCard";
import { Customer } from "@/types/customer";
import { Vehicle } from "@/types/vehicle";
import { Mechanic } from "@/types/mechanic";
import {
  WorkOrderServiceInput,
  WorkOrderPartInput,
  WorkOrderInput,
} from "@/types/workOrder";
import { WorkOrderService } from "@/services/workorder.service";
import { useToast } from "@/components/common/Toast";
import Link from "next/link";

export default function NewWorkOrderPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [complaint, setComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [odometer, setOdometer] = useState("");
  const [selectedServices, setSelectedServices] = useState<WorkOrderServiceInput[]>([]);
  const [selectedParts, setSelectedParts] = useState<WorkOrderPartInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Service handlers
  const handleAddService = useCallback((item: WorkOrderServiceInput) => {
    setSelectedServices((prev) => {
      if (prev.some((s) => s.serviceId === item.serviceId)) return prev;
      return [...prev, item];
    });
  }, []);

  const handleRemoveService = useCallback((serviceId: number) => {
    setSelectedServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  }, []);

  const handleUpdateServiceQty = useCallback((serviceId: number, qty: number) => {
    setSelectedServices((prev) =>
      prev.map((s) => s.serviceId === serviceId ? { ...s, quantity: qty } : s)
    );
  }, []);

  // Spare part handlers
  const handleAddPart = useCallback((item: WorkOrderPartInput) => {
    setSelectedParts((prev) => {
      if (prev.some((p) => p.sparePartId === item.sparePartId)) return prev;
      return [...prev, item];
    });
  }, []);

  const handleRemovePart = useCallback((sparePartId: number) => {
    setSelectedParts((prev) => prev.filter((p) => p.sparePartId !== sparePartId));
  }, []);

  const handleUpdatePartQty = useCallback((sparePartId: number, qty: number) => {
    setSelectedParts((prev) =>
      prev.map((p) => p.sparePartId === sparePartId ? { ...p, quantity: qty } : p)
    );
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!customer) newErrors.customer = "Customer wajib dipilih";
    if (!vehicle) newErrors.vehicle = "Kendaraan wajib dipilih";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const input: WorkOrderInput = {
        customerId: customer!.id,
        vehicleId: vehicle!.id,
        mechanicId: mechanic?.id ?? null,
        complaint: complaint || null,
        notes: notes || null,
        odometer: odometer ? parseInt(odometer, 10) : null,
        services: selectedServices,
        parts: selectedParts,
      };

      const created = await WorkOrderService.createWorkOrder(input);
      showToast(`Work Order ${created.code} berhasil dibuat!`, "success");
      router.push(`/work-orders/${created.id}`);
    } catch (err: any) {
      showToast(err.message || "Gagal membuat work order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-5">
        <Link
          href="/work-orders"
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          title="Kembali"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buat Work Order Baru</h1>
          <p className="text-sm text-slate-500 mt-0.5">Lengkapi informasi di bawah untuk membuat perintah kerja baru.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        {/* Left: Main Form */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Section 1: Customer & Vehicle */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Customer & Kendaraan</h2>
            </div>

            <CustomerSelector
              value={customer}
              onChange={(c) => { setCustomer(c); setVehicle(null); }}
              error={errors.customer}
            />

            <VehicleSelector
              customerId={customer?.id ?? null}
              value={vehicle}
              onChange={setVehicle}
              error={errors.vehicle}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Odometer (km)</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="Contoh: 45000"
                min={0}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Section 2: Mechanic */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Mekanik</h2>
            </div>

            <MechanicSelector value={mechanic} onChange={setMechanic} />
          </div>

          {/* Section 3: Complaint & Notes */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Keluhan & Catatan</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keluhan</label>
              <textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={3}
                placeholder="Deskripsikan keluhan kendaraan pelanggan..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan Internal</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Catatan tambahan untuk tim bengkel..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
              />
            </div>
          </div>

          {/* Section 4: Services */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Jasa Servis
                {selectedServices.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black">
                    {selectedServices.length}
                  </span>
                )}
              </h2>
            </div>
            <ServiceSelector
              selectedServices={selectedServices}
              onAdd={handleAddService}
              onRemove={handleRemoveService}
              onUpdateQty={handleUpdateServiceQty}
            />
          </div>

          {/* Section 5: Spare Parts */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Suku Cadang
                {selectedParts.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black">
                    {selectedParts.length}
                  </span>
                )}
              </h2>
            </div>
            <SparePartSelector
              selectedParts={selectedParts}
              onAdd={handleAddPart}
              onRemove={handleRemovePart}
              onUpdateQty={handleUpdatePartQty}
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/work-orders"
              className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-xs disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Membuat...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Buat Work Order
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Summary Card */}
        <div className="lg:w-72 shrink-0">
          <SummaryCard
            selectedServices={selectedServices}
            selectedParts={selectedParts}
          />
        </div>
      </form>
    </PageContainer>
  );
}
