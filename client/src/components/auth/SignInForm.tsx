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
import { setToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
  onClose?: () => void;
}

export function SignInForm({ onSuccess, onSwitchToSignUp, onClose }: SignInFormProps) {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const signInMutation = useMutation({
    mutationFn: async (data: SignInFormData) => {
      const response = await apiRequest("POST", "/api/signin", {
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
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      reset();
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Small delay to ensure state updates before navigation
        setTimeout(() => {
          setLocation("/");
        }, 100);
      }
    },
    onError: (error: any) => {
      console.error("Signin error:", error);
      
      let errorMessage = "Invalid email or password.";
      
      // Handle validation errors from the API
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((err: any) => err.message).join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: errorMessage,
      });
    },
  });

  const onSubmit = (data: SignInFormData) => {
    signInMutation.mutate(data);
  };

  return (
    <>
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl font-bold text-center">Sign In</h2>
        <p className="text-center text-muted-foreground">
          Welcome back! Sign in to vote on dive sites
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
          </div>

          <Button type="submit" className="w-full" disabled={signInMutation.isPending}>
            {signInMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-primary hover:underline"
          >
            Forgot your password?
          </button>
        </div>

        {onSwitchToSignUp && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-primary hover:underline font-medium"
              >
                Sign up
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
    
    <ForgotPasswordDialog 
      open={showForgotPassword}
      onOpenChange={setShowForgotPassword}
      onBackToSignIn={() => setShowForgotPassword(false)}
    />
    </>
  );
}