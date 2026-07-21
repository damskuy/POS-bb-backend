import { useAuthContext } from "@/context/AuthContext";

/**
 * Custom hook to access authentication context throughout the application.
 */
export const useAuth = () => {
  return useAuthContext();
};
