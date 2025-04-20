import { DiveSite } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface DiveSiteCardProps {
  diveSite: DiveSite;
  rank?: number;
  onVote: () => void;
}

export default function DiveSiteCard({ diveSite, rank, onVote }: DiveSiteCardProps) {
  return (
    <div className="dive-card relative bg-white border-2 border-ocean-200 rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:translate-y-[-4px] hover:shadow-lg">
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 flex items-center shadow-sm">
          {diveSite.types[0] === "Reef" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-ocean-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          )}
          <span className="text-xs font-medium text-slate-700">{diveSite.name}</span>
        </div>
      </div>
      
      <div className="relative h-48 sm:h-64 bg-ocean-100">
        <img 
          src={diveSite.imageUrl} 
          alt={diveSite.name} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-semibold text-ocean-900 text-lg">{diveSite.name}</h3>
          </div>
          {rank && (
            <div className="flex items-center">
              <Badge variant="ocean">
                #{rank}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {diveSite.types.map((type, index) => (
            <span key={index} className="inline-block px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700">
              {type}
            </span>
          ))}
        </div>
        
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
          {diveSite.description}
        </p>
        
        <div className="mt-auto">
          <button 
            type="button" 
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-ocean-600 hover:bg-ocean-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-500"
            onClick={onVote}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            Vote This One
          </button>
        </div>
      </div>
    </div>
  );
}
