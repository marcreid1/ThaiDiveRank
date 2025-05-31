import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Vote, DiveSite } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Vote as VoteIcon, TrendingUp, Clock, User, Calendar, Target } from "lucide-react";
import { Link, useLocation } from "wouter";

interface MyVotesResponse {
  message: string;
  votes: Vote[];
}

interface VoteWithSites extends Vote {
  winnerName: string;
  loserName: string;
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation('/');
    return null;
  }
  
  const { data: myVotesData, isLoading: votesLoading } = useQuery({
    queryKey: ["/api/votes/me"],
    queryFn: getQueryFn<MyVotesResponse>({ on401: "returnNull" }),
  });

  const { data: diveSites, isLoading: sitesLoading } = useQuery({
    queryKey: ["/api/dive-sites"],
    queryFn: getQueryFn<DiveSite[]>({ on401: "returnNull" }),
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Votes</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalVotes}</p>
                </div>
                <VoteIcon className="h-8 w-8 text-ocean-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Points Influenced</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalPointsInfluenced}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Average Impact</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{averageImpact}</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Member Since</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <div className="space-y-4 max-h-96 overflow-y-auto">
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
          <Card>
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
                        month: 'short', 
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}