import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, Key, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetSchema = z.object({
  question1: z.string().min(1, "Please answer the first security question"),
  question2: z.string().min(1, "Please answer the second security question"),
  question3: z.string().min(1, "Please answer the third security question"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackToSignIn?: () => void;
}

export function ForgotPasswordDialog({ open, onOpenChange, onBackToSignIn }: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<"email" | "security" | "success">("email");
  const [securityQuestions, setSecurityQuestions] = useState<[string, string, string] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      question1: "",
      question2: "",
      question3: "",
      newPassword: "",
    },
  });

  const getSecurityQuestionsMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/security-questions", { email });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.questions && data.userId) {
        setSecurityQuestions(data.questions);
        setUserId(data.userId);
        setStep("security");
      } else {
        toast({
          title: "Account Not Found",
          description: "No account found with this email address or security questions not set up.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to retrieve security questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetFormData) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        userId,
        answer1: data.question1,
        answer2: data.question2,
        answer3: data.question3,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      setStep("success");
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully. You can now sign in with your new password.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password. Please check your security answers and try again.",
        variant: "destructive",
      });
    },
  });

  const handleEmailSubmit = (data: EmailFormData) => {
    getSecurityQuestionsMutation.mutate(data.email);
  };

  const handleResetSubmit = (data: ResetFormData) => {
    resetPasswordMutation.mutate(data);
  };

  const handleClose = () => {
    setStep("email");
    setSecurityQuestions(null);
    setUserId(null);
    emailForm.reset();
    resetForm.reset();
    onOpenChange(false);
  };

  const handleBackToSignIn = () => {
    handleClose();
    if (onBackToSignIn) {
      onBackToSignIn();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {step === "email" ? "Forgot Password" : step === "security" ? "Security Questions" : "Password Reset Complete"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {step === "email" 
              ? "Enter your email to retrieve security questions" 
              : step === "security" 
              ? "Answer your security questions to reset your password"
              : "Your password has been reset successfully"
            }
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-0 space-y-4">
            {step === "email" && (
              <>
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Forgot Password?</h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Enter your email address and we'll help you reset your password using your security questions.
                  </div>
                </div>

                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      {...emailForm.register("email")}
                      className={emailForm.formState.errors.email ? "border-red-500" : ""}
                    />
                    {emailForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{emailForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={getSecurityQuestionsMutation.isPending}
                  >
                    {getSecurityQuestionsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting Security Questions...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              </>
            )}

            {step === "security" && securityQuestions && (
              <>
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Key className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Security Questions</h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Please answer your security questions to reset your password.
                  </div>
                </div>

                <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="question1">{securityQuestions[0]}</Label>
                      <Input
                        id="question1"
                        type="text"
                        placeholder="Your answer"
                        {...resetForm.register("question1")}
                        className={resetForm.formState.errors.question1 ? "border-red-500" : ""}
                      />
                      {resetForm.formState.errors.question1 && (
                        <p className="text-sm text-red-500">{resetForm.formState.errors.question1.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="question2">{securityQuestions[1]}</Label>
                      <Input
                        id="question2"
                        type="text"
                        placeholder="Your answer"
                        {...resetForm.register("question2")}
                        className={resetForm.formState.errors.question2 ? "border-red-500" : ""}
                      />
                      {resetForm.formState.errors.question2 && (
                        <p className="text-sm text-red-500">{resetForm.formState.errors.question2.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="question3">{securityQuestions[2]}</Label>
                      <Input
                        id="question3"
                        type="text"
                        placeholder="Your answer"
                        {...resetForm.register("question3")}
                        className={resetForm.formState.errors.question3 ? "border-red-500" : ""}
                      />
                      {resetForm.formState.errors.question3 && (
                        <p className="text-sm text-red-500">{resetForm.formState.errors.question3.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your new password"
                          {...resetForm.register("newPassword")}
                          className={resetForm.formState.errors.newPassword ? "border-red-500 pr-10" : "pr-10"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {resetForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-500">{resetForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("email")}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Email
                  </Button>
                </form>
              </>
            )}

            {step === "success" && (
              <>
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Key className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
                      Password Reset Complete!
                    </h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Your password has been successfully reset. You can now sign in with your new password.
                    </div>
                  </div>
                </div>

                <Button onClick={handleBackToSignIn} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </>
            )}

            {step !== "success" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToSignIn}
                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:underline"
                >
                  Remember your password? Sign in
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}