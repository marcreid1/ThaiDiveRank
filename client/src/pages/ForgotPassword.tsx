import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetSchema = z.object({
  answer1: z.string().min(1, "This answer is required"),
  answer2: z.string().min(1, "This answer is required"),
  answer3: z.string().min(1, "This answer is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
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
  const [step, setStep] = useState<"email" | "questions" | "success">("email");
  const [securityData, setSecurityData] = useState<SecurityQuestionsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" }
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      answer1: "",
      answer2: "",
      answer3: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: EmailForm) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return await res.json();
    },
    onSuccess: (data: { questions: [string, string, string]; userId: string }) => {
      setSecurityData(data);
      setStep("questions");
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to retrieve security questions");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetForm) => {
      if (!securityData) throw new Error("No security data available");
      
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        userId: securityData.userId,
        answers: [data.answer1, data.answer2, data.answer3],
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      setStep("success");
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to reset password");
    },
  });

  const handleEmailSubmit = (data: EmailForm) => {
    forgotPasswordMutation.mutate(data);
  };

  const handleResetSubmit = (data: ResetForm) => {
    resetPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/auth">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </Link>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "email" && (
          <Card>
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Enter your email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? "Checking..." : "Continue"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === "questions" && securityData && (
          <Card>
            <CardHeader>
              <CardTitle>Security Questions</CardTitle>
              <CardDescription>
                Answer at least 2 out of 3 questions correctly to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="answer1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{securityData.questions[0]}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your answer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={resetForm.control}
                    name="answer2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{securityData.questions[1]}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your answer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={resetForm.control}
                    name="answer3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{securityData.questions[2]}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your answer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-4">
                    <FormField
                      control={resetForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="Enter new password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={resetForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="Confirm new password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Password Reset Successful
              </CardTitle>
              <CardDescription>
                Your password has been reset successfully. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth">
                <Button className="w-full">
                  Go to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}