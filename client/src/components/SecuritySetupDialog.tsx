import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Shield } from "lucide-react";
import SecurityQuestions from "@/components/SecurityQuestions";

interface SecuritySetupDialogProps {
  open: boolean;
  onComplete: () => void;
}

export default function SecuritySetupDialog({ open, onComplete }: SecuritySetupDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const updateSecurityMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auth/security-questions", { securityData: data });
      return await res.json();
    },
    onSuccess: () => {
      setError(null);
      onComplete();
    },
    onError: (error: any) => {
      setError(error.message || "Failed to save security questions");
    },
  });

  const handleSubmit = (data: any) => {
    updateSecurityMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Security Questions Setup Required
          </DialogTitle>
          <DialogDescription>
            To secure your account and enable password recovery, please set up your security questions. 
            This is required before you can start voting.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> You'll need to answer at least 2 out of 3 questions correctly to reset your password. 
              Choose questions you'll remember the answers to.
            </AlertDescription>
          </Alert>

          <SecurityQuestions
            onSubmit={handleSubmit}
            isLoading={updateSecurityMutation.isPending}
            hideCard={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}