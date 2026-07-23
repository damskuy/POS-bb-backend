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
        action={
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Mekanik</span>
          </button>
        }
      />

      {/* Unified Seamless Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          <MechanicSearch value={search} onChange={setSearch} />
          <SortByDate order={order} onChange={setOrder} />
        </div>
        <div className="text-xs text-slate-400 font-semibold px-2 self-end md:self-auto shrink-0 select-none">
          Total: <strong className="text-slate-700 font-tabular font-bold">{total}</strong> Mekanik
        </div>
      </div>

      {/* Table Card Container with Pagination */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.04)] overflow-hidden">
        <MechanicTable
          mechanics={mechanics}
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
          unitName="mekanik"
          onPageChange={setPage}
        />
      </div>

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
