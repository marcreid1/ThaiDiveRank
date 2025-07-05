import { useQuery } from "@tanstack/react-query";
import { VoteActivity } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "@/lib/utils/formatDate";

export default function RecentActivity() {
  const { data: activities, isLoading, isError } = useQuery<VoteActivity[]>({
    queryKey: ["/api/activities"]
  });

  // Common card header component
  const CardHeader = () => (
    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
        Recent Activity
      </h2>
    </div>
  );

  // Card container for all states
  const CardContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
      <CardHeader />
      {children}
    </div>
  );

  if (isLoading) {
    return (
      <CardContainer>
        <div className="px-6 py-4">
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="py-4 first:pt-0 last:pb-0">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContainer>
    );
  }

  if (isError || !activities) {
    return (
      <CardContainer>
        <div className="p-6 text-center">
          <p className="text-slate-500 dark:text-slate-400">Failed to load recent activity</p>
        </div>
      </CardContainer>
    );
  }

  return (
    <CardContainer>
      <div className="px-6 py-4">
        {activities.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-4">No activity yet</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {activities.map((activity) => (
              <li key={activity.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex space-x-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-ocean-600 dark:text-ocean-400">{activity.username}</span>
                      {' '}voted{' '}
                      <span className="font-medium text-slate-900 dark:text-white">{activity.winnerName}</span>
                      {' '}over{' '}
                      <span className="font-medium text-slate-900 dark:text-white">{activity.loserName}</span>
                      {' '}(+{activity.pointsChanged} points)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(activity.timestamp))}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CardContainer>
  );
}