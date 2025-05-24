import { Switch, Route, Router, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Rankings from "@/pages/Rankings";
import DiveSites from "@/pages/DiveSites";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Contact from "@/pages/Contact";
import Profile from "@/pages/Profile";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthContext, useAuthState } from "@/hooks/useAuth";
import { useEffect } from "react";

// Hook to scroll to top when location changes
function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function AppRouter() {
  const authState = useAuthState();
  
  // Show loading screen while checking authentication
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authState}>
      <div className="flex flex-col min-h-screen">
        <ScrollToTop />
        <Navbar />
        <div className="flex-grow">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/rankings" component={Rankings} />
            <Route path="/dive-sites" component={DiveSites} />
            <Route path="/profile" component={Profile} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
            <Route path="/contact" component={Contact} />
            <Route component={NotFound} />
          </Switch>
        </div>
        <Footer />
      </div>
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
