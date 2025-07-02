import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SecurityQuestions from "@/components/SecurityQuestions";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";

export default function SetupSecurity() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const updateSecurityMutation = useMutation({
    mutationFn: async (data: {
      question1: string;
      answer1: string;
      question2: string;
      answer2: string;
      question3: string;
      answer3: string;
    }) => {
      const response = await apiRequest('/api/auth/security-questions', 'POST', { securityData: data });
      return response;
    },
    onSuccess: () => {
      setSuccess(true);
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to set up security questions');
    },
  });

  const handleSubmit = (data: {
    question1: string;
    answer1: string;
    question2: string;
    answer2: string;
    question3: string;
    answer3: string;
  }) => {
    setError('');
    updateSecurityMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Security Questions Set Up Successfully
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Your security questions have been saved. You can now use them to reset your password if needed.
              </p>
              <Link href="/dashboard">
                <Button>Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
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