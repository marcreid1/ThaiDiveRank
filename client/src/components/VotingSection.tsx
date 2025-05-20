import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DiveSite } from "@shared/schema";
import DiveSiteCard from "./DiveSiteCard";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function VotingSection() {
  // State to track the currently winning dive site and which side it was on
  // Use localStorage to persist between tab navigation
  const [previousWinner, setPreviousWinner] = useState<DiveSite | null>(() => {
    const saved = localStorage.getItem('previousWinner');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [winnerSide, setWinnerSide] = useState<'left' | 'right' | null>(() => {
    return localStorage.getItem('winnerSide') as 'left' | 'right' | null;
  });
  
  const [matchedDiveSites, setMatchedDiveSites] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('matchedDiveSites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  // Query to get matchups, including the previous winner when available
  const { data: fetchedMatchup, isLoading, isError, error } = useQuery<{
    diveSiteA: DiveSite;
    diveSiteB: DiveSite;
  }>({
    queryKey: ["/api/matchup", previousWinner?.id],
    queryFn: async ({ queryKey }) => {
      const winnerId = queryKey[1];
      const url = winnerId
        ? `/api/matchup?winnerId=${winnerId}`
        : '/api/matchup';
      
      return await fetch(url).then(res => {
        if (!res.ok) throw new Error('Failed to fetch matchup');
        return res.json();
      });
    }
  });
  
  // Create the final matchup to display
  let matchup = fetchedMatchup;
  
  // If we have a previous winner and the fetched matchup data
  if (previousWinner && fetchedMatchup && winnerSide) {
    // Check if our previous winner is in the current matchup
    const winnerIsInMatchup = 
      fetchedMatchup.diveSiteA.id === previousWinner.id || 
      fetchedMatchup.diveSiteB.id === previousWinner.id;
      
    if (!winnerIsInMatchup) {
      // If the winner isn't in the matchup, place it on the appropriate side
      if (winnerSide === 'left') {
        matchup = {
          diveSiteA: previousWinner,
          diveSiteB: fetchedMatchup.diveSiteB
        };
      } else {
        matchup = {
          diveSiteA: fetchedMatchup.diveSiteA,
          diveSiteB: previousWinner
        };
      }
    } else {
      // The winner is in the matchup, but might be on the wrong side
      const isOnCorrectSide = 
        (winnerSide === 'left' && fetchedMatchup.diveSiteA.id === previousWinner.id) ||
        (winnerSide === 'right' && fetchedMatchup.diveSiteB.id === previousWinner.id);
        
      // If the winner is on the wrong side, swap the positions
      if (!isOnCorrectSide) {
        matchup = {
          diveSiteA: fetchedMatchup.diveSiteB,
          diveSiteB: fetchedMatchup.diveSiteA
        };
      }
    }
  }

  const voteMutation = useMutation({
    mutationFn: async ({ winnerId, loserId }: { winnerId: number, loserId: number }) => {
      await apiRequest("POST", "/api/vote", { winnerId, loserId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matchup"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    }
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/skip");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matchup"] });
    }
  });

  const handleVoteLeft = (winner: DiveSite, loser: DiveSite) => {
    // Store the winner from the left side
    setPreviousWinner(winner);
    localStorage.setItem('previousWinner', JSON.stringify(winner));
    
    setWinnerSide('left');
    localStorage.setItem('winnerSide', 'left');
    
    // Track that we've matched this winner against this loser
    const updatedMatchedSites = new Set(matchedDiveSites);
    updatedMatchedSites.add(loser.id);
    setMatchedDiveSites(updatedMatchedSites);
    localStorage.setItem('matchedDiveSites', JSON.stringify([...updatedMatchedSites]));
    
    voteMutation.mutate({ 
      winnerId: winner.id, 
      loserId: loser.id 
    });
  };
  
  const handleVoteRight = (winner: DiveSite, loser: DiveSite) => {
    // Store the winner from the right side
    setPreviousWinner(winner);
    localStorage.setItem('previousWinner', JSON.stringify(winner));
    
    setWinnerSide('right');
    localStorage.setItem('winnerSide', 'right');
    
    // Track that we've matched this winner against this loser
    const updatedMatchedSites = new Set(matchedDiveSites);
    updatedMatchedSites.add(loser.id);
    setMatchedDiveSites(updatedMatchedSites);
    localStorage.setItem('matchedDiveSites', JSON.stringify([...updatedMatchedSites]));
    
    voteMutation.mutate({ 
      winnerId: winner.id, 
      loserId: loser.id 
    });
  };

  const handleSkip = () => {
    // Reset all tracking when skipping
    setPreviousWinner(null);
    setWinnerSide(null);
    setMatchedDiveSites(new Set());
    
    // Clear localStorage items
    localStorage.removeItem('previousWinner');
    localStorage.removeItem('winnerSide');
    localStorage.removeItem('matchedDiveSites');
    
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

            <div className="relative">
              <div className="vs-badge">
                <div className="bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-full h-12 w-12 flex items-center justify-center text-lg">
                  VS
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-28 md:gap-24 relative">
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

  const { diveSiteA, diveSiteB } = matchup!;

  return (
    <div className="mb-12">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Which Dive Site is Better?
          </h2>

          <div className="relative">
            {/* VS Badge */}
            <div className="vs-badge absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-full h-12 w-12 flex items-center justify-center text-lg">
                VS
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-28 md:gap-24 relative">
              <DiveSiteCard 
                diveSite={diveSiteA} 
                onVote={() => handleVoteLeft(diveSiteA, diveSiteB)}
                showViewButton={false}
              />

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
    </div>
  );
}