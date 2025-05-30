import { Link, useLocation } from "wouter";
import { Logo } from "@/assets/svg/logo";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Navigation links
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
          </div>
        </div>
      )}
    </nav>
  );
}