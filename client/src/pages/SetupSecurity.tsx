import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import SecurityQuestions from "@/components/SecurityQuestions";

export default function SetupSecurity() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const updateSecurityMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auth/security-questions", data);
      return await res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to update security questions");
    },
  });

  const handleSubmit = (data: any) => {
    updateSecurityMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to set up security questions.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Security Questions Set Up Successfully</h1>
            <p className="text-gray-600 mb-6">
              Your security questions have been saved. You can now use them to reset your password if needed.
            </p>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <SecurityQuestions
            onSubmit={handleSubmit}
            isLoading={updateSecurityMutation.isPending}
            description="Set up security questions to enable password recovery. You'll need to answer at least 2 out of 3 questions correctly to reset your password."
          />
        )}
      </div>
    </div>
  );
}