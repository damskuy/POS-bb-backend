"use client";

import React, { useState, useEffect, useRef } from "react";
import { WorkOrder, WorkOrderServiceInput, WorkOrderPartInput } from "@/types/workOrder";
import { WorkOrderService as WOService } from "@/services/workorder.service";
import { ServiceService } from "@/services/service.service";
import { SparePartService } from "@/services/sparepart.service";
import { Service } from "@/types/service";
import { SparePart } from "@/types/sparePart";
import { useToast } from "@/components/common/Toast";
import { formatRupiah } from "@/utils/format";

interface EditWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  onSuccess: () => void;
}

interface LibraryItem {
  id: number;
  name: string;
  price: number;
  category: "SERVICE" | "PART";
  sku?: string | null;
  stock?: number;
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
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [availableParts, setAvailableParts] = useState<SparePart[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "SERVICE" | "PART">("ALL");

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

      const loadLibrary = async () => {
        setLoadingLibrary(true);
        try {
          const [resServices, resParts] = await Promise.all([
            ServiceService.getServices({ limit: 100, status: "Active" }),
            SparePartService.getSpareParts({ limit: 100 }),
          ]);
          setAvailableServices(resServices.data);
          setAvailableParts(resParts.data);
        } catch (err) {
          console.error("Gagal memuat library item", err);
        } finally {
          setLoadingLibrary(false);
        }
      };
      loadLibrary();
    }
  }, [isOpen, workOrder]);

  if (!isOpen) return null;

  // Add / Remove / Qty updates handlers
  const handleAddService = (item: LibraryItem) => {
    setSelectedServices((prev) => {
      if (prev.some((s) => s.serviceId === item.id)) return prev;
      return [...prev, { serviceId: item.id, price: item.price, quantity: 1 }];
    });
  };

  const handleRemoveService = (serviceId: number) => {
    setSelectedServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  };

  const handleUpdateServiceQty = (serviceId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveService(serviceId);
      return;
    }
    setSelectedServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, quantity: qty } : s))
    );
  };

  const handleAddPart = (item: LibraryItem) => {
    setSelectedParts((prev) => {
      if (prev.some((p) => p.sparePartId === item.id)) return prev;
      return [...prev, { sparePartId: item.id, price: item.price, quantity: 1 }];
    });
  };

  const handleRemovePart = (sparePartId: number) => {
    setSelectedParts((prev) => prev.filter((p) => p.sparePartId !== sparePartId));
  };

  const handleUpdatePartQty = (sparePartId: number, qty: number, stock: number) => {
    if (qty <= 0) {
      handleRemovePart(sparePartId);
      return;
    }
    const maxQty = stock !== undefined ? Math.min(stock, qty) : qty;
    setSelectedParts((prev) =>
      prev.map((p) => (p.sparePartId === sparePartId ? { ...p, quantity: maxQty } : p))
    );
  };

  // Compile Unified Library Items
  const libraryItems: LibraryItem[] = [];
  if (categoryFilter === "ALL" || categoryFilter === "SERVICE") {
    availableServices.forEach((s) => {
      libraryItems.push({
        id: s.id,
        name: s.name,
        price: s.price,
        category: "SERVICE",
      });
    });
  }
  if (categoryFilter === "ALL" || categoryFilter === "PART") {
    availableParts.forEach((p) => {
      libraryItems.push({
        id: p.id,
        name: p.name,
        price: p.price,
        category: "PART",
        sku: p.sku,
        stock: p.stock,
      });
    });
  }

  // Filter Library Items by Search Query
  const filteredLibrary = libraryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  // Selected details compilation for right column rendering
  const getSelectedItemsDetails = () => {
    const list: (LibraryItem & { quantity: number; subtotal: number })[] = [];
    selectedServices.forEach((s) => {
      const match = availableServices.find((as) => as.id === s.serviceId);
      list.push({
        id: s.serviceId,
        name: match ? match.name : "Jasa Servis",
        category: "SERVICE",
        price: s.price,
        quantity: s.quantity,
        subtotal: s.price * s.quantity,
      });
    });
    selectedParts.forEach((p) => {
      const match = availableParts.find((ap) => ap.id === p.sparePartId);
      list.push({
        id: p.sparePartId,
        name: match ? match.name : "Suku Cadang",
        category: "PART",
        price: p.price,
        quantity: p.quantity,
        subtotal: p.price * p.quantity,
        sku: match ? match.sku : null,
        stock: match ? match.stock : 999,
      });
    });
    return list;
  };

  const selectedItemsList = getSelectedItemsDetails();

  // Calculations
  const totalServices = selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const totalParts = selectedParts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalItemsCount = selectedServices.length + selectedParts.length;
  const subtotal = totalServices + totalParts;
  const tax = Math.round(subtotal * 0.11);
  const calculatedGrandTotal = Math.max(
    0,
    subtotal - (workOrder.discount || 0) + (workOrder.tax || 0)
  );

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
    <>
      {/* Backdrop (below TopNavbar top-16, covering left page contents) */}
      <div
        className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-slate-900/35 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Side Workspace Drawer */}
      <div className="fixed top-16 right-0 bottom-0 z-50 w-full md:w-[60vw] lg:w-[50vw] bg-white border-l border-slate-100 shadow-2xl flex flex-col animate-slideInRight overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">Edit Item Pekerjaan</h3>
              <p className="text-slate-500 font-mono text-[10px] mt-0.5">{workOrder.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Workspace Dual Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Item Library */}
          <div className="w-1/2 border-r border-slate-100 flex flex-col overflow-hidden p-5 space-y-4">
            {/* Search Input */}
            <div className="relative shrink-0">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari jasa atau suku cadang..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all shadow-3xs"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 shrink-0 select-none">
              {(
                [
                  { id: "ALL", label: "Semua" },
                  { id: "SERVICE", label: "Jasa" },
                  { id: "PART", label: "Part" },
                ] as const
              ).map((chip) => {
                const isActive = categoryFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setCategoryFilter(chip.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white shadow-3xs"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Library List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar-light">
              {loadingLibrary ? (
                <div className="p-10 text-center">
                  <div className="animate-spin w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400 italic">Tidak ada item ditemukan.</div>
              ) : (
                filteredLibrary.map((item) => {
                  const isService = item.category === "SERVICE";
                  const match = isService
                    ? selectedServices.find((s) => s.serviceId === item.id)
                    : selectedParts.find((p) => p.sparePartId === item.id);
                  const selected = Boolean(match);
                  const selectedQty = match ? match.quantity : 0;

                  return (
                    <div
                      key={`${item.category}-${item.id}`}
                      className={`p-3 border rounded-xl flex items-center justify-between gap-3 transition-colors ${
                        selected ? "bg-slate-50/50 border-slate-950/20" : "bg-white border-slate-100 hover:bg-slate-50/30"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-wide shrink-0 ${
                            isService ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-orange-50 border-orange-200/50 text-orange-700"
                          }`}>
                            {item.category}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate block">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                          <span className="font-mono font-bold text-slate-700">{formatRupiah(item.price)}</span>
                          {!isService && item.stock !== undefined && (
                            <>
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span>Stok: {item.stock}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Lightweight Action or Stepper */}
                      <div className="shrink-0">
                        {selected ? (
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-3xs">
                            <button
                              type="button"
                              onClick={() => {
                                if (isService) {
                                  handleUpdateServiceQty(item.id, selectedQty - 1);
                                } else {
                                  handleUpdatePartQty(item.id, selectedQty - 1, item.stock ?? 999);
                                }
                              }}
                              className="w-5 h-5 flex items-center justify-center hover:bg-slate-50 text-slate-500 rounded text-xs font-bold transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 text-[10px] font-bold text-slate-800 font-mono min-w-[12px] text-center">
                              {selectedQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (isService) {
                                  handleUpdateServiceQty(item.id, selectedQty + 1);
                                } else {
                                  handleUpdatePartQty(item.id, selectedQty + 1, item.stock ?? 999);
                                }
                              }}
                              className="w-5 h-5 flex items-center justify-center hover:bg-slate-50 text-slate-500 rounded text-xs font-bold transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (isService) {
                                handleAddService(item);
                              } else {
                                handleAddPart(item);
                              }
                            }}
                            className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Selected Items live composer */}
          <div className="w-1/2 flex flex-col overflow-hidden bg-slate-50/20">
            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 pr-4 custom-scrollbar-light">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Item Terpilih</h4>
              {selectedItemsList.length === 0 ? (
                <div className="h-44 border border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-xs text-slate-400 italic">Belum ada item terpilih.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Pilih item dari katalog di sebelah kiri.</p>
                </div>
              ) : (
                selectedItemsList.map((item) => {
                  const isService = item.category === "SERVICE";
                  return (
                    <div
                      key={`selected-${item.category}-${item.id}`}
                      className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 shadow-3xs animate-fadeIn"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                          <span className={`inline-flex px-1 py-0.5 rounded text-[8px] font-black border uppercase tracking-wide shrink-0 ${
                            isService ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-orange-50 border-orange-200/50 text-orange-700"
                          }`}>
                            {item.category}
                          </span>
                          <span className="font-mono">{formatRupiah(item.price)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Qty Stepper */}
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isService) {
                                handleUpdateServiceQty(item.id, item.quantity - 1);
                              } else {
                                handleUpdatePartQty(item.id, item.quantity - 1, item.stock ?? 999);
                              }
                            }}
                            className="w-5 h-5 flex items-center justify-center hover:bg-white hover:shadow-2xs text-slate-500 rounded text-xs font-bold transition-all cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 text-[10px] font-bold text-slate-800 font-mono min-w-[12px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isService) {
                                handleUpdateServiceQty(item.id, item.quantity + 1);
                              } else {
                                handleUpdatePartQty(item.id, item.quantity + 1, item.stock ?? 999);
                              }
                            }}
                            className="w-5 h-5 flex items-center justify-center hover:bg-white hover:shadow-2xs text-slate-500 rounded text-xs font-bold transition-all cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isService) {
                              handleRemoveService(item.id);
                            } else {
                              handleRemovePart(item.id);
                            }
                          }}
                          className="w-7 h-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center cursor-pointer shrink-0"
                          title="Hapus"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Summary Panel */}
            <div className="shrink-0 p-5 border-t border-slate-100 bg-white space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ringkasan Biaya Baru</h4>
              
              <div className="space-y-2 text-[11px] text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Estimasi Jasa ({selectedServices.length})</span>
                  <span className="font-mono text-slate-700 font-medium">{formatRupiah(totalServices)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Estimasi Part ({selectedParts.length})</span>
                  <span className="font-mono text-slate-700 font-medium">{formatRupiah(totalParts)}</span>
                </div>
                {workOrder.discount > 0 && (
                  <div className="flex justify-between items-center text-rose-600">
                    <span>Diskon Terpasang</span>
                    <span className="font-mono font-medium">-{formatRupiah(workOrder.discount)}</span>
                  </div>
                )}
                {workOrder.tax > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Pajak (11%)</span>
                    <span className="font-mono font-medium">+{formatRupiah(workOrder.tax)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Grand Total Baru</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">{totalItemsCount} item terpilih</p>
                </div>
                <p className="font-mono text-base font-black text-slate-900">{formatRupiah(calculatedGrandTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <form onSubmit={handleSubmit} className="shrink-0 px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 items-center">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting && (
              <div className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
            )}
            <span>{submitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </form>
      </div>
    </>
  );
};
