"use client";

import React, { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { PageContainer, PageHeader, SortByDate } from "@/components/common";
import { CustomerPagination } from "@/features/customers";
import {
  VehicleTable,
  VehicleSearch,
  CustomerFilter,
  VehicleModal,
  DeleteVehicleDialog,
} from "@/features/vehicles";
import { Vehicle, VehicleInput } from "@/types/vehicle";

export default function VehiclesPage() {
  const {
    vehicles,
    loading,
    isFetching,
    search,
    setSearch,
    selectedCustomerId,
    setSelectedCustomerId,
    order,
    setOrder,
    page,
    setPage,
    limit,
    total,
    addVehicle,
    editVehicle,
    removeVehicle,
  } = useVehicles();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Handlers
  const handleOpenAddModal = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleOpenDeleteDialog = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const handleModalSubmit = async (input: VehicleInput): Promise<boolean> => {
    if (selectedVehicle) {
      return await editVehicle(selectedVehicle.id, input);
    } else {
      return await addVehicle(input);
    }
  };

  const handleDeleteConfirm = async (id: number): Promise<boolean> => {
    return await removeVehicle(id);
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Daftar Kendaraan"
        subtitle="Kelola registrasi kendaraan pelanggan, plat nomor, spesifikasi merk & model."
        action={
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Kendaraan</span>
          </button>
        }
      />

      {/* Unified Seamless Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          <VehicleSearch value={search} onChange={setSearch} />
          <CustomerFilter
            selectedCustomerId={selectedCustomerId}
            onChange={setSelectedCustomerId}
          />
          <SortByDate order={order} onChange={setOrder} />
        </div>
        <div className="text-xs text-slate-400 font-semibold px-2 self-end md:self-auto shrink-0 select-none">
          Total: <strong className="text-slate-700 font-tabular font-bold">{total}</strong> Kendaraan
        </div>
      </div>

      {/* Table Card Container with Pagination */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.04)] overflow-hidden">
        <VehicleTable
          vehicles={vehicles}
          loading={loading}
          isFetching={isFetching}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteDialog}
          onAddClick={handleOpenAddModal}
        />
        <CustomerPagination
          page={page}
          limit={limit}
          total={total}
          unitName="kendaraan"
          onPageChange={setPage}
        />
      </div>

      {/* Add / Edit Vehicle Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={selectedVehicle}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Vehicle Confirmation Dialog */}
      <DeleteVehicleDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        vehicle={vehicleToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </PageContainer>
  );
}
