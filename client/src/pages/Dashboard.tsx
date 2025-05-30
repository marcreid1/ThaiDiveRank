import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getQueryFn } from "@/lib/queryClient";
import { Vote } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, User, Vote as VoteIcon } from "lucide-react";

interface MyVotesResponse {
  message: string;
  votes: Vote[];
}

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Fetch user's votes
  const { data: votesData, isLoading: votesLoading } = useQuery({
    queryKey: ["/api/my-votes"],
    queryFn: getQueryFn<MyVotesResponse>({ on401: "throw" }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const votes = votesData?.votes || [];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Welcome back, {user?.email}
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <VoteIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{votes.length}</div>
              <p className="text-xs text-muted-foreground">
                Your voting activity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Since</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Account creation date
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Type</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Standard</div>
              <p className="text-xs text-muted-foreground">
                Voting member
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Votes */}
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Votes</CardTitle>
            <CardDescription>
              History of your dive site preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {votesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : votes.length === 0 ? (
              <div className="text-center py-8">
                <VoteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No votes yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Start voting on dive sites to see your activity here.
                </p>
                <Button>
                  <a href="/">Start Voting</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {votes.slice(0, 10).map((vote) => (
                  <div
                    key={vote.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Vote #{vote.id}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Winner: Site #{vote.winnerId} | Loser: Site #{vote.loserId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        +{vote.pointsChanged} points
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {new Date(vote.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}