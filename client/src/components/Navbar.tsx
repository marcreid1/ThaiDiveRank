import { Link, useLocation } from "wouter";
import { Logo } from "@/assets/svg/logo";
import { useState } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 fixed w-full z-20 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Logo />
              </Link>
              <span className="ml-2 text-xl font-bold text-ocean-600">DiveRank</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === "/" 
                    ? "border-ocean-500 text-ocean-600" 
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}>
                Vote
              </Link>
              <Link 
                href="/rankings"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === "/rankings" 
                    ? "border-ocean-500 text-ocean-600" 
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}>
                Rankings
              </Link>
              <Link 
                href="/dive-sites"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === "/dive-sites" 
                    ? "border-ocean-500 text-ocean-600" 
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}>
                Directory
              </Link>
              <Link 
                href="/about"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === "/about" 
                    ? "border-ocean-500 text-ocean-600" 
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}>
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button 
              type="button" 
              className="bg-ocean-500 p-1 rounded-full text-white hover:bg-ocean-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-500"
              onClick={() => {}}
            >
              <span className="sr-only">View notifications</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button 
              className="ml-2 sm:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ocean-500"
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
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              href="/"
              className={`${
                location === "/" 
                  ? "bg-ocean-50 border-ocean-500 text-ocean-700" 
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Vote
            </Link>
            <Link 
              href="/rankings"
              className={`${
                location === "/rankings" 
                  ? "bg-ocean-50 border-ocean-500 text-ocean-700" 
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Rankings
            </Link>
            <Link 
              href="/dive-sites"
              className={`${
                location === "/dive-sites" 
                  ? "bg-ocean-50 border-ocean-500 text-ocean-700" 
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Directory
            </Link>
            <Link 
              href="/about"
              className={`${
                location === "/about" 
                  ? "bg-ocean-50 border-ocean-500 text-ocean-700" 
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              About
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}