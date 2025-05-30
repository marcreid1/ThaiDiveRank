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

import Dashboard from "@/pages/Dashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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

            <Route path="/dashboard">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
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
