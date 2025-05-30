import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { getQueryFn } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/auth" }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  // Check for JWT token in localStorage
  const token = localStorage.getItem("auth_token");

  // Query to validate the JWT token with the server
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn<User>({ on401: "returnNull" }),
    enabled: !!token, // Only run query if token exists
    retry: false, // Don't retry on auth failures
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  useEffect(() => {
    // No token in localStorage - redirect immediately
    if (!token) {
      setLocation(redirectTo);
      return;
    }

    // Token exists but validation failed - redirect after query completes
    if (!isLoading && (error || !user)) {
      // Clear invalid token
      localStorage.removeItem("auth_token");
      setLocation(redirectTo);
    }
  }, [token, user, isLoading, error, setLocation, redirectTo]);

  // Show loading state while validating token
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Validating authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!token || !user) {
    return null;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}