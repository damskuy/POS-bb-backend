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
        badge="Master Data"
        action={
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Suku Cadang</span>
          </button>
        }
      />

      {/* Toolbar: Search, Stock Filter & Sort by Date */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <SparePartSearch value={search} onChange={setSearch} />
          <StockFilter
            stockFilter={stockFilter}
            onChange={setStockFilter}
          />
          <SortByDate order={order} onChange={setOrder} />
        </div>
        <div className="text-xs text-slate-500 font-medium self-end sm:self-auto shrink-0">
          Total: <strong className="text-slate-900">{total}</strong> Suku Cadang
        </div>
      </div>

      {/* Spare Part Table & Loading Skeleton */}
      <SparePartTable
        spareParts={spareParts}
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
        unitName="suku cadang"
        onPageChange={setPage}
      />

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
