import { User } from "@shared/schema";

const TOKEN_KEY = "auth_token";

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set JWT token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if user is logged in (has a valid token)
 */
export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;
  
  // Check if token is expired
  try {
    const payload = getUserFromToken();
    if (!payload) return false;
    
    // Check expiration (exp is in seconds, Date.now() is in milliseconds)
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch {
    return false;
  }
}

/**
 * Decode JWT payload without verification (for client-side use only)
 * Returns user data if token is valid, null otherwise
 */
export function getUserFromToken(): { userId: string; email: string; exp: number; iat: number } | null {
  const token = getToken();
  if (!token) return null;
  
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (base64url)
    const payload = parts[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsedPayload = JSON.parse(decodedPayload);
    
    // Validate required fields
    if (!parsedPayload.userId || !parsedPayload.email || !parsedPayload.exp) {
      return null;
    }
    
    return {
      userId: parsedPayload.userId,
      email: parsedPayload.email,
      exp: parsedPayload.exp,
      iat: parsedPayload.iat
    };
  } catch {
    return null;
  }
}

/**
 * Get current user data from token
 */
export function getCurrentUser(): Pick<User, 'id' | 'email'> | null {
  const tokenData = getUserFromToken();
  if (!tokenData) return null;
  
  return {
    id: tokenData.userId,
    email: tokenData.email
  };
}

/**
 * Check if token is about to expire (within 5 minutes)
 */
export function isTokenExpiringSoon(): boolean {
  const tokenData = getUserFromToken();
  if (!tokenData) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const fiveMinutesFromNow = currentTime + (5 * 60);
  
  return tokenData.exp <= fiveMinutesFromNow;
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenTimeToExpiry(): number {
  const tokenData = getUserFromToken();
  if (!tokenData) return 0;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, tokenData.exp - currentTime);
}

/**
 * Create Authorization header for API requests
 */
export function getAuthHeader(): { Authorization: string } | {} {
  const token = getToken();
  if (!token) return {};
  
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Logout user by removing token and clearing any cached data
 */
export function logout(): void {
  removeToken();
  // Trigger a page reload to clear any cached state
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

/**
 * Login user by setting token
 */
export function login(token: string): void {
  setToken(token);
}