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
        badge="Master Data"
        action={
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Kendaraan</span>
          </button>
        }
      />

      {/* Toolbar: Search & Sort by Date */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <VehicleSearch value={search} onChange={setSearch} />
          <SortByDate order={order} onChange={setOrder} />
        </div>
        <div className="text-xs text-slate-500 font-medium self-end sm:self-auto shrink-0">
          Total: <strong className="text-slate-900">{total}</strong> Kendaraan
        </div>
      </div>

      {/* Vehicle Table & Loading Skeleton */}
      <VehicleTable
        vehicles={vehicles}
        loading={loading}
        isFetching={isFetching}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteDialog}
        onAddClick={handleOpenAddModal}
      />

      {/* Pagination */}
      <CustomerPagination
        page={page}
        limit={limit}
        total={total}
        unitName="kendaraan"
        onPageChange={setPage}
      />

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
