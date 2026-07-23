"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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
    classes: "bg-purple-50 text-purple-700 border-purple-200/60",
  },
  ADMIN: {
    label: "Admin",
    classes: "bg-blue-50 text-blue-700 border-blue-200/60",
  },
  CASHIER: {
    label: "Kasir",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  },
  MECHANIC: {
    label: "Mekanik",
    classes: "bg-amber-50 text-amber-700 border-amber-200/60",
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
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setIsRoleOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">403 - Akses Ditolak</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">
            Halaman Manajemen Pengguna hanya dapat diakses oleh akun dengan role <span className="font-bold text-purple-700">OWNER</span>.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
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
        action={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Pengguna</span>
          </button>
        }
      />

      {/* Unified Seamless Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email pengguna..."
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-200 transition-all shadow-2xs"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Role Filter */}
          <div className="relative shrink-0" ref={roleDropdownRef}>
            <button
              onClick={() => setIsRoleOpen(!isRoleOpen)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs select-none cursor-pointer"
            >
              <span>
                Role:{" "}
                {roleFilter === "OWNER"
                  ? "Owner"
                  : roleFilter === "ADMIN"
                  ? "Admin"
                  : roleFilter === "CASHIER"
                  ? "Kasir"
                  : roleFilter === "MECHANIC"
                  ? "Mekanik"
                  : "Semua Role"}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isRoleOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isRoleOpen && (
              <div className="absolute left-0 mt-2 w-44 bg-white border border-slate-200/80 rounded-xl shadow-lg z-30 py-1.5 animate-fadeIn">
                {[
                  { value: "", label: "Semua Role" },
                  { value: "OWNER", label: "Owner" },
                  { value: "ADMIN", label: "Admin" },
                  { value: "CASHIER", label: "Kasir" },
                  { value: "MECHANIC", label: "Mekanik" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setRoleFilter(opt.value);
                      setIsRoleOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                      roleFilter === opt.value
                        ? "text-slate-900 bg-slate-50/50 font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {roleFilter === opt.value && (
                      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-400 font-semibold px-2 self-end md:self-auto shrink-0 select-none">
          Total: <strong className="text-slate-700 font-tabular font-bold">{users.length}</strong> Pengguna
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.04)] overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full" />
                <div className="space-y-1.5">
                  <div className="w-28 h-4 bg-slate-200 rounded" />
                  <div className="w-20 h-3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-24 h-4 bg-slate-200 rounded hidden md:block" />
              <div className="w-16 h-6 bg-slate-200 rounded-full" />
              <div className="w-24 h-4 bg-slate-200 rounded hidden md:block" />
              <div className="w-16 h-4 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-slate-600 font-semibold">Tidak ada pengguna ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter role Anda.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.04)] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/80">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pengguna</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Dibuat Pada</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const badge = ROLE_BADGES[u.role] || { label: u.role, classes: "bg-slate-100 text-slate-700" };
                const isSelf = currentUser?.id === u.id;
                const initials = u.name
                  ? u.name
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "U";

                return (
                  <tr key={u.id} className="group hover:bg-slate-50/60 transition-colors">
                    {/* Name + Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                                (Anda)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 font-mono md:hidden mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="font-mono text-xs text-slate-800 font-semibold">{u.email}</span>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4 hidden md:table-cell font-mono text-xs text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Pengguna"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(u)}
                          disabled={isSelf}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 cursor-pointer"
                          title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus Pengguna"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
