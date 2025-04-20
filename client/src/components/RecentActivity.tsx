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
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-lg font-medium text-slate-900">
              Recent Activity
            </h2>
          </div>
          <div className="px-6 py-4">
            <ul className="divide-y divide-slate-200">
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
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-lg font-medium text-slate-900">
              Recent Activity
            </h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-red-500">Failed to load activities</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ocean-600 hover:bg-ocean-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-900">
            Recent Activity
          </h2>
        </div>
        <div className="px-6 py-4">
          <ul className="divide-y divide-slate-200">
            {activities.map((activity) => (
              <li key={activity.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-ocean-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ocean-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800">
                      <a href="#" className="font-medium text-ocean-600 hover:underline">{activity.winnerName}</a> 
                      won against 
                      <a href="#" className="font-medium text-ocean-600 hover:underline"> {activity.loserName}</a>
                    </p>
                    <div className="mt-1 flex items-center">
                      <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(activity.timestamp))} ago</span>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        +{activity.pointsChanged} points
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <a href="#activities" className="text-sm font-medium text-ocean-600 hover:text-ocean-500">
            View all activity
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
