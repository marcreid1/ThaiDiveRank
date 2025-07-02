import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DiveSite } from "@shared/schema";
import DiveSiteCard from "./DiveSiteCard";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useToast } from "@/hooks/use-toast";

export default function VotingSection() {
  const { isAuthenticated, login } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { toast } = useToast();

  // Track the current champion and which side they're on
  const [champion, setChampion] = useState<{ diveSite: DiveSite, side: 'A' | 'B' } | null>(null);

  // Get matchup data with champion preferences
  const { data: matchup, isLoading, isError, error, refetch } = useQuery<{
    diveSiteA?: DiveSite;
    diveSiteB?: DiveSite;
    completed?: boolean;
    message?: string;
    totalMatchups?: number;
  }>({
    queryKey: ["/api/matchup", champion?.diveSite.id, champion?.side],
    queryFn: async () => {
      let url = '/api/matchup';
      if (champion) {
        url += `?winnerId=${champion.diveSite.id}&winnerSide=${champion.side}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch matchup');
      return response.json();
    }
  });

  // Submit vote and update champion
  const voteMutation = useMutation({
    mutationFn: async ({ winnerId, loserId }: { winnerId: number, loserId: number }) => {
      await apiRequest("POST", "/api/vote", { winnerId, loserId });
    },
    onSuccess: () => {
      // Invalidate other queries but not matchup yet - we'll handle that manually
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-votes"] });
      
      toast({
        title: "Vote recorded!",
        description: "Your vote has been successfully counted.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Vote failed",
        description: error.message || "Unable to record your vote. Please try again.",
      });
    }
  });

  // Skip current matchup
  const skipMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/skip");
    },
    onSuccess: () => {
      setChampion(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Skip failed",
        description: error.message || "Unable to skip this matchup. Please try again.",
      });
    }
  });

  // Handle voting for a dive site
  const handleVote = (winner: DiveSite, loser: DiveSite, side: 'A' | 'B') => {
    // Open sign-in dialog if user is not authenticated
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
      return;
    }

    // Submit vote
    voteMutation.mutate({ 
      winnerId: winner.id, 
      loserId: loser.id 
    });

    // Update champion state and refetch with new parameters
    setChampion({ diveSite: winner, side });
    refetch();
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
  };

  const handleVoteLeft = (winner: DiveSite, loser: DiveSite) => handleVote(winner, loser, 'A');
  const handleVoteRight = (winner: DiveSite, loser: DiveSite) => handleVote(winner, loser, 'B');

  const handleSkip = () => {
    setChampion(null);
    skipMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Which dive site would you rather visit?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20 relative">
              {/* VS Badge for loading state */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex">
                <div className="bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-full h-12 w-12 flex items-center justify-center text-lg">
                  VS
                </div>
              </div>

              <div className="dive-card relative bg-white dark:bg-slate-800 border-2 border-ocean-200 dark:border-slate-700 rounded-xl overflow-hidden card-shadow">
                <div className="relative h-48 sm:h-64 bg-ocean-100 dark:bg-slate-700">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-10 w-full mt-6" />
                </div>
              </div>

              {/* VS Badge for mobile view */}
              <div className="flex md:hidden justify-center my-6">
                <div className="bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-full h-12 w-12 flex items-center justify-center text-lg">
                  VS
                </div>
              </div>

              <div className="dive-card relative bg-white dark:bg-slate-800 border-2 border-ocean-200 dark:border-slate-700 rounded-xl overflow-hidden card-shadow">
                <div className="relative h-48 sm:h-64 bg-ocean-100 dark:bg-slate-700">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-10 w-full mt-6" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mb-12">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Error loading matchup
            </h2>
            <p className="text-red-500 dark:text-red-400 mb-4">{(error as Error)?.message || "Failed to load dive sites"}</p>
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/matchup"] })}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ocean-600 hover:bg-ocean-700 dark:bg-ocean-700 dark:hover:bg-ocean-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle completion scenario
  if (matchup?.completed) {
    return (
      <div className="mb-12">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Congratulations!
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
              {matchup.message}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              You've completed all {matchup.totalMatchups} possible unique matchups!
            </p>
            <button 
              onClick={() => {
                setChampion(null);
                queryClient.invalidateQueries({ queryKey: ["/api/matchup"] });
              }}
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-ocean-600 hover:bg-ocean-700 dark:bg-ocean-700 dark:hover:bg-ocean-600"
            >
              View Final Rankings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ensure we have valid dive sites before rendering
  if (!matchup?.diveSiteA || !matchup?.diveSiteB) {
    return (
      <div className="mb-12">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              No matchup available
            </h2>
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/matchup"] })}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ocean-600 hover:bg-ocean-700 dark:bg-ocean-700 dark:hover:bg-ocean-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { diveSiteA, diveSiteB } = matchup;

  return (
    <div className="mb-12">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Pick Your Dream Dive Sites!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20 relative">
            {/* VS Badge for desktop view - absolutely positioned */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex">
              <div className="bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-full h-12 w-12 flex items-center justify-center text-lg shadow-lg">
                VS
              </div>
            </div>

            <div>
              <DiveSiteCard 
                diveSite={diveSiteA} 
                onVote={() => handleVoteLeft(diveSiteA, diveSiteB)}
                showViewButton={false}
              />
            </div>

            {/* VS Badge for mobile view */}
            <div className="flex md:hidden justify-center my-6">
              <div className="bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-full h-12 w-12 flex items-center justify-center text-lg shadow-lg">
                VS
              </div>
            </div>

            <div>
              <DiveSiteCard 
                diveSite={diveSiteB} 
                onVote={() => handleVoteRight(diveSiteB, diveSiteA)}
                showViewButton={false}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              type="button" 
              className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-500 dark:focus:ring-offset-slate-900"
              onClick={handleSkip}
              disabled={skipMutation.isPending}
            >
              {skipMutation.isPending ? "Skipping..." : "Skip"}
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        defaultMode="signin"
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}