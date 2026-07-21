export type UserRole = "OWNER" | "ADMIN" | "CASHIER" | "MECHANIC";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  token?: string;
  user: User;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: LoginResponseData;
  error?: string;
  errors?: Record<string, string[]>;
}
