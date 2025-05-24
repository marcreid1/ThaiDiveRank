import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Calendar, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils/formatDate";
import { useState, useEffect } from "react";

interface UserVote {
  id: number;
  winnerName: string;
  loserName: string;
  pointsChanged: number;
  timestamp: string;
}

interface UserStats {
  totalVotes: number;
  favoriteWinner: string;
  recentVotes: UserVote[];
}

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  // Remove localStorage dependency - votes now come from database via userStats

  const { data: userStats, isLoading } = useQuery({
    queryKey: ["/api/user/stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/user/stats?userId=${user.id}`);
      return response.json();
    },
  });

  if (!isAuthenticated || !user) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Please sign in to view your profile
          </h1>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading your profile...</p>
        </div>
      </main>
    );
  }

  const stats: UserStats = {
    totalVotes: userStats?.totalVotes || 0,
    favoriteWinner: userStats?.favoriteWinner || "None yet",
    recentVotes: userStats?.recentVotes || []
  };



  // Use stats directly from database
  const personalStats = stats;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Welcome back, {user.username}!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Here's your diving vote activity and stats
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Voting Activity - Left Side (2/3 width) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Voting Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your recent dive site comparisons
              </p>
            </CardHeader>
            <CardContent>
              {personalStats.recentVotes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400">
                    No votes yet! Start voting to see your activity here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {personalStats.recentVotes.map((vote: UserVote) => (
                    <div key={vote.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {vote.winnerName}
                          </span>
                          <span className="text-slate-500">vs</span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {vote.loserName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Badge variant="secondary" className="text-xs">
                            +{vote.pointsChanged} points
                          </Badge>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(vote.timestamp))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards - Right Side (1/3 width, stacked) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{personalStats.totalVotes}</div>
              <p className="text-xs text-muted-foreground">
                Dive site comparisons made
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voting Impact</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">
                Contributing to rankings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Winner</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ocean-600 dark:text-ocean-400">
                {personalStats.favoriteWinner}
              </div>
              <p className="text-xs text-muted-foreground">
                Most voted dive site
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}