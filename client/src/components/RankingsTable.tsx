import { useQuery } from "@tanstack/react-query";
import { DiveSiteRanking } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils/formatDate";
import { Link } from "wouter";
import { getDiveSiteImage } from "@/lib/utils/getImage";

export default function RankingsTable() {
  const { data: rankingsData, isLoading, isError } = useQuery<{ 
    rankings: DiveSiteRanking[],
    lastUpdated: string 
  }>({
    queryKey: ["/api/rankings"]
  });

  if (isLoading) {
    return (
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Rank
            </h2>
            <Skeleton className="h-6 w-36" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Dive Site
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {[1, 2, 3, 4].map((item) => (
                  <tr key={item} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                      <Skeleton className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                          <Skeleton className="h-10 w-10" />
                        </div>
                        <div className="ml-4">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      <Skeleton className="h-4 w-8" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !rankingsData) {
    return (
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Rank
            </h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-red-500 dark:text-red-400">Failed to load rankings</p>
            <span 
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ocean-600 hover:bg-ocean-700 dark:bg-ocean-700 dark:hover:bg-ocean-600 cursor-pointer"
            >
              Try Again
            </span>
          </div>
        </div>
      </div>
    );
  }

  const { rankings, lastUpdated } = rankingsData;

  return (
    <div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-3 min-w-0">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
              Top 10 Dive Sites
            </h2>
            <Badge variant="ocean" className="px-3 text-xs shrink-0 max-w-[150px] break-words">
              Updated {formatDistanceToNow(new Date(lastUpdated))} ago
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dive Site
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Score
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {rankings.slice(0, 10).map((site, index) => (
                <tr key={site.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200 text-center">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">
                    <Link href={`/dive-sites?site=${site.id}`} className="flex items-center hover:opacity-80 transition-opacity">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                        <img src={getDiveSiteImage(site.name)} alt={site.name} className="h-10 w-10 object-cover" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{site.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{site.location}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 text-center">
                    {Math.round(site.rating)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 text-center">
                    {site.rankChange > 0 ? (
                      <Badge variant="green" className="inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        {site.rankChange}
                      </Badge>
                    ) : site.rankChange < 0 ? (
                      <Badge variant="red" className="inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v3.586l-4.293-4.293a1 1 0 00-1.414 0L8 10.586 3.707 6.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 10.414 14.586 14H12z" clipRule="evenodd" />
                        </svg>
                        {Math.abs(site.rankChange)}
                      </Badge>
                    ) : (
                      <Badge variant="neutral">
                        —
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <a 
            href="/rankings" 
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/rankings";
              window.scrollTo(0, 0);
            }}
            className="text-sm font-medium text-ocean-600 hover:text-ocean-500 dark:text-ocean-400 dark:hover:text-ocean-300"
          >
            View all rankings
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}