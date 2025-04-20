import { useQuery } from "@tanstack/react-query";
import { DiveSite } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { RegionDiveSites } from "../../server/storage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function DiveSites() {
  const { data: regionData, isLoading, isError } = useQuery<RegionDiveSites[]>({
    queryKey: ["/api/dive-sites-by-region"]
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center my-8">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        
        {[1, 2, 3].map((region) => (
          <div key={region} className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-6 w-full mb-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((site) => (
                <div key={site} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="h-48 bg-slate-100">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !regionData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
            Oops! Something went wrong.
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-slate-500 sm:mt-4 mb-8">
            We couldn't load the dive site information. Please try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-ocean-600 hover:bg-ocean-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center my-8">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Thailand Dive Sites
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-slate-500 sm:mt-4">
          Explore 148 dive sites across Thailand's stunning coastlines and islands.
        </p>
      </div>
      
      <Accordion type="multiple" defaultValue={[regionData[0]?.region]} className="mb-12">
        {regionData.map((region) => (
          <AccordionItem key={region.region} value={region.region} className="border border-slate-200 rounded-lg mb-4 overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-slate-900 text-left">
                  {region.region}
                </h2>
                <Badge variant="outline" className="ml-3">
                  {region.diveSites.length} sites
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-0">
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <p className="text-slate-700">{region.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {region.diveSites.map((site) => (
                  <DiveSiteCard key={site.id} diveSite={site} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

interface DiveSiteCardProps {
  diveSite: DiveSite;
}

function DiveSiteCard({ diveSite }: DiveSiteCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
      <div className="h-48 overflow-hidden">
        <img
          src={diveSite.imageUrl}
          alt={diveSite.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{diveSite.name}</h3>
        <p className="text-sm text-slate-500 mb-3">{diveSite.location}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {diveSite.types.map((type) => (
            <Badge key={type} variant="secondary" className="bg-slate-100 text-slate-700">
              {type}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-slate-600 flex-grow">{diveSite.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-slate-500">ELO Rating: {Math.round(diveSite.rating)}</span>
          <div className="flex items-center text-sm text-ocean-600">
            <span>{diveSite.wins} wins / {diveSite.losses} losses</span>
          </div>
        </div>
      </div>
    </div>
  );
}