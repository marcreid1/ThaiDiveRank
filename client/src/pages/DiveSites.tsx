import { useQuery } from "@tanstack/react-query";
import { DiveSite } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { RegionDiveSites } from "@/types/region-dive-sites";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { getDiveSiteImage } from "@/lib/utils/getImage";

export default function DiveSites() {
  const [location] = useLocation();
  const { data: regionData, isLoading, isError } = useQuery<RegionDiveSites[]>({
    queryKey: ["/api/dive-sites-by-region"]
  });
  
  // Get selected site ID from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const selectedSiteId = urlParams.get('site') ? Number(urlParams.get('site')) : null;
  
  // Using useState for tracking all states
  const [targetSite, setTargetSite] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<boolean>(false);
  
  // Keep track of all dive site IDs and their locations for quick lookup
  const diveSiteMap = useRef<Map<number, { mainRegion: string, subRegion?: string }>>(new Map());
  
  // Build a map of dive site IDs when data loads
  useEffect(() => {
    if (!regionData) return;
    
    const map = new Map<number, { mainRegion: string, subRegion?: string }>();
    
    // Helper function to process dive sites for a region
    const processDiveSites = (sites: DiveSite[], mainRegion: string, subRegion?: string) => {
      sites.forEach(site => {
        map.set(site.id, { 
          mainRegion, 
          ...(subRegion && { subRegion }) 
        });
      });
    };
    
    // Process all regions and subregions
    regionData.forEach(region => {
      processDiveSites(region.diveSites, region.region);
      
      if (region.subregions) {
        region.subregions.forEach(subregion => {
          processDiveSites(subregion.diveSites, region.region, subregion.region);
        });
      }
    });
    
    diveSiteMap.current = map;
    
    // Once we have the map, if there's a selected site ID, set it as target
    if (selectedSiteId && !targetSite) {
      setTargetSite(selectedSiteId);
    }
  }, [regionData, selectedSiteId, targetSite]);
  
  // When we have a target site, scroll to it and highlight it
  useEffect(() => {
    if (!targetSite || !regionData) return;
    
    // Helper function to handle the highlight effect
    const highlightElement = (element: HTMLElement) => {
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight effect
      element.classList.add('ring-4', 'ring-ocean-500', 'ring-opacity-70');
      setHighlight(true);
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-ocean-500', 'ring-opacity-70');
        setHighlight(false);
      }, 3000);
    };
    
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      const element = document.getElementById(`dive-site-${targetSite}`);
      if (element) {
        highlightElement(element);
      }
    }, 500);
    
    // Clean up timeout on unmount
    return () => clearTimeout(timer);
  }, [targetSite, regionData]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center my-8">
          <Skeleton className="h-10 w-64 mx-auto mb-4 dark:bg-slate-700" />
          <Skeleton className="h-6 w-96 mx-auto dark:bg-slate-700" />
        </div>
        
        {[1, 2, 3].map((region) => (
          <div key={region} className="mb-8">
            <Skeleton className="h-8 w-48 mb-2 dark:bg-slate-700" />
            <Skeleton className="h-6 w-full mb-6 dark:bg-slate-700" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((site) => (
                <div key={site} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                  <div className="h-48 bg-slate-100 dark:bg-slate-700">
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
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl mb-4">
            Oops! Something went wrong.
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 sm:mt-4 mb-8">
            We couldn't load the dive site information. Please try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-ocean-600 hover:bg-ocean-700 dark:bg-ocean-700 dark:hover:bg-ocean-600"
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
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Dive Site Directory
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 sm:mt-4">
          Dive into the details of 43 dive sites
        </p>
      </div>
      
      <Accordion type="multiple" defaultValue={regionData.map(r => r.region)} className="mb-12">
        {regionData.map((mainRegion) => (
          <AccordionItem 
            key={mainRegion.region} 
            value={mainRegion.region} 
            className="border border-slate-200 dark:border-slate-700 rounded-lg mb-4 overflow-hidden bg-white dark:bg-slate-800"
          >
            <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 text-left">
                  {mainRegion.region}
                </h2>
                {/* Count total dive sites including those in subregions */}
                <Badge variant="outline" className="ml-3 dark:border-slate-600 dark:text-slate-300">
                  {mainRegion.diveSites.length + (mainRegion.subregions?.reduce((acc, sub) => acc + sub.diveSites.length, 0) || 0)} sites
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-0">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-slate-700 dark:text-slate-300">{mainRegion.description}</p>
              </div>
              
              {/* If this main region has direct dive sites, show them */}
              {mainRegion.diveSites.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {mainRegion.diveSites.map((site) => (
                    <DiveSiteCard key={site.id} diveSite={site} />
                  ))}
                </div>
              )}
              
              {/* If this main region has subregions, render nested accordions */}
              {mainRegion.subregions && mainRegion.subregions.length > 0 && (
                <div className="px-4 py-3">
                  <Accordion type="multiple" defaultValue={mainRegion.subregions.map(sub => sub.region)}>
                    {mainRegion.subregions.map((subregion) => (
                      <AccordionItem 
                        key={subregion.region} 
                        value={subregion.region} 
                        className="border border-slate-100 dark:border-slate-700 rounded-md mb-3 overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 text-left">
                              {subregion.region}
                            </h3>
                            <Badge variant="outline" className="ml-3 dark:border-slate-600 dark:text-slate-300">
                              {subregion.diveSites.length} sites
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-0">
                          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">{subregion.description}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                            {subregion.diveSites.map((site) => (
                              <DiveSiteCard key={site.id} diveSite={site} />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
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
  // Helper function to get difficulty class based on level
  const getDifficultyClass = (difficulty: string | undefined) => {
    switch(difficulty) {
      case "Advanced":
        return "text-red-600 dark:text-red-500";
      case "Intermediate":
        return "text-amber-600 dark:text-amber-500";
      default:
        return "text-green-600 dark:text-green-500";
    }
  };

  // Helper function to format depth range
  const getDepthRange = (min?: number | null, max?: number | null) => {
    return (min != null && max != null) ? `${min}-${max}m` : "Not specified";
  };

  return (
    <div 
      id={`dive-site-${diveSite.id}`} 
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden h-full flex flex-col transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="h-48 overflow-hidden">
        <img
          src={getDiveSiteImage(diveSite.name)}
          alt={diveSite.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{diveSite.name}</h3>
          {diveSite.types.map((type) => (
            <span 
              key={type} 
              className="inline-block px-2 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap"
            >
              {type}
            </span>
          ))}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{diveSite.location}</p>
        
        {/* Dive site description */}
        <p className="text-sm text-slate-600 dark:text-slate-300 flex-grow">{diveSite.description}</p>
        
        {/* Dive site stats */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
          {/* Depth info */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 dark:text-slate-500">Depth Range</span>
            <span className="text-sm font-medium dark:text-slate-300">
              {getDepthRange(diveSite.depthMin, diveSite.depthMax)}
            </span>
          </div>
          
          {/* Difficulty level */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 dark:text-slate-500 text-right w-full block">Difficulty</span>
            <span className={`text-sm font-medium text-right w-full block ${getDifficultyClass(diveSite.difficulty)}`}>
              {diveSite.difficulty || "Intermediate"}
            </span>
          </div>
          
          {/* Rating info */}
          <div className="flex flex-col col-span-2 mt-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">Ranking Stats</span>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">ELO: {Math.round(diveSite.rating)}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{diveSite.wins} wins / {diveSite.losses} losses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}