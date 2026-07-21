"use client";

import React, { useState } from "react";
import { useServices } from "@/hooks/useServices";
import { PageContainer, PageHeader, SortByDate } from "@/components/common";
import { CustomerPagination } from "@/features/customers";
import {
  ServiceTable,
  ServiceSearch,
  ServiceFilter,
  ServiceModal,
  DeleteServiceDialog,
} from "@/features/services";
import { Service, ServiceInput } from "@/types/service";

export default function ServicesPage() {
  const {
    services,
    loading,
    isFetching,
    search,
    setSearch,
    selectedStatus,
    setSelectedStatus,
    order,
    setOrder,
    page,
    setPage,
    limit,
    total,
    addService,
    editService,
    removeService,
  } = useServices();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Handlers
  const handleOpenAddModal = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleOpenDeleteDialog = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  const handleModalSubmit = async (input: ServiceInput): Promise<boolean> => {
    if (selectedService) {
      return await editService(selectedService.id, input);
    } else {
      return await addService(input);
    }
  };

  const handleDeleteConfirm = async (id: number): Promise<boolean> => {
    return await removeService(id);
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Daftar Jasa Servis"
        subtitle="Kelola katalog tarif jasa servis bengkel, estimasi durasi pekerjaan, dan status keaktifan."
        badge="Master Data"
        action={
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Servis</span>
          </button>
        }
      />

      {/* Toolbar: Search, Status Filter & Sort by Date */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <ServiceSearch value={search} onChange={setSearch} />
          <ServiceFilter
            selectedStatus={selectedStatus}
            onChange={setSelectedStatus}
          />
          <SortByDate order={order} onChange={setOrder} />
        </div>
        <div className="text-xs text-slate-500 font-medium self-end sm:self-auto shrink-0">
          Total: <strong className="text-slate-900">{total}</strong> Servis
        </div>
      </div>

      {/* Service Table & Loading Skeleton */}
      <ServiceTable
        services={services}
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
        unitName="servis"
        onPageChange={setPage}
      />

      {/* Add / Edit Service Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Service Confirmation Dialog */}
      <DeleteServiceDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        service={serviceToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </PageContainer>
  );
}
