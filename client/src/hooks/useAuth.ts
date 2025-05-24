import { useState, useEffect, createContext, useContext } from "react";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status with backend on mount
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
          localStorage.removeItem("user"); // Clean up old localStorage data
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (user: User) => {
    setUser(user);
    // Remove localStorage dependency - sessions handle persistence
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include'
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user"); // Clean up any remaining localStorage data
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };
}