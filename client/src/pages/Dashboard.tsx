import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Vote, DiveSite } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Vote as VoteIcon, TrendingUp, Clock, User, Calendar, Target, Trash2, UserX, RotateCcw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { TooltipHelp } from "@/components/ui/tooltip-help";

interface MyVotesResponse {
  message: string;
  votes: Vote[];
  uniqueMatchups: number;
  totalPossibleMatchups: number;
}

interface VoteWithSites extends Vote {
  winnerName: string;
  loserName: string;
}

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [resetVotesDialogOpen, setResetVotesDialogOpen] = useState(false);

  const { data: myVotesData, isLoading: votesLoading } = useQuery({
    queryKey: ["/api/my-votes", user?.id],
    queryFn: getQueryFn<MyVotesResponse>({ on401: "returnNull" }),
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: diveSites, isLoading: sitesLoading } = useQuery({
    queryKey: ["/api/dive-sites"],
    queryFn: getQueryFn<DiveSite[]>({ on401: "returnNull" }),
    enabled: isAuthenticated,
  });

  // Account deactivation mutation
  const deactivateAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/account/deactivate");
    },
    onSuccess: () => {
      toast({
        title: "Account deactivated successfully",
        description: "Your account has been deactivated. You can reactivate it by signing in again.",
      });
      logout();
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to deactivate account",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  // Account deletion mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/account");
    },
    onSuccess: () => {
      toast({
        title: "Account deleted successfully",
        description: "Your account and voting history have been permanently removed.",
      });
      logout();
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete account",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  // Reset all votes mutation
  const resetVotesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/votes/reset");
    },
    onSuccess: () => {
      toast({
        title: "Votes reset successfully",
        description: "All your voting history has been cleared.",
      });
      // Clear champion state from localStorage
      localStorage.removeItem('diverank-champion');
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/my-votes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matchup"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reset votes",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleDeactivateAccount = () => {
    deactivateAccountMutation.mutate();
    setDeactivateDialogOpen(false);
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
    setDeleteDialogOpen(false);
  };

  const handleResetVotes = () => {
    resetVotesMutation.mutate();
    setResetVotesDialogOpen(false);
  };

  // Redirect if not authenticated using useEffect to avoid render issues
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  // Return early if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (votesLoading || sitesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 bg-slate-200 animate-pulse rounded mb-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const votes = myVotesData?.votes || [];
  const sites = diveSites || [];
  const uniqueMatchups = myVotesData?.uniqueMatchups || 0;
  const totalPossibleMatchups = myVotesData?.totalPossibleMatchups || 903;
  
  // Create a map of site IDs to names for quick lookup
  const siteMap = sites.reduce((acc, site) => {
    acc[site.id] = site.name;
    return acc;
  }, {} as Record<number, string>);

  // Enhance votes with site names
  const votesWithSites: VoteWithSites[] = votes.map(vote => ({
    ...vote,
    winnerName: siteMap[vote.winnerId] || `Site #${vote.winnerId}`,
    loserName: siteMap[vote.loserId] || `Site #${vote.loserId}`
  }));

  const totalVotes = votes.length;
  const totalPointsInfluenced = votes.reduce((sum, vote) => sum + Math.abs(vote.pointsChanged), 0);
  const averageImpact = totalVotes > 0 ? Math.round(totalPointsInfluenced / totalVotes) : 0;
  const memberSince = user?.createdAt ? new Date(user.createdAt) : new Date();
  const lastVoteDate = votes.length > 0 ? new Date(votes[0].timestamp) : null;

  // Calculate champion dive site (most voted for)
  const championData = votes.reduce((acc, vote) => {
    acc[vote.winnerId] = (acc[vote.winnerId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const championSiteId = Object.entries(championData).reduce((maxEntry, current) => 
    current[1] > maxEntry[1] ? current : maxEntry, ['0', 0])[0];
  
  const championSite = sites.find(site => site.id === parseInt(championSiteId));
  const championVoteCount = championData[parseInt(championSiteId)] || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Track your voting activity and impact on dive site rankings
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">Unique Matchups</p>
                <TooltipHelp 
                  title="Unique Matchups"
                  description="The number of different dive site pairs you've voted on out of 903 total possible combinations. Each unique pair counts once toward your completion progress."
                />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {uniqueMatchups}<span className="text-lg text-slate-500">/{totalPossibleMatchups}</span>
              </p>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(uniqueMatchups / totalPossibleMatchups) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {((uniqueMatchups / totalPossibleMatchups) * 100).toFixed(1)}% complete
              </p>
              <div className="flex items-center justify-center gap-3">
                <Target className="h-8 w-8 text-blue-500" />
                <AlertDialog open={resetVotesDialogOpen} onOpenChange={setResetVotesDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      disabled={uniqueMatchups === 0}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset All Votes</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your voting history ({uniqueMatchups} unique matchups). 
                        Your account will remain active, but you'll start fresh with voting. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetVotes}
                        className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                        disabled={resetVotesMutation.isPending}
                      >
                        {resetVotesMutation.isPending ? "Resetting..." : "Reset All Votes"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">Points Influenced</p>
                <TooltipHelp 
                  title="Points Influenced"
                  description="The cumulative impact of all your votes on dive site rankings. Higher numbers indicate greater influence on the overall ranking system."
                />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-8">{totalPointsInfluenced}</p>
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">Average Impact</p>
                <TooltipHelp 
                  title="Average Impact"
                  description="The typical ELO influence per vote on rankings. Higher values suggest you often vote on matchups between dive sites with very different ratings."
                />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-8">{averageImpact}</p>
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto" />
            </CardContent>
          </Card>


        </div>

        {/* Champion Dive Site Section */}
        {championSite && championVoteCount > 0 && (
          <Card className="mb-8 border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <Trophy className="h-6 w-6" />
                Your Champion Dive Site
              </CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                The dive site you've voted for most often - your personal favorite
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                    {championSite.name}
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                    📍 {championSite.location}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-yellow-600 dark:text-yellow-400">
                    <span className="flex items-center gap-1">
                      <VoteIcon className="h-4 w-4" />
                      Voted for {championVoteCount} time{championVoteCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Current Rating: {Math.round(championSite.rating)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-yellow-200 dark:bg-yellow-700 rounded-full flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-300" />
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                    Champion
                  </Badge>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-700">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  {championSite.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Recent Voting Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-ocean-500" />
                Recent Voting Activity
              </CardTitle>
              <CardDescription>
                Your latest votes and their impact on rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {votesWithSites.length === 0 ? (
                <div className="text-center py-8">
                  <VoteIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    You haven't cast any votes yet
                  </p>
                  <Button asChild>
                    <Link href="/">Start Voting</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 h-[520px] overflow-y-auto">
                  {votesWithSites.slice(0, 8).map((vote) => (
                    <div key={vote.id} className="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{vote.winnerName}</span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          defeated {vote.loserName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(vote.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      <Badge variant={vote.pointsChanged > 0 ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                        {vote.pointsChanged > 0 ? '+' : ''}{vote.pointsChanged} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-ocean-500" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</span>
                <span className="text-sm text-slate-900 dark:text-white">{user?.email}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Member Since</span>
                <span className="text-sm text-slate-900 dark:text-white">
                  {memberSince.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Last Vote</span>
                <span className="text-sm text-slate-900 dark:text-white">
                  {lastVoteDate 
                    ? lastVoteDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'No votes yet'
                  }
                </span>
              </div>

              <div className="pt-4">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/">
                      <VoteIcon className="h-4 w-4 mr-2" />
                      Continue Voting
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/rankings">
                      <Trophy className="h-4 w-4 mr-2" />
                      View Rankings
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/dive-sites">
                      <Target className="h-4 w-4 mr-2" />
                      Browse Dive Sites
                    </Link>
                  </Button>
                </div>
                
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Account Management</h4>
                  <div className="space-y-2">
                    {/* Deactivate Account */}
                    <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950">
                          <UserX className="h-4 w-4 mr-2" />
                          Deactivate Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will temporarily deactivate your account. Your voting history will be preserved, 
                            and you can reactivate your account at any time by simply signing in again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeactivateAccount}
                            disabled={deactivateAccountMutation.isPending}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            {deactivateAccountMutation.isPending ? "Deactivating..." : "Deactivate Account"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Delete Account */}
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full justify-start">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Permanently Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Permanently Delete Account</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>
                              <strong>This action cannot be undone.</strong> Your account and all voting history 
                              will be permanently removed from our system.
                            </p>
                            <p className="text-sm">
                              Consider deactivating your account instead if you might want to return later.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={deleteAccountMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleteAccountMutation.isPending ? "Deleting..." : "Permanently Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}