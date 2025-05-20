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

  // useEffect only runs on the client, so we can safely access the window object
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Function to handle theme toggle more reliably
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <nav className="bg-background border-b border-border fixed w-full z-20 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-0">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Logo />
              </Link>
              <span className="ml-2 text-xl font-bold text-ocean-600">DiveRank</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8 sm:justify-center">
              <Link 
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === "/" 
                    ? "border-ocean-500 text-ocean-600" 
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200"
                }`}>
                Vote
              </Link>
              <Link 
                href="/rankings"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === "/rankings" 
                    ? "border-ocean-500 text-ocean-600" 
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200"
                }`}>
                Rankings
              </Link>
              <Link 
                href="/dive-sites"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === "/dive-sites" 
                    ? "border-ocean-500 text-ocean-600" 
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200"
                }`}>
                Directory
              </Link>
              <Link 
                href="/about"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === "/about" 
                    ? "border-ocean-500 text-ocean-600" 
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200"
                }`}>
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Theme toggle button */}
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
          <div className="pt-2 pb-3 space-y-1 bg-background">
            <Link 
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`${
                location === "/" 
                  ? "bg-ocean-50 border-ocean-500 text-ocean-700 dark:bg-slate-900" 
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Vote
            </Link>
            <Link 
              href="/rankings"
              onClick={() => setMobileMenuOpen(false)}
              className={`${
                location === "/rankings" 
                  ? "bg-ocean-50 border-ocean-500 text-ocean-700 dark:bg-slate-900" 
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Rankings
            </Link>
            <Link 
              href="/dive-sites"
              onClick={() => setMobileMenuOpen(false)}
              className={`${
                location === "/dive-sites" 
                  ? "bg-ocean-50 border-ocean-500 text-ocean-700 dark:bg-slate-900" 
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Directory
            </Link>
            <Link 
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`${
                location === "/about" 
                  ? "bg-ocean-50 border-ocean-500 text-ocean-700 dark:bg-slate-900" 
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" 
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              About
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}