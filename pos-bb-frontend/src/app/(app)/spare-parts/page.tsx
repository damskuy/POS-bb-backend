"use client";

import React, { useState } from "react";
import { useSpareParts } from "@/hooks/useSpareParts";
import { PageContainer, PageHeader, SortByDate } from "@/components/common";
import { CustomerPagination } from "@/features/customers";
import {
  SparePartTable,
  SparePartSearch,
  StockFilter,
  SparePartModal,
  DeleteSparePartDialog,
} from "@/features/spare-parts";
import { SparePart, SparePartInput } from "@/types/sparePart";

export default function SparePartsPage() {
  const {
    spareParts,
    loading,
    isFetching,
    search,
    setSearch,
    stockFilter,
    setStockFilter,
    order,
    setOrder,
    page,
    setPage,
    limit,
    total,
    addSparePart,
    editSparePart,
    removeSparePart,
  } = useSpareParts();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSparePart, setSelectedSparePart] = useState<SparePart | null>(null);

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [sparePartToDelete, setSparePartToDelete] = useState<SparePart | null>(null);

  // Handlers
  const handleOpenAddModal = () => {
    setSelectedSparePart(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SparePart) => {
    setSelectedSparePart(item);
    setIsModalOpen(true);
  };

  const handleOpenDeleteDialog = (item: SparePart) => {
    setSparePartToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleModalSubmit = async (input: SparePartInput): Promise<boolean> => {
    if (selectedSparePart) {
      return await editSparePart(selectedSparePart.id, input);
    } else {
      return await addSparePart(input);
    }
  };

  const handleDeleteConfirm = async (id: number): Promise<boolean> => {
    return await removeSparePart(id);
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Daftar Suku Cadang"
        subtitle="Kelola stok inventaris spare part, harga jual, batas minimum stok, dan lokasi penyimpanan."
        action={
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Suku Cadang</span>
          </button>
        }
      />

      {/* Unified Seamless Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          <SparePartSearch value={search} onChange={setSearch} />
          <StockFilter
            stockFilter={stockFilter}
            onChange={setStockFilter}
          />
          <SortByDate order={order} onChange={setOrder} />
        </div>
        <div className="text-xs text-slate-400 font-semibold px-2 self-end md:self-auto shrink-0 select-none">
          Total: <strong className="text-slate-700 font-tabular font-bold">{total}</strong> Suku Cadang
        </div>
      </div>

      {/* Table Card Container with Pagination */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.04)] overflow-hidden">
        <SparePartTable
          spareParts={spareParts}
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
          unitName="suku cadang"
          onPageChange={setPage}
        />
      </div>

      {/* Add / Edit Spare Part Modal */}
      <SparePartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sparePart={selectedSparePart}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Spare Part Confirmation Dialog */}
      <DeleteSparePartDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        sparePart={sparePartToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </PageContainer>
  );
}
