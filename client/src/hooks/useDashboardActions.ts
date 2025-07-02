import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export function useDashboardActions() {
  const { toast } = useToast();
  const { logout, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const showErrorToast = (title: string, error: any) => {
    toast({
      title,
      description: error.message || "Please try again or contact support.",
      variant: "destructive",
    });
  };

  const showSuccessToast = (title: string, description: string) => {
    toast({
      title,
      description,
    });
  };

  const handleAuthLogout = () => {
    logout();
    setLocation('/');
  };

  const invalidateUserQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/my-votes", user?.id] });
  };

  const deactivateAccount = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/account/deactivate");
    },
    onSuccess: () => {
      showSuccessToast(
        "Account deactivated successfully",
        "Your account has been deactivated. You can reactivate it by signing in again."
      );
      handleAuthLogout();
    },
    onError: (error: any) => {
      showErrorToast("Failed to deactivate account", error);
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/account");
    },
    onSuccess: () => {
      showSuccessToast(
        "Account deleted successfully",
        "Your account and voting history have been permanently removed."
      );
      handleAuthLogout();
    },
    onError: (error: any) => {
      showErrorToast("Failed to delete account", error);
    },
  });

  const resetVotes = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/votes/reset");
    },
    onSuccess: () => {
      showSuccessToast(
        "Votes reset successfully", 
        "All your voting history has been cleared. You can start fresh!"
      );
      invalidateUserQueries();
    },
    onError: (error: any) => {
      showErrorToast("Failed to reset votes", error);
    },
  });

  return {
    deactivateAccount,
    deleteAccount,
    resetVotes,
    showErrorToast,
    showSuccessToast,
  };
}