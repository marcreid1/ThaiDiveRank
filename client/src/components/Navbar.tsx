import { Link, useLocation } from "wouter";
import { Logo } from "@/assets/svg/logo";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, User, LogIn, LogOut, UserPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getToken } from "@/lib/auth";
import { AuthDialogContext } from "@/hooks/useAuthDialog";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const openSignInDialog = () => {
    setAuthDialogMode("signin");
    setAuthDialogOpen(true);
  };

  const openSignUpDialog = () => {
    setAuthDialogMode("signup");
    setAuthDialogOpen(true);
  };

  const handleLogout = () => {
    console.log('[NAVBAR] Logout clicked');
    try {
      logout();
      console.log('[NAVBAR] Logout function called');
      setLocation('/');
      console.log('[NAVBAR] Navigation to / complete');
    } catch (error) {
      console.error('[NAVBAR] Error during logout:', error);
    }
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
  };

  const authDialogContextValue = {
    openSignInDialog,
    openSignUpDialog
  };

  // Navigation links - dashboard removed from main navigation
  const navLinks = [
    { href: "/", label: "Vote" },
    { href: "/rankings", label: "Rankings" },
    { href: "/dive-sites", label: "Directory" },
    { href: "/about", label: "About" }
  ];

  const getDesktopLinkClass = (path: string) => {
    return `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
      location === path 
        ? "border-ocean-500 text-ocean-600" 
        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200"
    }`;
  };

  const getMobileLinkClass = (path: string) => {
    return `${
      location === path 
        ? "bg-ocean-50 border-ocean-500 text-ocean-700 dark:bg-slate-900" 
        : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`;
  };

  return (
    <nav className="bg-background border-b border-border fixed w-full z-20 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-0">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <Logo />
                <span className="ml-2 text-xl font-bold text-ocean-600">DiveRank</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8 sm:justify-center">
              {navLinks.map(link => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className={getDesktopLinkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Authentication controls */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {user?.email}
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center w-full">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={openSignInDialog}>
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign In
                </Button>
                <Button variant="outline" size="sm" onClick={openSignUpDialog}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Sign Up
                </Button>
              </div>
            )}

            {/* Dark mode toggle - always visible */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
            <button 
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ocean-500 dark:hover:bg-slate-800 dark:text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1 bg-background border-t border-border">
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href}
                className={getMobileLinkClass(link.href)}
                onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            
            {/* Mobile authentication controls */}
            <div className="border-t border-border pt-3 mt-3">
              {isAuthenticated ? (
                <div className="px-3 py-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center text-sm text-slate-600 dark:text-slate-300 mb-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors w-full text-left"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user?.email}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 rounded-md"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  <button
                    onClick={() => {
                      openSignInDialog();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 rounded-md"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      openSignUpDialog();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 rounded-md"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Auth Dialog */}
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        defaultMode={authDialogMode}
        onSuccess={handleAuthSuccess}
      />
    </nav>
  );
}