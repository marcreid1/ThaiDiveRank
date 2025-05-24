import { Link } from "wouter";

export default function Footer() {
  const footerLinks = [
    { href: "/about", label: "About" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" }
  ];
  
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    window.location.href = path;
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          {footerLinks.map((link) => (
            <div key={link.href} className="px-5 py-2">
              <a 
                href={link.href} 
                className="text-base text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={(e) => handleNavigation(e, link.href)}
              >
                {link.label}
              </a>
            </div>
          ))}
        </nav>
        <p className="mt-8 text-center text-base text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} DiveRank, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}