
import { DiveSite } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getDiveSiteImage } from "@/lib/utils/getImage";

interface DiveSiteCardProps {
  diveSite: DiveSite;
  rank?: number;
  onVote: () => void;
  showViewButton?: boolean;
}

export default function DiveSiteCard({ diveSite, rank, onVote, showViewButton = false }: DiveSiteCardProps) {
  return (
    <div className="dive-card relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:translate-y-[-4px] hover:shadow-lg">
      <div className="relative h-48 sm:h-64 bg-ocean-100 dark:bg-slate-700">
        <img 
          src={getDiveSiteImage(diveSite.name)} 
          alt={diveSite.name} 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4">
        <div className="mb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-baseline gap-2">
              <h3 className="font-semibold text-ocean-900 dark:text-white text-lg">{diveSite.name}</h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">• {diveSite.location}</span>
            </div>
            <div className="flex flex-shrink-0">
              {diveSite.types.map((type, index) => (
                <span key={index} className="inline-block px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {type}
                </span>
              ))}
            </div>
          </div>
          {rank && (
            <div className="flex-shrink-0 ml-2">
              <Badge variant="ocean">
                #{rank}
              </Badge>
            </div>
          )}

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
            {diveSite.description}
          </p>
          
          {/* Dive details section with depth and difficulty */}
          <div className="mb-4 py-2 border-t border-b border-slate-100 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <span className="text-slate-500 dark:text-slate-400 mr-1">Depth:</span>
                <span className="font-medium text-ocean-900 dark:text-white">
                  {diveSite.depthMin && diveSite.depthMax 
                    ? `${diveSite.depthMin}-${diveSite.depthMax}m` 
                    : 'Not specified'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-slate-500 dark:text-slate-400 mr-1">Difficulty:</span>
                <span className={`font-medium ${
                  diveSite.difficulty === "Advanced" 
                    ? "text-red-600 dark:text-red-400" 
                    : diveSite.difficulty === "Intermediate" 
                      ? "text-amber-600 dark:text-amber-400" 
                      : "text-green-600 dark:text-green-400"
                }`}>
                  {diveSite.difficulty || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col space-y-2">
            <button 
              type="button" 
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-green-800 bg-green-100 hover:bg-green-200 dark:bg-green-200/90 dark:hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300 dark:focus:ring-offset-slate-900 shadow-md hover:shadow-lg transition-all"
              onClick={onVote}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Vote
            </button>
            
            {showViewButton && (
              <Link href={`/dive-sites?site=${diveSite.id}`} className="w-full inline-flex justify-center items-center px-4 py-2 border border-ocean-300 text-sm font-medium rounded-lg text-ocean-700 bg-white hover:bg-ocean-50 dark:bg-slate-700 dark:text-ocean-300 dark:border-ocean-700 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-500 dark:focus:ring-offset-slate-900 shadow-sm hover:shadow-md transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                View Details
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
