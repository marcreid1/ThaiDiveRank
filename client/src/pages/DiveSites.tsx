import { useQuery } from "@tanstack/react-query";
import { DiveSite } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { RegionDiveSites } from "@/types/region-dive-sites";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { diveSiteImages, defaultDiveSiteImage } from "@/assets/index";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

// Helper function to get the correct image for a dive site
const getDiveSiteImage = (name: string): string => {
  // Direct match
  if (diveSiteImages[name as keyof typeof diveSiteImages]) {
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
  
  // Fallback to default image
  return defaultDiveSiteImage;
};

export default function DiveSites() {
  const [location] = useLocation();
  const { data: regionData, isLoading, isError } = useQuery<RegionDiveSites[]>({
    queryKey: ["/api/dive-sites-by-region"]
  });
  
  // Get selected site ID from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const selectedSiteId = urlParams.get('site') ? Number(urlParams.get('site')) : null;
  
  // State to track which accordions should be open by default
  const [openRegions, setOpenRegions] = useState<string[]>([]);
  const [openSubregions, setOpenSubregions] = useState<string[]>([]);
  
  // Effect to determine which accordions should be open based on selected site
  useEffect(() => {
    if (regionData && selectedSiteId) {
      console.log("Looking for dive site ID:", selectedSiteId);
      
      // Find the region and subregion containing the selected dive site
      const regionsToOpen: string[] = [];
      const subregionsToOpen: string[] = [];
      
      // Search through all regions and subregions for the dive site
      regionData.forEach(region => {
        // Check main region's dive sites
        const foundInMainRegion = region.diveSites.some(site => site.id === selectedSiteId);
        if (foundInMainRegion) {
          console.log("Found in main region:", region.region);
          regionsToOpen.push(region.region);
        }
        
        // Check subregions if they exist
        if (region.subregions) {
          region.subregions.forEach(subregion => {
            const foundInSubregion = subregion.diveSites.some(site => site.id === selectedSiteId);
            if (foundInSubregion) {
              console.log("Found in subregion:", subregion.region, "of region", region.region);
              regionsToOpen.push(region.region);
              subregionsToOpen.push(subregion.region);
            }
          });
        }
      });
      
      // Set the open accordions
      if (regionsToOpen.length > 0) {
        console.log("Setting open regions:", regionsToOpen);
        setOpenRegions(regionsToOpen);
      }
      if (subregionsToOpen.length > 0) {
        console.log("Setting open subregions:", subregionsToOpen);
        setOpenSubregions(subregionsToOpen);
      }
    }
  }, [regionData, selectedSiteId]);
  
  // Effect to scroll to the selected dive site after accordions are open
  useEffect(() => {
    if (selectedSiteId && (openRegions.length > 0 || openSubregions.length > 0)) {
      // Delay to ensure accordions have expanded
      setTimeout(() => {
        const diveSiteElement = document.getElementById(`dive-site-${selectedSiteId}`);
        if (diveSiteElement) {
          diveSiteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight effect
          diveSiteElement.classList.add('ring-2', 'ring-ocean-500', 'ring-offset-2');
          setTimeout(() => {
            diveSiteElement.classList.remove('ring-2', 'ring-ocean-500', 'ring-offset-2');
          }, 3000);
        }
      }, 500);
    }
  }, [selectedSiteId, openRegions, openSubregions]);

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
      
      <Accordion type="multiple" defaultValue={selectedSiteId ? openRegions : regionData.map(r => r.region)} className="mb-12">
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
                  <Accordion type="multiple" defaultValue={selectedSiteId ? openSubregions : mainRegion.subregions.map(sub => sub.region)}>
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
  return (
    <div id={`dive-site-${diveSite.id}`} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden h-full flex flex-col transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
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
            <span key={type} className="inline-block px-2 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">
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
              {diveSite.depthMin != null && diveSite.depthMax != null
                ? `${diveSite.depthMin}-${diveSite.depthMax}m`
                : "Not specified"}
            </span>
          </div>
          
          {/* Difficulty level */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 dark:text-slate-500 text-right w-full block">Difficulty</span>
            <span className={`text-sm font-medium text-right w-full block ${
              diveSite.difficulty === "Advanced" 
                ? "text-red-600 dark:text-red-500" 
                : diveSite.difficulty === "Intermediate" 
                  ? "text-amber-600 dark:text-amber-500" 
                  : "text-green-600 dark:text-green-500"
            }`}>
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