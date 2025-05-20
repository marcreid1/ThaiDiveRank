import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          <div className="px-5 py-2">
            <a 
              href="/about" 
              className="text-base text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/about";
                window.scrollTo(0, 0);
              }}
            >
              About
            </a>
          </div>

          <div className="px-5 py-2">
            <a 
              href="/contact" 
              className="text-base text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/contact";
                window.scrollTo(0, 0);
              }}
            >
              Contact
            </a>
          </div>
          <div className="px-5 py-2">
            <a 
              href="/privacy" 
              className="text-base text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/privacy";
                window.scrollTo(0, 0);
              }}
            >
              Privacy
            </a>
          </div>
          <div className="px-5 py-2">
            <a 
              href="/terms" 
              className="text-base text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/terms";
                window.scrollTo(0, 0);
              }}
            >
              Terms
            </a>
          </div>
        </nav>
        <p className="mt-8 text-center text-base text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} DiveRank, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}