"use client";

import React, { useState } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { PageContainer, PageHeader, SortByDate } from "@/components/common";
import {
  CustomerTable,
  CustomerSearch,
  CustomerPagination,
  CustomerModal,
  DeleteCustomerDialog,
} from "@/features/customers";
import { Customer, CustomerInput } from "@/types/customer";

export default function CustomersPage() {
  const {
    customers,
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
    addCustomer,
    editCustomer,
    removeCustomer,
  } = useCustomers();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Handlers
  const handleOpenAddModal = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleOpenDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleModalSubmit = async (input: CustomerInput): Promise<boolean> => {
    if (selectedCustomer) {
      return await editCustomer(selectedCustomer.id, input);
    } else {
      return await addCustomer(input);
    }
  };

  const handleDeleteConfirm = async (id: number): Promise<boolean> => {
    return await removeCustomer(id);
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Daftar Pelanggan"
        subtitle="Kelola data pelanggan bengkel, informasi kontak, dan riwayat kendaraan."
        badge="Master Data"
        action={
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Pelanggan</span>
          </button>
        }
      />

      {/* Toolbar: Search & Sort by Date */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <CustomerSearch value={search} onChange={setSearch} />
          <SortByDate order={order} onChange={setOrder} />
        </div>
        <div className="text-xs text-slate-500 font-medium self-end sm:self-auto shrink-0">
          Total: <strong className="text-slate-900">{total}</strong> Pelanggan
        </div>
      </div>

      {/* Table & Loading Skeleton */}
      <CustomerTable
        customers={customers}
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
        unitName="pelanggan"
        onPageChange={setPage}
      />

      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Customer Confirmation Dialog */}
      <DeleteCustomerDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        customer={customerToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </PageContainer>
  );
}
