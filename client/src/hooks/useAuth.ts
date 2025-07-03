import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { getToken, removeToken, isLoggedIn, getCurrentUser } from "@/lib/auth";

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
  const token = getToken();
  const hasValidToken = !!token && isLoggedIn();

  // Query to get current user from server using JWT token
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn<User>({ on401: "returnNull" }),
    enabled: hasValidToken, // Only run if token exists and is valid
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) errors
      if (error?.status === 401) return false;
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Improve authentication logic for production reliability
  // If we have a valid token but the API call is still loading or failed with non-401 error,
  // we can still consider the user authenticated based on token alone
  const isAuthenticated = hasValidToken && (!!user || (isLoading && !error) || (error && error?.status !== 401));

  const login = (user: User) => {
    // Update the cache with the new user data
    queryClient.setQueryData(["/api/auth/me"], user);
  };

  const logout = () => {
    console.log('[AUTH] Starting logout process');
    removeToken();
    console.log('[AUTH] Token removed');
    // Clear the current user query specifically first
    queryClient.setQueryData(["/api/auth/me"], null);
    // Clear all cached data to prevent data leakage between users
    queryClient.clear();
    console.log('[AUTH] Query cache cleared');
    // Force refetch of auth state
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  // Fallback user data from token if API call is still loading or failed with non-401 error
  const fallbackUser = hasValidToken && !user && (isLoading || (error && error?.status !== 401)) 
    ? getCurrentUser() 
    : null;

  return {
    user: user || fallbackUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}