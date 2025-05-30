import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { getQueryFn } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { getToken, removeToken, isLoggedIn } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/auth" }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  // Check for JWT token using auth helper
  const token = getToken();

  // Query to validate the JWT token with the server
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn<User>({ on401: "returnNull" }),
    enabled: !!token && isLoggedIn(), // Only run query if token exists and is valid
    retry: false, // Don't retry on auth failures
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  useEffect(() => {
    // No token or token is expired - redirect immediately
    if (!token || !isLoggedIn()) {
      if (token) {
        // Remove expired token
        removeToken();
      }
      setLocation(redirectTo);
      return;
    }

    // Token exists but validation failed - redirect after query completes
    if (!isLoading && (error || !user)) {
      // Clear invalid token
      removeToken();
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
  if (!isLoggedIn() || !user) {
    return null;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}