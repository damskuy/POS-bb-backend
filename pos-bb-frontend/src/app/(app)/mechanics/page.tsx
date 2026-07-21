"use client";

import React, { useState } from "react";
import { useMechanics } from "@/hooks/useMechanics";
import { PageContainer, PageHeader, SortByDate } from "@/components/common";
import { CustomerPagination } from "@/features/customers";
import {
  MechanicTable,
  MechanicSearch,
  MechanicModal,
  DeleteMechanicDialog,
} from "@/features/mechanics";
import { Mechanic, MechanicInput } from "@/types/mechanic";

export default function MechanicsPage() {
  const {
    mechanics,
    loading,
    isFetching,
    search,
    setSearch,
    order,
    setOrder,
    page,
    setPage,
    limit,
    total,
    addMechanic,
    editMechanic,
    removeMechanic,
  } = useMechanics();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [mechanicToDelete, setMechanicToDelete] = useState<Mechanic | null>(null);

  // Handlers
  const handleOpenAddModal = () => {
    setSelectedMechanic(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setIsModalOpen(true);
  };

  const handleOpenDeleteDialog = (mechanic: Mechanic) => {
    setMechanicToDelete(mechanic);
    setIsDeleteDialogOpen(true);
  };

  const handleModalSubmit = async (input: MechanicInput): Promise<boolean> => {
    if (selectedMechanic) {
      return await editMechanic(selectedMechanic.id, input);
    } else {
      return await addMechanic(input);
    }
  };

  const handleDeleteConfirm = async (id: number): Promise<boolean> => {
    return await removeMechanic(id);
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Daftar Mekanik"
        subtitle="Kelola profil teknisi mekanik bengkel, kontak, keahlian, dan status keaktifan."
        badge="Master Data"
        action={
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Mekanik</span>
          </button>
        }
      />

      {/* Toolbar: Search & Sort by Date */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <MechanicSearch value={search} onChange={setSearch} />
          <SortByDate order={order} onChange={setOrder} />
        </div>
        <div className="text-xs text-slate-500 font-medium self-end sm:self-auto shrink-0">
          Total: <strong className="text-slate-900">{total}</strong> Mekanik
        </div>
      </div>

      {/* Mechanic Table & Loading Skeleton */}
      <MechanicTable
        mechanics={mechanics}
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
        unitName="mekanik"
        onPageChange={setPage}
      />

      {/* Add / Edit Mechanic Modal */}
      <MechanicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mechanic={selectedMechanic}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Mechanic Confirmation Dialog */}
      <DeleteMechanicDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        mechanic={mechanicToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </PageContainer>
  );
}
