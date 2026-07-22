"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import { LoginRequest, User } from "@/types/auth";
import { ROUTES } from "@/constants/routes";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  authenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Initialize auth state from localStorage on mount & verify token.
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = AuthService.getToken();
        const storedUser = AuthService.getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);

          // Verify token validity asynchronously with backend
          const currentUser = await AuthService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token invalid or expired
            AuthService.logout();
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Failed to restore authentication state:", err);
        AuthService.logout();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login method.
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    const response = await AuthService.login(credentials);

    if (response.success && response.data) {
      const authToken = response.data.accessToken || response.data.token;
      const authUser = response.data.user;

      if (!authToken || !authUser) {
        throw new Error("Invalid response format from authentication server.");
      }

      // Save to localStorage
      AuthService.saveToken(authToken);
      AuthService.saveUser(authUser);

      // Update state
      setToken(authToken);
      setUser(authUser);

      // Redirect to dashboard
      router.push(ROUTES.DASHBOARD);
    } else {
      throw new Error(response.message || response.error || "Login failed");
    }
  };

  /**
   * Logout method.
   */
  const logout = (): void => {
    AuthService.logout();
    setToken(null);
    setUser(null);
    router.push(ROUTES.LOGIN);
  };

  /**
   * Refresh user profile method.
   */
  const refresh = async (): Promise<void> => {
    if (!token) return;
    const currentUser = await AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  };

  const authenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authenticated,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
