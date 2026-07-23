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
  VehiclesDrawer,
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

  // Vehicles drawer states
  const [drawerCustomerId, setDrawerCustomerId] = useState<number | null>(null);
  const [drawerCustomerName, setDrawerCustomerName] = useState<string>("");
  const isDrawerOpen = drawerCustomerId !== null;

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
    <>
      {/* Main Page Content Wrapper (Blurs consistently when drawer is open) */}
      <div
        className={`transition-all duration-300 ease-in-out z-0 ${
          isDrawerOpen ? "blur-[3px] brightness-95 pointer-events-none" : ""
        }`}
      >
        <PageContainer>
          {/* Simplified Header */}
          <PageHeader
            title="Daftar Pelanggan"
            subtitle="Kelola data pelanggan bengkel, informasi kontak, dan riwayat kendaraan."
            action={
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
                </svg>
                <span>Tambah Pelanggan</span>
              </button>
            }
          />

          {/* Unified Seamless Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
              <CustomerSearch value={search} onChange={setSearch} />
              <SortByDate order={order} onChange={setOrder} />
            </div>
            <div className="text-xs text-slate-400 font-semibold px-2 self-end md:self-auto shrink-0 select-none">
              Total: <strong className="text-slate-700 font-tabular font-bold">{total}</strong> Pelanggan
            </div>
          </div>

          {/* Table Card Container with Pagination */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.04)] overflow-hidden">
            <CustomerTable
              customers={customers}
              loading={loading}
              isFetching={isFetching}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteDialog}
              onAddClick={handleOpenAddModal}
              onViewVehicles={(id, name) => {
                setDrawerCustomerId(id);
                setDrawerCustomerName(name);
              }}
            />
            <CustomerPagination
              page={page}
              limit={limit}
              total={total}
              unitName="pelanggan"
              onPageChange={setPage}
            />
          </div>

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
      </div>

      {/* Side Detail Panel (Renders outside the blur wrapper for absolute sharpness) */}
      {isDrawerOpen && (
        <VehiclesDrawer
          customerId={drawerCustomerId}
          customerName={drawerCustomerName}
          onClose={() => {
            setDrawerCustomerId(null);
            setDrawerCustomerName("");
          }}
        />
      )}
    </>
  );
}
