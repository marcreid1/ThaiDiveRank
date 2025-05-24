import { Link, useLocation } from "wouter";
import { Logo } from "@/assets/svg/logo";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, User, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const signInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { login, logout, isAuthenticated, user } = useAuth();

  const signInMutation = useMutation({
    mutationFn: async (data: z.infer<typeof signInSchema>) => {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to sign in");
      }
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
      setSignInOpen(false);
      signInForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: z.infer<typeof signUpSchema>) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create account");
      }
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      setSignUpOpen(false);
      signUpForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onSignIn = (data: z.infer<typeof signInSchema>) => {
    signInMutation.mutate(data);
  };

  const onSignUp = (data: z.infer<typeof signUpSchema>) => {
    signUpMutation.mutate(data);
  };
  
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
              <Link href="/" className="flex items-center">
                <Logo />
              </Link>
              <span className="ml-2 text-xl font-bold text-ocean-600">DiveRank</span>
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
            {isAuthenticated ? (
              /* User Menu */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                    <User className="h-4 w-4 mr-1" />
                    {user?.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={logout} className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Sign In Dialog */}
                <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden sm:inline-flex" data-sign-in-trigger>
                      <User className="h-4 w-4 mr-1" />
                      Sign In
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Sign In</DialogTitle>
                </DialogHeader>
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                    <FormField
                      control={signInForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={signInMutation.isPending}>
                      {signInMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Sign Up Dialog */}
            <Dialog open={signUpOpen} onOpenChange={setSignUpOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="hidden sm:inline-flex" data-sign-up-trigger>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Sign Up
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Account</DialogTitle>
                </DialogHeader>
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                    <FormField
                      control={signUpForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={signUpMutation.isPending}>
                      {signUpMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
              </>
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
          <div className="pt-2 pb-3 space-y-1 bg-background">
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={getMobileLinkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}