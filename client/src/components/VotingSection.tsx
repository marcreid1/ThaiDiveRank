import { useQuery, useMutation } from "@tanstack/react-query";
import { DiveSite } from "@shared/schema";
import DiveSiteCard from "./DiveSiteCard";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function VotingSection() {
  // Query to get matchups
  const { data: matchupData, isLoading, isError, error } = useQuery<{
    diveSiteA?: DiveSite;
    diveSiteB?: DiveSite;
    completed?: boolean;
    message?: string;
  }>({
    queryKey: ["/api/matchup"],
    queryFn: async () => {
      return await fetch('/api/matchup').then(res => {
        if (!res.ok) throw new Error('Failed to fetch matchup');
        return res.json();
      });
    }
  });

  const voteMutation = useMutation({
    mutationFn: apiRequest,
    onSuccess: (data: any) => {
      // Refetch new matchup and related data
      queryClient.invalidateQueries({ queryKey: ["/api/matchup"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error) => {
      console.error("Vote failed:", error);
    }
  });

  const handleVote = (winner: DiveSite, loser: DiveSite, side: 'left' | 'right') => {
    voteMutation.mutate({
      url: '/api/vote',
      method: 'POST',
      body: {
        winnerId: winner.id,
        loserId: loser.id
      }
    });
  };

  const handleVoteLeft = (winner: DiveSite, loser: DiveSite) => handleVote(winner, loser, 'left');
  const handleVoteRight = (winner: DiveSite, loser: DiveSite) => handleVote(winner, loser, 'right');

  // Check if all matchups are completed
  if (matchupData?.completed) {
    return (
      <section className="bg-gradient-to-br from-ocean-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Voting Complete! 🎉
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              {matchupData.message || "All dive site comparisons have been completed!"}
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg max-w-md mx-auto">
              <p className="text-slate-700 dark:text-slate-300">
                Thank you for participating in ranking all the dive sites! 
                Check out the final rankings to see how your votes shaped the results.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="bg-gradient-to-br from-ocean-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Compare Dive Sites
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Vote for your preferred dive site in each matchup
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="bg-gradient-to-br from-ocean-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Error Loading Matchup
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              {error instanceof Error ? error.message : "Failed to load dive site matchup"}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { diveSiteA, diveSiteB } = matchupData || {};

  if (!diveSiteA || !diveSiteB) {
    return (
      <section className="bg-gradient-to-br from-ocean-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              No Matchup Available
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              No dive site matchup is currently available
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-ocean-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Compare Dive Sites
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Vote for your preferred dive site in this matchup
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <DiveSiteCard 
            diveSite={diveSiteA} 
            onVote={() => handleVoteLeft(diveSiteA, diveSiteB)}
          />
          <DiveSiteCard 
            diveSite={diveSiteB} 
            onVote={() => handleVoteRight(diveSiteB, diveSiteA)}
          />
        </div>
        
        {voteMutation.isPending && (
          <div className="text-center mt-8">
            <p className="text-slate-600 dark:text-slate-300">
              Processing your vote...
            </p>
          </div>
        )}
      </div>
    </section>
  );
}