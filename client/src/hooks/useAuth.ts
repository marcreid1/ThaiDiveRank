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
  const token = localStorage.getItem("auth_token");

  // Query to get current user from server using JWT token
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn<User>({ on401: "returnNull" }),
    enabled: !!token, // Only run if token exists
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!token && !!user && !error;

  const login = (user: User) => {
    // Update the cache with the new user data
    queryClient.setQueryData(["/api/auth/me"], user);
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