"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/common";
import { CreateCustomerModal } from "@/features/work-orders/form/CreateCustomerModal";
import { CreateVehicleModal } from "@/features/work-orders/form/CreateVehicleModal";
import { Customer } from "@/types/customer";
import { Vehicle } from "@/types/vehicle";
import { Mechanic } from "@/types/mechanic";
import { Service } from "@/types/service";
import { SparePart } from "@/types/sparePart";
import {
  WorkOrderServiceInput,
  WorkOrderPartInput,
  WorkOrderInput,
} from "@/types/workOrder";
import { CustomerService } from "@/services/customer.service";
import { VehicleService } from "@/services/vehicle.service";
import { ServiceService } from "@/services/service.service";
import { SparePartService } from "@/services/sparepart.service";
import { MechanicService } from "@/services/mechanic.service";
import { WorkOrderService as BackendWorkOrderService } from "@/services/workorder.service";
import { useToast } from "@/components/common/Toast";
import { formatRupiah } from "@/utils/format";
import Link from "next/link";

const STEPS = [
  { id: 1, name: "Customer", desc: "Pilih Pelanggan" },
  { id: 2, name: "Vehicle", desc: "Pilih Kendaraan" },
  { id: 3, name: "Complaint", desc: "Detail Keluhan" },
  { id: 4, name: "Services", desc: "Jasa Servis" },
  { id: 5, name: "Spare Parts", desc: "Suku Cadang" },
  { id: 6, name: "Review", desc: "Ulasan WO" },
];

export default function NewWorkOrderPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeStep, setActiveStep] = useState(1);

  // Core Form States
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [complaint, setComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [odometer, setOdometer] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "EMERGENCY">("NORMAL");
  const [selectedServices, setSelectedServices] = useState<WorkOrderServiceInput[]>([]);
  const [selectedParts, setSelectedParts] = useState<WorkOrderPartInput[]>([]);

  // DB Metadata Cache for visual rendering inside Summary
  const [cachedServices, setCachedServices] = useState<Record<number, Service>>({});
  const [cachedParts, setCachedParts] = useState<Record<number, SparePart>>({});

  // Operational States
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Customer States
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);

  // Step 2: Vehicle States
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);

  // Step 3: Mechanic List States
  const [mechanicList, setMechanicList] = useState<Mechanic[]>([]);
  const [loadingMechanics, setLoadingMechanics] = useState(false);
  const [isMechanicDropdownOpen, setIsMechanicDropdownOpen] = useState(false);
  const mechanicDropdownRef = useRef<HTMLDivElement>(null);

  // Step 4: Services Query States
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Step 5: Spare Parts Query States
  const [partQuery, setPartQuery] = useState("");
  const [partList, setPartList] = useState<SparePart[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);

  // ── STEP 1: Fetch Customers ──
  useEffect(() => {
    if (activeStep !== 1 || customer) return;
    const timer = setTimeout(async () => {
      setLoadingCustomers(true);
      try {
        const { data } = await CustomerService.getCustomers({ search: customerQuery, limit: 10 });
        setCustomerList(data);
      } catch {
        setCustomerList([]);
      } finally {
        setLoadingCustomers(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerQuery, activeStep, customer]);

  // ── STEP 2: Fetch Customer's Vehicles ──
  const fetchCustomerVehicles = useCallback(async () => {
    if (!customer) return;
    setLoadingVehicles(true);
    try {
      const { data } = await VehicleService.getVehicles({ customerId: customer.id, limit: 100 });
      setCustomerVehicles(data);
    } catch {
      setCustomerVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }, [customer]);

  useEffect(() => {
    if (activeStep === 2 && customer) {
      fetchCustomerVehicles();
    }
  }, [activeStep, customer, fetchCustomerVehicles]);

  // ── STEP 3: Fetch Mechanics ──
  useEffect(() => {
    if (activeStep === 3) {
      setLoadingMechanics(true);
      MechanicService.getMechanics({ limit: 100 })
        .then(({ data }) => setMechanicList(data))
        .catch(() => setMechanicList([]))
        .finally(() => setLoadingMechanics(false));
    }
  }, [activeStep]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (mechanicDropdownRef.current && !mechanicDropdownRef.current.contains(e.target as Node)) {
        setIsMechanicDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── STEP 4: Fetch Services ──
  useEffect(() => {
    if (activeStep !== 4) return;
    const timer = setTimeout(async () => {
      setLoadingServices(true);
      try {
        const { data } = await ServiceService.getServices({ search: serviceQuery, limit: 20, status: "Active" });
        setServiceList(data);
        // Cache services details for summary name retrieval
        const newCache = { ...cachedServices };
        data.forEach((s) => {
          newCache[s.id] = s;
        });
        setCachedServices(newCache);
      } catch {
        setServiceList([]);
      } finally {
        setLoadingServices(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [serviceQuery, activeStep]);

  // ── STEP 5: Fetch Spare Parts ──
  useEffect(() => {
    if (activeStep !== 5) return;
    const timer = setTimeout(async () => {
      setLoadingParts(true);
      try {
        const { data } = await SparePartService.getSpareParts({ search: partQuery, limit: 20 });
        setPartList(data);
        // Cache parts details for summary name retrieval
        const newCache = { ...cachedParts };
        data.forEach((p) => {
          newCache[p.id] = p;
        });
        setCachedParts(newCache);
      } catch {
        setPartList([]);
      } finally {
        setLoadingParts(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [partQuery, activeStep]);

  // ── Hybrid Flow Modal Handlers ──
  const handleCustomerCreated = useCallback((newCustomer: Customer) => {
    setCustomer(newCustomer);
    setVehicle(null);
    setShowCreateCustomer(false);
    showToast("Customer berhasil dibuat.", "success");
    setActiveStep(2); // Auto-advance to vehicle selection
  }, [showToast]);

  const handleVehicleCreated = useCallback((newVehicle: Vehicle) => {
    setVehicle(newVehicle);
    setShowCreateVehicle(false);
    showToast("Kendaraan berhasil dibuat.", "success");
    fetchCustomerVehicles();
    setActiveStep(3); // Auto-advance to details
  }, [showToast, fetchCustomerVehicles]);

  // ── Service Add/Remove Actions ──
  const handleAddService = (item: Service) => {
    setSelectedServices((prev) => {
      if (prev.some((s) => s.serviceId === item.id)) return prev;
      return [...prev, { serviceId: item.id, price: item.price, quantity: 1 }];
    });
  };

  const handleRemoveService = (serviceId: number) => {
    setSelectedServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  };

  // ── Spare Part Add/Remove/Qty Actions ──
  const handleAddPart = (item: SparePart) => {
    setSelectedParts((prev) => {
      if (prev.some((p) => p.sparePartId === item.id)) return prev;
      return [...prev, { sparePartId: item.id, price: item.price, quantity: 1 }];
    });
  };

  const handleRemovePart = (sparePartId: number) => {
    setSelectedParts((prev) => prev.filter((p) => p.sparePartId !== sparePartId));
  };

  const handleUpdatePartQty = (sparePartId: number, qty: number, stock: number) => {
    const validQty = Math.min(stock, Math.max(1, qty));
    setSelectedParts((prev) =>
      prev.map((p) => (p.sparePartId === sparePartId ? { ...p, quantity: validQty } : p))
    );
  };

  // ── Navigation & Steps ──
  const handleNextStep = () => {
    const newErrors: Record<string, string> = {};
    if (activeStep === 1 && !customer) {
      newErrors.customer = "Silakan pilih pelanggan terlebih dahulu.";
      setErrors(newErrors);
      return;
    }
    if (activeStep === 2 && !vehicle) {
      newErrors.vehicle = "Silakan pilih kendaraan terlebih dahulu.";
      setErrors(newErrors);
      return;
    }
    if (activeStep === 4 && selectedServices.length === 0) {
      newErrors.services = "Harap pilih minimal 1 jasa servis sebelum melanjutkan ke Suku Cadang.";
      setErrors(newErrors);
      return;
    }
    if (activeStep === 5 && selectedParts.length === 0) {
      newErrors.parts = "Harap pilih minimal 1 suku cadang sebelum melanjutkan ke Review.";
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setActiveStep((prev) => Math.min(STEPS.length, prev + 1));
  };

  const handlePrevStep = () => {
    setErrors({});
    setActiveStep((prev) => Math.max(1, prev - 1));
  };

  const handleStepClick = (stepId: number) => {
    // Basic progression validation
    if (stepId > 1 && !customer) return;
    if (stepId > 2 && !vehicle) return;
    if (stepId > 4 && selectedServices.length === 0) return;
    if (stepId > 5 && selectedParts.length === 0) return;
    setErrors({});
    setActiveStep(stepId);
  };

  // ── Submit Handling ──
  const handleSubmit = async () => {
    if (!customer || !vehicle) {
      showToast("Pelanggan & Kendaraan wajib dipilih.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const finalComplaint = complaint || "";

      const input: WorkOrderInput = {
        customerId: customer.id,
        vehicleId: vehicle.id,
        mechanicId: mechanic?.id ?? null,
        complaint: finalComplaint,
        notes: notes || null,
        odometer: odometer ? parseInt(odometer, 10) : null,
        services: selectedServices,
        parts: selectedParts,
      };

      const created = await BackendWorkOrderService.createWorkOrder(input);
      showToast(`Work Order ${created.code} berhasil dibuat!`, "success");
      router.push(`/work-orders/${created.id}`);
    } catch (err: any) {
      showToast(err.message || "Gagal membuat work order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Calculation helper for real-time estimated totals ──
  const totalService = selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const totalPart = selectedParts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const subtotal = totalService + totalPart;
  const tax = Math.round(subtotal * 0.11);
  const grandTotal = subtotal + tax;

  return (
    <PageContainer>
      {/* Upper Title and Return link */}
      <div className="flex items-center gap-4 border-b border-slate-200/60 pb-5 mb-8">
        <Link
          href="/work-orders"
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors shadow-2xs cursor-pointer"
          title="Kembali ke Daftar Work Order"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">Buat Work Order Baru</h1>
          <p className="text-sm text-slate-500 mt-0.5">Lengkapi formulir terstruktur di bawah dengan sistem wizard langkah demi langkah.</p>
        </div>
      </div>

      {/* Horizontal Wizard Stepper Progress */}
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {STEPS.map((step, index) => {
            const isActive = activeStep === step.id;
            const isCompleted = activeStep > step.id;
            const canClick =
              step.id === 1 ||
              (step.id === 2 && customer) ||
              (step.id === 3 && customer && vehicle) ||
              (step.id === 4 && customer && vehicle) ||
              (step.id === 5 && customer && vehicle && selectedServices.length > 0) ||
              (step.id === 6 && customer && vehicle && selectedServices.length > 0 && selectedParts.length > 0);

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => canClick && handleStepClick(step.id)}
                  disabled={!canClick}
                  className={`flex items-center gap-3 text-left focus:outline-none transition-all group shrink-0 ${
                    canClick ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                        : isCompleted
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-400 group-hover:border-slate-300"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-extrabold leading-none ${
                        isActive ? "text-slate-900" : isCompleted ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      {step.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">{step.desc}</p>
                  </div>
                </button>
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block flex-1 h-px bg-slate-100 mx-4" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Split: Form (70%) & Live Summary (30%) */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        
        {/* Left Column (70%) */}
        <div className="flex-1 w-full min-w-0">
          
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-[0px_8px_20px_-6px_rgba(15,23,42,0.03)] min-h-[420px] flex flex-col justify-between">
            
            {/* Step Contents Container */}
            <div className="flex-1">
              
              {/* STEP 1: CUSTOMER SELECTION */}
              {activeStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Pilih Pelanggan</h2>
                    <p className="text-xs text-slate-500 mt-1">Cari data pelanggan terdaftar atau buat profil baru.</p>
                  </div>

                  {customer ? (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-sm uppercase">
                          {customer.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-base">{customer.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{customer.phone}</p>
                          {customer.address && (
                            <p className="text-[11px] text-slate-400 mt-1">{customer.address}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCustomer(null);
                          setVehicle(null);
                        }}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-white text-slate-700 text-xs font-bold rounded-xl transition-all shadow-3xs hover:border-slate-300 cursor-pointer"
                      >
                        Ganti Pelanggan
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={customerQuery}
                            onChange={(e) => setCustomerQuery(e.target.value)}
                            placeholder="Ketik nama pelanggan atau nomor handphone..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-200 transition-all shadow-3xs"
                          />
                          <svg
                            className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreateCustomer(true)}
                          className="px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          Tambah Pelanggan Baru
                        </button>
                      </div>

                      {loadingCustomers ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-14 bg-slate-50 animate-pulse rounded-xl" />
                          ))}
                        </div>
                      ) : customerList.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                          <p className="text-xs text-slate-400 font-semibold">Pelanggan tidak ditemukan</p>
                          <button
                            onClick={() => setShowCreateCustomer(true)}
                            className="mt-3 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Buat Customer Baru
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1.5 custom-scrollbar-light">
                          {customerList.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setCustomer(c);
                                setVehicle(null);
                                setErrors({});
                                // Auto advance
                                setTimeout(() => setActiveStep(2), 200);
                              }}
                              className="border border-slate-200/80 hover:border-slate-900 rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer bg-white hover:bg-slate-50/40 transition-all group"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs truncate group-hover:text-slate-900">
                                  {c.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.phone}</p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-900 shrink-0">
                                Pilih
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {errors.customer && (
                    <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                      ⚠️ {errors.customer}
                    </p>
                  )}
                </div>
              )}

              {/* STEP 2: VEHICLE SELECTION */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Pilih Kendaraan</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Pilih kendaraan milik <span className="font-extrabold text-slate-800">{customer?.name}</span> untuk dikerjakan.
                    </p>
                  </div>

                  {loadingVehicles ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-28 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
                      ))}
                    </div>
                  ) : customerVehicles.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <p className="text-xs text-slate-400 font-semibold">Pelanggan belum memiliki kendaraan terdaftar.</p>
                      <button
                        onClick={() => setShowCreateVehicle(true)}
                        className="mt-3 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Kendaraan
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customerVehicles.map((v) => {
                        const isSelected = vehicle?.id === v.id;
                        return (
                          <div
                            key={v.id}
                            onClick={() => {
                              setVehicle(v);
                              setErrors({});
                              // Auto advance
                              setTimeout(() => setActiveStep(3), 200);
                            }}
                            className={`border rounded-2xl p-4 flex flex-col justify-between h-32 transition-all cursor-pointer bg-white shadow-3xs ${
                              isSelected
                                ? "border-slate-900 ring-1 ring-slate-900"
                                : "border-slate-200/80 hover:border-slate-400 hover:bg-slate-50/30"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-extrabold text-slate-900 text-sm">{v.brand} {v.model}</p>
                                <p className="text-[10px] text-slate-400 font-semibold mt-1">Tahun: {v.year || "-"}</p>
                              </div>
                              <span className="font-mono text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200/60 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {v.plateNumber}
                              </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                              <span className="text-[10px] font-bold text-slate-500">Transmisi: {v.transmission === "AUTOMATIC" ? "Matik" : "Manual"}</span>
                              <span className={`text-[10px] font-extrabold ${isSelected ? "text-slate-900" : "text-slate-400"}`}>
                                {isSelected ? "✓ Terpilih" : "Pilih"}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add new vehicle card block */}
                      <div
                        onClick={() => setShowCreateVehicle(true)}
                        className="border border-dashed border-slate-200/80 hover:border-slate-400 rounded-2xl p-4 flex flex-col items-center justify-center h-32 cursor-pointer bg-slate-50/20 hover:bg-slate-50/50 transition-all text-slate-500"
                      >
                        <svg className="w-6 h-6 mb-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="text-xs font-bold">Tambah Kendaraan Baru</p>
                      </div>
                    </div>
                  )}

                  {errors.vehicle && (
                    <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                      ⚠️ {errors.vehicle}
                    </p>
                  )}
                </div>
              )}

              {/* STEP 3: COMPLAINT, PRIORITY & MECHANIC */}
              {activeStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Detail Keluhan & Pekerjaan</h2>
                    <p className="text-xs text-slate-500 mt-1">Masukkan odometer kendaraan, keluhan, dan tunjuk mekanik yang bertugas.</p>
                  </div>

                  <div>
                    {/* Odometer */}
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Odometer Saat Ini (km)</label>
                    <input
                      type="number"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      placeholder="Contoh: 45000"
                      min={0}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-200 transition-all shadow-3xs"
                    />
                  </div>

                  {/* Mechanic dropdown */}
                  <div className="relative" ref={mechanicDropdownRef}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mekanik yang Menangani (Opsional)</label>
                    <button
                      type="button"
                      onClick={() => setIsMechanicDropdownOpen(!isMechanicDropdownOpen)}
                      disabled={loadingMechanics}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800 transition-all shadow-3xs hover:border-slate-200 cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {mechanic ? `${mechanic.name} ${mechanic.skills ? `· ${mechanic.skills}` : ""}` : "-- Pilih Mekanik --"}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          isMechanicDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isMechanicDropdownOpen && (
                      <div className="absolute left-0 right-0 z-40 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg py-1 max-h-48 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setMechanic(null);
                            setIsMechanicDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            !mechanic ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
                          }`}
                        >
                          <span>Tanpa Mekanik</span>
                          {!mechanic && <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />}
                        </button>
                        {mechanicList.map((m) => {
                          const isSelected = mechanic?.id === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setMechanic(m);
                                setIsMechanicDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                                isSelected ? "text-slate-900 bg-slate-50/50 font-bold" : "text-slate-600"
                              }`}
                            >
                              <span>{m.name} {m.skills ? `(${m.skills})` : ""}</span>
                              {isSelected && <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Complaint input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Keluhan Utama</label>
                    <textarea
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      rows={3}
                      placeholder="Tulis keluhan detail kendaraan di sini..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-200 transition-all resize-none shadow-3xs"
                    />
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Internal Bengkel</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Tulis catatan tambahan untuk teknisi mekanik..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-200 transition-all resize-none shadow-3xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: SERVICES GRID */}
              {activeStep === 4 && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Pilih Jasa Servis</h2>
                      <p className="text-xs text-slate-500 mt-1">Pilih satu atau lebih pekerjaan jasa servis kendaraan.</p>
                    </div>

                    {/* Simple search bar */}
                    <div className="relative min-w-[200px]">
                      <input
                        type="text"
                        value={serviceQuery}
                        onChange={(e) => setServiceQuery(e.target.value)}
                        placeholder="Cari jasa..."
                        className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none shadow-3xs"
                      />
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {loadingServices ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
                      ))}
                    </div>
                  ) : serviceList.length === 0 ? (
                    <div className="text-center py-10 border border-slate-100 rounded-2xl bg-slate-50/50">
                      <p className="text-xs text-slate-400 font-semibold">Layanan tidak ditemukan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1.5 custom-scrollbar-light">
                      {serviceList.map((s) => {
                        const isAdded = selectedServices.some((item) => item.serviceId === s.id);
                        return (
                          <div
                            key={s.id}
                            className={`border rounded-2xl p-4 flex flex-col justify-between h-32 transition-all ${
                              isAdded
                                ? "border-slate-900 bg-slate-50/20"
                                : "border-slate-200/80 hover:border-slate-400"
                            }`}
                          >
                            <div>
                              <p className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">{s.name}</p>
                              <span className="text-[10px] text-slate-400 font-medium block mt-1">{s.category || "General"}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                              <span className="font-mono text-xs font-extrabold text-slate-800">{formatRupiah(s.price)}</span>
                              {isAdded ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveService(s.id)}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  ✓ Added
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddService(s)}
                                  className="px-2.5 py-1.5 border border-slate-200 hover:border-slate-900 text-slate-700 hover:text-slate-900 text-[10px] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all bg-white"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {errors.services && (
                    <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 mt-4">
                      ⚠️ {errors.services}
                    </p>
                  )}
                </div>
              )}

              {/* STEP 5: SPARE PARTS GRID */}
              {activeStep === 5 && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Pilih Suku Cadang</h2>
                      <p className="text-xs text-slate-500 mt-1">Pilih suku cadang inventaris yang digunakan untuk pengerjaan.</p>
                    </div>

                    {/* Simple search bar */}
                    <div className="relative min-w-[200px]">
                      <input
                        type="text"
                        value={partQuery}
                        onChange={(e) => setPartQuery(e.target.value)}
                        placeholder="Cari sparepart..."
                        className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none shadow-3xs"
                      />
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {loadingParts ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
                      ))}
                    </div>
                  ) : partList.length === 0 ? (
                    <div className="text-center py-10 border border-slate-100 rounded-2xl bg-slate-50/50">
                      <p className="text-xs text-slate-400 font-semibold">Suku cadang tidak ditemukan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1.5 custom-scrollbar-light">
                      {partList.map((p) => {
                        const isAdded = selectedParts.some((item) => item.sparePartId === p.id);
                        const selectedItem = selectedParts.find((item) => item.sparePartId === p.id);
                        const currentQty = selectedItem?.quantity || 0;

                        return (
                          <div
                            key={p.id}
                            className={`border rounded-2xl p-4 flex flex-col justify-between h-36 transition-all ${
                              isAdded
                                ? "border-slate-900 bg-slate-50/20"
                                : "border-slate-200/80 hover:border-slate-400"
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <p className="font-bold text-slate-900 text-xs line-clamp-1 leading-snug">{p.name}</p>
                                <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-55 border border-slate-100 rounded px-1 shrink-0 uppercase">{p.sku || "-"}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium block mt-1">Stok: {p.stock} Unit</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                              <span className="font-mono text-xs font-extrabold text-slate-800">{formatRupiah(p.price)}</span>
                              {isAdded ? (
                                <div className="flex items-center gap-1.5">
                                  {/* Stepper */}
                                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                                    <button
                                      type="button"
                                      onClick={() => currentQty > 1 ? handleUpdatePartQty(p.id, currentQty - 1, p.stock) : handleRemovePart(p.id)}
                                      className="px-2 py-1 hover:bg-slate-100 text-slate-600 text-xs font-extrabold transition-all cursor-pointer select-none"
                                    >
                                      -
                                    </button>
                                    <span className="px-2 text-xs font-extrabold font-mono text-slate-955 min-w-[20px] text-center">
                                      {currentQty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePartQty(p.id, currentQty + 1, p.stock)}
                                      disabled={currentQty >= p.stock}
                                      className="px-2 py-1 hover:bg-slate-100 text-slate-600 text-xs font-extrabold transition-all disabled:opacity-30 cursor-pointer select-none"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddPart(p)}
                                  disabled={p.stock <= 0}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {errors.parts && (
                    <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 mt-4">
                      ⚠️ {errors.parts}
                    </p>
                  )}
                </div>
              )}

              {/* STEP 6: REVIEW & SUBMIT */}
              {activeStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 font-sans">Review Work Order</h2>
                    <p className="text-xs text-slate-500 mt-1">Ulas seluruh ringkasan detail pekerjaan sebelum membuat surat perintah kerja.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer & Vehicle Info */}
                    <div className="border border-slate-200/80 rounded-2xl p-4 space-y-4">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pelanggan</h4>
                        <div className="mt-1.5">
                          <p className="font-extrabold text-slate-800 text-sm">{customer?.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{customer?.phone}</p>
                          {customer?.address && <p className="text-xs text-slate-400 mt-1">{customer.address}</p>}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kendaraan</h4>
                        <div className="mt-1.5">
                          <p className="font-bold text-slate-800 text-sm">{vehicle?.brand} {vehicle?.model}</p>
                          <p className="text-[10px] font-mono font-extrabold bg-slate-100 text-slate-800 border border-slate-200/60 inline-block px-1.5 py-0.5 rounded mt-1.5 uppercase">
                            {vehicle?.plateNumber}
                          </p>
                          <div className="flex gap-4 text-xs text-slate-400 mt-2">
                            <span>Transmisi: {vehicle?.transmission === "AUTOMATIC" ? "Matik" : "Manual"}</span>
                            {vehicle?.year && <span>Tahun: {vehicle.year}</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="border border-slate-200/80 rounded-2xl p-4 space-y-4">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detail Pekerjaan</h4>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Odometer:</span>
                            <span className="font-bold text-slate-800">{odometer ? `${Number(odometer).toLocaleString()} km` : "-"}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Mekanik:</span>
                            <span className="font-bold text-slate-800">{mechanic?.name || "Belum ditentukan"}</span>
                          </div>

                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Keluhan</h4>
                        <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap leading-relaxed">{complaint || "-"}</p>
                      </div>

                      {notes && (
                        <div className="border-t border-slate-100 pt-3">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catatan</h4>
                          <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap leading-relaxed">{notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Stepper Footer Controls */}
            <div className="border-t border-slate-100 pt-5 mt-6 flex items-center justify-between">
              <div>
                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-3xs cursor-pointer hover:border-slate-300"
                  >
                    Kembali
                  </button>
                )}
              </div>
              <div>
                {activeStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Lanjutkan</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
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
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column (30%) ── Sticky Summary Panel */}
        <div className="w-full lg:w-80 shrink-0 sticky top-6">
          <div className="bg-slate-900 border border-slate-950 rounded-[20px] p-5 text-white shadow-xl flex flex-col justify-between min-h-[480px]">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs tracking-wide uppercase">Ringkasan WO</h3>
                    <p className="text-[9px] text-slate-400 font-bold tracking-wider mt-0.5">ESTIMASI PREVIEW</p>
                  </div>
                </div>

              </div>

              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1.5 custom-scrollbar">
                {/* Customer Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pelanggan</h4>
                  {customer ? (
                    <p className="text-xs font-bold text-slate-100 mt-1">{customer.name}</p>
                  ) : (
                    <p className="text-xs text-slate-600 italic mt-1">Belum dipilih</p>
                  )}
                </div>

                {/* Vehicle Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kendaraan</h4>
                  {vehicle ? (
                    <div className="mt-1">
                      <p className="text-xs font-bold text-slate-100">{vehicle.brand} {vehicle.model}</p>
                      <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider mt-0.5">{vehicle.plateNumber}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic mt-1">Belum dipilih</p>
                  )}
                </div>

                {/* Complaint Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detail Pekerjaan</h4>
                  <div className="mt-1 space-y-1">
                    {mechanic && (
                      <p className="text-xs text-slate-100 leading-snug">
                        <span className="text-slate-400">Mekanik:</span> {mechanic.name}
                      </p>
                    )}
                    {complaint && (
                      <p className="text-xs text-slate-300 italic line-clamp-2 leading-relaxed mt-1">
                        &quot;{complaint}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Services Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jasa Servis ({selectedServices.length})</h4>
                  {selectedServices.length > 0 ? (
                    <ul className="mt-1 space-y-1 text-xs">
                      {selectedServices.map((s) => {
                        const name = cachedServices[s.serviceId]?.name || `Jasa #${s.serviceId}`;
                        return (
                          <li key={s.serviceId} className="flex justify-between items-center text-slate-300 py-0.5">
                            <span className="truncate max-w-[160px]">✓ {name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{formatRupiah(s.price)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-600 italic mt-1">Belum ada jasa dipilih</p>
                  )}
                </div>

                {/* Spare Parts Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suku Cadang ({selectedParts.length})</h4>
                  {selectedParts.length > 0 ? (
                    <ul className="mt-1 space-y-1 text-xs">
                      {selectedParts.map((p) => {
                        const name = cachedParts[p.sparePartId]?.name || `Part #${p.sparePartId}`;
                        return (
                          <li key={p.sparePartId} className="flex justify-between items-center text-slate-300 py-0.5">
                            <span className="truncate max-w-[140px] pr-1">✓ {name} <span className="text-[9px] text-slate-500 font-bold font-mono">x{p.quantity}</span></span>
                            <span className="font-mono text-[10px] text-slate-400">{formatRupiah(p.price * p.quantity)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-600 italic mt-1">Belum ada sparepart dipilih</p>
                  )}
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-white/10 pt-4 mt-6">
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal Jasa</span>
                  <span className="font-mono text-slate-200">{formatRupiah(totalService)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal Sparepart</span>
                  <span className="font-mono text-slate-200">{formatRupiah(totalPart)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak (11%)</span>
                  <span className="font-mono text-slate-200">{formatRupiah(tax)}</span>
                </div>
              </div>
              <div className="border-t border-dashed border-white/10 my-3" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Estimasi Total</span>
                <span className="font-mono text-base font-black text-emerald-400">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Hybrid Flow Modals */}
      <CreateCustomerModal
        isOpen={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        onSuccess={handleCustomerCreated}
      />

      {customer && (
        <CreateVehicleModal
          isOpen={showCreateVehicle}
          onClose={() => setShowCreateVehicle(false)}
          customerId={customer.id}
          customerName={customer.name}
          onSuccess={handleVehicleCreated}
        />
      )}
    </PageContainer>
  );
}
