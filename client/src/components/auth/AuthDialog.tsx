import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  // Update mode when defaultMode changes
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleSuccess = () => {
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </DialogTitle>
        </DialogHeader>
        
        {mode === "signin" ? (
          <SignInForm
            onSuccess={handleSuccess}
            onSwitchToSignUp={() => setMode("signup")}
          />
        ) : (
          <SignUpForm
            onSuccess={handleSuccess}
            onSwitchToSignIn={() => setMode("signin")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}