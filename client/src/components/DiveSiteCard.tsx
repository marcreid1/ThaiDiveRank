
import { DiveSite } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { diveSiteImages, defaultDiveSiteImage } from "@/assets/index";

// Helper function to get the correct image for a dive site
const getDiveSiteImage = (name: string): string => {
  // Direct match
  if (name in diveSiteImages) {
    return diveSiteImages[name as keyof typeof diveSiteImages];
  }

  // Check for specific problematic cases
  if (name.includes("North Point") || name.includes("Rocky Point")) {
    return diveSiteImages["North Point"];
  }

  if (name.includes("Beacon Reef") || name.includes("Beacon Beach")) {
    return diveSiteImages["Beacon Reef"];
  }

  if (name.includes("Koh Bon Ridge") || name.includes("West Ridge") || name.includes("Manta Road")) {
    return diveSiteImages["Koh Bon Ridge"];
  }

  if (name.includes("Koh Tachai Pinnacle") || name.includes("Plateau")) {
    return diveSiteImages["Koh Tachai Pinnacle"];
  }

  if (name.includes("Ao Tao") || name.includes("Turtle Bay")) {
    return diveSiteImages["Ao Tao"];
  }

  // Fallback to default image
  return defaultDiveSiteImage;
};

interface DiveSiteCardProps {
  diveSite: DiveSite;
  rank?: number;
  onVote: () => void;
}

export default function DiveSiteCard({ diveSite, rank, onVote }: DiveSiteCardProps) {
  return (
    <div className="dive-card relative bg-white border-2 border-ocean-200 rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:translate-y-[-4px] hover:shadow-lg">
      <div className="relative h-48 sm:h-64 bg-ocean-100">
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
              <h3 className="font-semibold text-ocean-900 text-lg">{diveSite.name}</h3>
              <span className="text-sm text-slate-500">• {diveSite.location}</span>
            </div>
            <div className="flex flex-shrink-0">
              {diveSite.types.map((type, index) => (
                <span key={index} className="inline-block px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700 whitespace-nowrap">
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

          <p className="text-sm text-slate-500 mb-2 line-clamp-2">
            {diveSite.description}
          </p>
          
          {/* Dive details section with type, depth, and difficulty */}
          <div className="mb-4 py-2 border-t border-b border-slate-100">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Type:</span>
                <span className="font-medium text-ocean-900">{diveSite.types.join(', ')}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Depth:</span>
                <span className="font-medium text-ocean-900">
                  {diveSite.depthMin && diveSite.depthMax 
                    ? `${diveSite.depthMin}-${diveSite.depthMax}m` 
                    : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Difficulty:</span>
                <span className={`font-medium ${
                  diveSite.difficulty === "Advanced" 
                    ? "text-red-600" 
                    : diveSite.difficulty === "Intermediate" 
                      ? "text-amber-600" 
                      : "text-green-600"
                }`}>
                  {diveSite.difficulty || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <button 
              type="button" 
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-green-800 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300 shadow-md hover:shadow-lg transition-all"
              onClick={onVote}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
