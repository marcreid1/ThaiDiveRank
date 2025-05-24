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
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);

  // Load user votes from localStorage
  useEffect(() => {
    const storedVotes = localStorage.getItem('user_votes');
    if (storedVotes) {
      try {
        setUserVotes(JSON.parse(storedVotes));
      } catch {
        setUserVotes([]);
      }
    }
  }, []);

  const { data: userStats, isLoading } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  if (!isAuthenticated || !user) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading your profile...</p>
        </div>
      </main>
    );
  }

  const stats: UserStats = userStats || {
    totalVotes: 0,
    favoriteWinner: "None yet", 
    recentVotes: []
  };

  // Calculate user's favorite winner from their voting history
  const calculateFavoriteWinner = (votes: UserVote[]) => {
    if (votes.length === 0) return "None yet";
    
    const winnerCounts = new Map<string, number>();
    votes.forEach(vote => {
      const count = winnerCounts.get(vote.winnerName) || 0;
      winnerCounts.set(vote.winnerName, count + 1);
    });
    
    let maxVotes = 0;
    let favoriteWinner = "None yet";
    for (const [winner, count] of winnerCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        favoriteWinner = winner;
      }
    }
    
    return favoriteWinner;
  };

  // Merge user's personal votes with community stats
  const personalStats = {
    ...stats,
    totalVotes: userVotes.length,
    favoriteWinner: calculateFavoriteWinner(userVotes),
    recentVotes: userVotes.slice(0, 10)
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Welcome back, {user.username}!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Here's your diving vote activity and stats
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              {stats.favoriteWinner}
            </div>
            <p className="text-xs text-muted-foreground">
              Most voted dive site
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Votes */}
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
              {personalStats.recentVotes.map((vote) => (
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
    </main>
  );
}