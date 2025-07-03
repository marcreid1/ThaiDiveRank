import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { setToken } from "@/lib/auth";
import SecuritySetupDialog from "@/components/SecuritySetupDialog";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  confirmPassword: z.string().min(8, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
  onClose?: () => void;
}

export function SignUpForm({ onSuccess, onSwitchToSignIn, onClose }: SignUpFormProps) {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpFormData) => {
      const response = await apiRequest("POST", "/api/signup", {
        email: data.email,
        password: data.password,
      });
      return await response.json() as { token: string; user: { id: string; email: string; createdAt: string } };
    },
    onSuccess: (result) => {
      // Store JWT using auth helper
      setToken(result.token);
      
      // Set user data immediately in cache to prevent UI flickering
      queryClient.setQueryData(["/api/auth/me"], result.user);
      
      // Also refetch to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Account created successfully!",
        description: "Please set up your security questions to secure your account.",
      });

      reset();
      
      // Show security dialog instead of finishing signup
      setShowSecurityDialog(true);
    },
    onError: (error: any) => {
      console.error("Signup error - full object:", error);
      console.error("Error message:", error.message);
      console.error("Error errors:", error.errors);
      console.error("Error keys:", Object.keys(error));
      
      let errorMessage = "Something went wrong. Please try again.";
      
      // Handle validation errors from the API
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((err: any) => err.message).join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: errorMessage,
      });
    },
  });

  const onSubmit = (data: SignUpFormData) => {
    signUpMutation.mutate(data);
  };

  const handleSecuritySetupComplete = () => {
    setShowSecurityDialog(false);
    
    toast({
      title: "Security questions saved!",
      description: "Your account is now secure. Welcome to DiveRank!",
    });

    if (onSuccess) {
      onSuccess();
    } else {
      // Redirect to home page
      setLocation("/");
    }
  };

  return (
    <>
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        <p className="text-center text-muted-foreground">
          Join DiveRank to vote on your favorite dive sites
        </p>
      </div>
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
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
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters with one lowercase, one uppercase, and one number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={signUpMutation.isPending}>
            {signUpMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing Up...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        {onSwitchToSignIn && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Experiencing issues?{" "}
            <Link 
              href="/contact" 
              className="text-primary hover:underline"
              onClick={onClose}
            >
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
    
    <SecuritySetupDialog 
      open={showSecurityDialog} 
      onComplete={handleSecuritySetupComplete}
    />
    </>
  );
}