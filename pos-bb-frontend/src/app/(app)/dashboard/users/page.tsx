"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { UserService } from "@/services/user.service";
import { UserItem, UserInput, UserRole } from "@/types/user";
import { formatDate } from "@/utils/format";
import { useToast } from "@/components/common/Toast";
import { UserModal } from "@/features/users/components/UserModal";
import { DeleteUserModal } from "@/features/users/components/DeleteUserModal";

const ROLE_BADGES: Record<UserRole, { label: string; classes: string }> = {
  OWNER: {
    label: "Owner",
    classes: "bg-purple-50 text-purple-700 border-purple-200",
  },
  ADMIN: {
    label: "Admin",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  CASHIER: {
    label: "Kasir",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  MECHANIC: {
    label: "Mekanik",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export default function UserManagementPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  // Redirect non-OWNER users to dashboard
  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== "OWNER") {
      showToast("Akses ditolak: Halaman ini khusus untuk Owner.", "error");
      router.replace("/dashboard");
    }
  }, [currentUser, authLoading, router, showToast]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await UserService.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        limit: 100,
        sort: "createdAt",
        order: "desc",
      });
      setUsers(data);
    } catch (err: any) {
      showToast(err.message || "Gagal memuat daftar pengguna.", "error");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, showToast]);

  useEffect(() => {
    if (currentUser?.role === "OWNER") {
      fetchUsers();
    }
  }, [fetchUsers, currentUser]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (userItem: UserItem) => {
    setSelectedUser(userItem);
    setIsModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (userItem: UserItem) => {
    setUserToDelete(userItem);
    setIsDeleteOpen(true);
  };

  // Handle Form Submit (Create / Edit)
  const handleSubmitUser = async (input: UserInput): Promise<boolean> => {
    try {
      if (selectedUser) {
        // Edit User
        await UserService.updateUser(selectedUser.id, input);
        showToast(`Pengguna "${input.name}" berhasil diperbarui.`, "success");
      } else {
        // Create User
        await UserService.createUser(input);
        showToast(`Pengguna "${input.name}" berhasil dibuat.`, "success");
      }
      await fetchUsers();
      return true;
    } catch (err: any) {
      showToast(err.message || "Gagal menyimpan data pengguna.", "error");
      return false;
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async (id: number): Promise<boolean> => {
    try {
      await UserService.deleteUser(id);
      showToast("Pengguna berhasil dihapus.", "success");
      await fetchUsers();
      return true;
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus pengguna.", "error");
      return false;
    }
  };

  // 403 Forbidden Screen if user is not OWNER
  if (!authLoading && currentUser && currentUser.role !== "OWNER") {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">403 - Akses Ditolak</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Halaman Manajemen Pengguna hanya dapat diakses oleh akun dengan role <span className="font-bold text-purple-700">OWNER</span>.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Manajemen Pengguna"
        subtitle="Kelola akun pengguna sistem, tingkat hak akses (role), dan status keanggotaan."
        badge="Khusus Owner"
      />

      {/* Toolbar: Search + Filter + Add Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email pengguna..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
          >
            <option value="">Semua Role</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="CASHIER">Kasir</option>
            <option value="MECHANIC">Mekanik</option>
          </select>
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Pengguna
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-slate-600 font-semibold">Tidak ada pengguna ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter role Anda.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-3.5 px-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide">Pengguna</th>
                <th className="py-3.5 px-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="py-3.5 px-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="py-3.5 px-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Dibuat Pada</th>
                <th className="py-3.5 px-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const badge = ROLE_BADGES[u.role] || { label: u.role, classes: "bg-slate-100 text-slate-700" };
                const isSelf = currentUser?.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Name + Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center text-xs shrink-0 border border-slate-200">
                          {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                (Anda)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 font-mono md:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <span className="font-mono text-xs text-slate-600 font-medium">{u.email}</span>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <span className="text-xs text-slate-500">{formatDate(u.createdAt)}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Pengguna"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(u)}
                          disabled={isSelf}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                          title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus Pengguna"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSubmit={handleSubmitUser}
      />

      <DeleteUserModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        user={userToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </PageContainer>
  );
}
