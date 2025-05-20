import { useQuery } from "@tanstack/react-query";
import { VoteActivity } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "@/lib/utils/formatDate";

export default function RecentActivity() {
  const { data: activities, isLoading, isError } = useQuery<VoteActivity[]>({
    queryKey: ["/api/activities"]
  });

  if (isLoading) {
    return (
      <div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Recent Activity
            </h2>
          </div>
          <div className="px-6 py-4">
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {[1, 2, 3, 4].map((item) => (
                <li key={item} className="py-4 first:pt-0 last:pb-0">
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
        </div>
      </div>
    );
  }

  if (isError || !activities) {
    return (
      <div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Recent Activity
            </h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-slate-500 dark:text-slate-400">Failed to load recent activity</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Recent Activity
          </h2>
        </div>
        <div className="px-6 py-4">
          {activities.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No activity yet</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {activities.map((activity) => (
                <li key={activity.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex space-x-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900 dark:text-slate-200">
                        <span className="font-medium text-ocean-600 dark:text-ocean-400">{activity.winnerName}</span>
                        {' '}won against{' '}
                        <span className="font-medium">{activity.loserName}</span>
                        {' '}(+{activity.pointsChanged} points)
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(activity.timestamp))} ago
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}