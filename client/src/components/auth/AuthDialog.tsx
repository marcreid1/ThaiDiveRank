import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SignUpForm } from "./SignUpForm";
import { SignInForm } from "./SignInForm";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "signin" | "signup";
  onSuccess?: () => void;
}

export function AuthDialog({ open, onOpenChange, defaultMode = "signin", onSuccess }: AuthDialogProps) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);

  // Update mode when defaultMode changes or dialog opens
  useEffect(() => {
    if (open) {
      setMode(defaultMode);
    }
  }, [defaultMode, open]);

  const handleSuccess = () => {
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset mode to default when closing
      setMode(defaultMode);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" key={`auth-dialog-${mode}`}>
        <DialogHeader>
          <DialogTitle className="sr-only">
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === "signin" 
              ? "Enter your credentials to sign in to your account" 
              : "Create a new account to start voting on dive sites"
            }
          </DialogDescription>
        </DialogHeader>
        
        {mode === "signin" ? (
          <SignInForm
            key="signin-form"
            onSuccess={handleSuccess}
            onSwitchToSignUp={() => setMode("signup")}
            onClose={() => handleOpenChange(false)}
          />
        ) : (
          <SignUpForm
            key="signup-form"
            onSuccess={handleSuccess}
            onSwitchToSignIn={() => setMode("signin")}
            onClose={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}