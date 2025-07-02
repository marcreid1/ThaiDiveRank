import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetSchema = z.object({
  answer1: z.string().optional(),
  answer2: z.string().optional(),
  answer3: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

interface SecurityQuestionsData {
  questions: [string, string, string];
  userId: string;
}

export default function ForgotPassword() {
  const [resetStep, setResetStep] = useState<'email' | 'security' | 'success'>('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [securityData, setSecurityData] = useState<SecurityQuestionsData | null>(null);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      answer1: "",
      answer2: "",
      answer3: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const emailMutation = useMutation({
    mutationFn: async (data: EmailForm) => {
      const response = await apiRequest('/api/auth/forgot-password', 'POST', data);
      return response;
    },
    onSuccess: (data) => {
      setSecurityData(data);
      setResetStep('security');
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to find account or security questions not set up');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetForm) => {
      const response = await apiRequest('/api/auth/reset-password', 'POST', {
        userId: securityData?.userId,
        answer1: data.answer1,
        answer2: data.answer2,
        answer3: data.answer3,
        newPassword: data.newPassword,
      });
      return response;
    },
    onSuccess: () => {
      setResetStep('success');
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to reset password. Please check your answers.');
    },
  });

  const handleEmailSubmit = (data: EmailForm) => {
    setError('');
    emailMutation.mutate(data);
  };

  const handleResetSubmit = (data: ResetForm) => {
    setError('');
    resetPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {resetStep === 'email' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Reset Password</CardTitle>
                <CardDescription>
                  Enter your email address to retrieve your security questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email address"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            We'll ask you to answer security questions associated with this account
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={emailMutation.isPending}
                    >
                      {emailMutation.isPending ? 'Checking...' : 'Continue'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : resetStep === 'security' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Answer Security Questions</CardTitle>
                <CardDescription>
                  Please answer at least 2 out of 3 security questions correctly to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-6">
                    {securityData && securityData.questions.map((question, index) => (
                      <FormField
                        key={index}
                        control={resetForm.control}
                        name={`answer${index + 1}` as keyof ResetForm}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Question {index + 1}: {question}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your answer"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    
                    <FormField
                      control={resetForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Enter your new password"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 6 characters long
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={resetForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Confirm your new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={resetPasswordMutation.isPending}
                    >
                      {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setResetStep('email');
                      setSecurityData(null);
                      setError('');
                      emailForm.reset();
                      resetForm.reset();
                    }}
                    className="text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    ← Try a different email
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Password Reset Successfully</h1>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <Link href="/auth">
                  <Button>
                    Go to Sign In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}