# Centralized Authentication System

## Auth Helper Functions (/lib/auth.ts)

```typescript
// Token Management
getToken(): string | null              // Get JWT from localStorage
setToken(token: string): void          // Store JWT in localStorage  
removeToken(): void                    // Remove JWT from localStorage

// Authentication Status
isLoggedIn(): boolean                  // Check if user has valid, non-expired token
getCurrentUser(): User | null          // Get current user data from token
getUserFromToken(): TokenData | null   // Decode JWT payload (userId, email, exp, iat)

// Token Validation
isTokenExpiringSoon(): boolean         // Check if token expires within 5 minutes
getTokenTimeToExpiry(): number         // Get seconds until token expires

// API Integration
getAuthHeader(): object                // Get Authorization header for requests
login(token: string): void             // Store token for user login
logout(): void                         // Remove token and redirect to home
```

## Implementation Analysis

### ✅ JWT Token Storage
After successful sign-in, the JWT token is properly saved:

```typescript
// In SignInForm.tsx - onSuccess handler
onSuccess: (result) => {
  // Store JWT in localStorage
  localStorage.setItem("auth_token", result.token);
  
  // Invalidate queries to refetch user state
  queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
}
```

### ✅ TanStack Query Auth State Management
The auth state is managed using TanStack Query with real-time updates:

```typescript
// In useAuth.ts
export function useAuthState() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");

  // Query current user from server using JWT token
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn<User>({ on401: "returnNull" }),
    enabled: !!token, // Only run if token exists
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isAuthenticated = !!token && !!user && !error;

  const login = (user: User) => {
    queryClient.setQueryData(["/api/auth/me"], user);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  return { user, isAuthenticated, isLoading, login, logout };
}
```

### ✅ Navbar Auth State Integration
The navigation dynamically updates based on authentication state:

```typescript
// In Navbar.tsx
export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  // Dynamic navigation links - dashboard only shown when authenticated
  const navLinks = [
    { href: "/", label: "Vote" },
    { href: "/rankings", label: "Rankings" },
    { href: "/dive-sites", label: "Directory" },
    ...(isAuthenticated ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    { href: "/about", label: "About" }
  ];

  return (
    <nav>
      {/* Auth controls */}
      {isAuthenticated ? (
        <div className="flex items-center space-x-2">
          <span>{user?.email}</span>
          <Button onClick={logout}>
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>
      ) : (
        <Link href="/auth">
          <Button>
            <LogIn className="h-4 w-4 mr-1" />
            Sign In
          </Button>
        </Link>
      )}
    </nav>
  );
}
```

## Complete Flow Sequence

1. **User Signs In** → SignInForm calls `/api/signin`
2. **Server Returns JWT** → `{ token: "eyJ...", user: {...} }`
3. **Client Stores Token** → `localStorage.setItem("auth_token", result.token)`
4. **TanStack Query Updates** → `invalidateQueries(["/api/auth/me"])`
5. **Auth State Refreshes** → `useAuthState()` detects token and fetches user
6. **Navbar Updates** → Shows user email + "Sign Out" button
7. **Protected Routes** → Dashboard link appears in navigation

## Key Features

- **Automatic Token Inclusion**: All API requests include `Authorization: Bearer <token>`
- **Real-time State Sync**: TanStack Query keeps auth state synchronized
- **Persistent Sessions**: JWT tokens persist across browser sessions
- **Secure Logout**: Removes token and clears all cached user data
- **Protected Navigation**: Dynamic nav links based on authentication status