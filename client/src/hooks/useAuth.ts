import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthState() {
  const queryClient = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null;

  // Query to get current user from server using JWT token
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn<User>({ on401: "returnNull" }),
    enabled: !!token, // Only run if token exists
    retry: false,
    staleTime: 0, // Always fresh
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!token && !!user && !error;

  const login = (user: User) => {
    // Update the cache with the new user data immediately
    queryClient.setQueryData(["/api/auth/me"], user);
    // Force a refetch to ensure consistency
    refetch();
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    // Clear user data from cache
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  return {
    user: user || null,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}