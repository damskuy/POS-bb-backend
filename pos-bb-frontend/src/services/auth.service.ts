import { api } from "@/lib/api";
import { STORAGE_KEYS } from "@/constants/storage";
import { LoginRequest, LoginResponse, User } from "@/types/auth";
import { ApiResponse } from "@/types/api";

export const AuthService = {
  /**
   * Authenticate user with email and password via POST /api/auth/login.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/api/auth/login", credentials);
    return response;
  },

  /**
   * Fetch currently authenticated user profile via GET /api/auth/me using Bearer Token.
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await api.get<ApiResponse<User>>("/api/auth/me", { token });
      if (response.success && response.data) {
        this.saveUser(response.data);
        return response.data;
      }
      return null;
    } catch {
      this.logout();
      return null;
    }
  },

  /**
   * Save JWT token to localStorage under key "auth_token".
   */
  saveToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
  },

  /**
   * Retrieve JWT token from localStorage.
   */
  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    return null;
  },

  /**
   * Remove JWT token and cached user data from localStorage.
   */
  removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  /**
   * Save User profile to localStorage under key "auth_user".
   */
  saveUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  },

  /**
   * Retrieve cached User profile from localStorage.
   */
  getUser(): User | null {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  /**
   * Complete logout procedure (removes token and user data).
   */
  logout(): void {
    this.removeToken();
  },
};
