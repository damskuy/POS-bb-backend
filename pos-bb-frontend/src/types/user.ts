export type UserRole = "OWNER" | "ADMIN" | "CASHIER" | "MECHANIC";

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sort?: string;
  order?: "asc" | "desc";
}
