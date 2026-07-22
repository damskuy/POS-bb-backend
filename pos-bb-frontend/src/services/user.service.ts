import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { UserItem, UserInput, GetUsersParams } from "@/types/user";

export interface GetUsersResult {
  data: UserItem[];
  total: number;
}

export const UserService = {
  getUsers: async (params?: GetUsersParams): Promise<GetUsersResult> => {
    const res = await api.get<ApiResponse<UserItem[]> & { total?: number; meta?: { total: number } }>(
      "/api/users",
      { params: params as Record<string, string | number | boolean | undefined> }
    );
    const data = res.data || [];
    const total = typeof res.total === "number" ? res.total : (res.meta?.total ?? data.length);
    return { data, total };
  },

  getUserById: async (id: number): Promise<UserItem> => {
    const res = await api.get<ApiResponse<UserItem>>(`/api/users/${id}`);
    if (!res.data) throw new Error("Pengguna tidak ditemukan");
    return res.data;
  },

  createUser: async (data: UserInput): Promise<UserItem> => {
    const res = await api.post<ApiResponse<UserItem>>("/api/users", data);
    if (!res.data) throw new Error("Gagal membuat pengguna");
    return res.data;
  },

  updateUser: async (id: number, data: Partial<UserInput>): Promise<UserItem> => {
    const res = await api.patch<ApiResponse<UserItem>>(`/api/users/${id}`, data);
    if (!res.data) throw new Error("Gagal memperbarui pengguna");
    return res.data;
  },

  deleteUser: async (id: number): Promise<UserItem> => {
    const res = await api.delete<ApiResponse<UserItem>>(`/api/users/${id}`);
    if (!res.data) throw new Error("Gagal menghapus pengguna");
    return res.data;
  },
};
