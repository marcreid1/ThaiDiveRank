import { diveSites, votes, type DiveSite, type InsertDiveSite, type DiveSiteRanking } from "@shared/schema";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import { IDiveSiteStorage, RegionDiveSites } from "./interfaces";
import { eloService } from "../services/eloService";

export class DiveSiteStorage implements IDiveSiteStorage {
  async getAllDiveSites(): Promise<DiveSite[]> {
    return await db.select().from(diveSites).orderBy(diveSites.name);
  }

  async getDiveSite(id: number): Promise<DiveSite | undefined> {
    const [diveSite] = await db.select().from(diveSites).where(eq(diveSites.id, id));
    return diveSite;
  }

  async createDiveSite(insertDiveSite: InsertDiveSite): Promise<DiveSite> {
    const [diveSite] = await db.insert(diveSites).values(insertDiveSite).returning();
    return diveSite;
  }

  async updateDiveSite(id: number, diveSiteUpdate: Partial<DiveSite>): Promise<DiveSite | undefined> {
    const [updatedDiveSite] = await db
      .update(diveSites)
      .set(diveSiteUpdate)
      .where(eq(diveSites.id, id))
      .returning();
    return updatedDiveSite;
  }

  async getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }> {
    const allSites = await this.getAllDiveSites();
    const statsMap = await eloService.calculateDiveSiteStats();
    
    // Sort by rating (highest first) and assign ranks
    const sortedSites = allSites.sort((a, b) => b.rating - a.rating);
    
    const rankings: DiveSiteRanking[] = sortedSites.map((site, index) => {
      const stats = statsMap.get(site.id);
      return {
        ...site,
        totalVotes: stats?.totalVotes ?? 0,
        rankChange: (site.previousRank ?? 0) > 0 ? (site.previousRank ?? 0) - (index + 1) : 0,
      };
    });

    // Update current ranks in database
    for (let i = 0; i < rankings.length; i++) {
      const site = rankings[i];
      if (site.currentRank !== i + 1) {
        await db
          .update(diveSites)
          .set({ 
            previousRank: site.currentRank,
            currentRank: i + 1 
          })
          .where(eq(diveSites.id, site.id));
      }
    }

    return {
      rankings,
      lastUpdated: new Date().toISOString()
    };
  }

  async getDiveSitesByRegion(): Promise<RegionDiveSites[]> {
    const allSites = await this.getAllDiveSites();
    
    // Define the organized structure for dive site regions
    const regionStructure: RegionDiveSites[] = [
      {
        region: "Similan Islands",
        description: "The Similan Islands are an archipelago of nine islands in the Andaman Sea, renowned for granite boulder formations, white sandy beaches, and rich marine biodiversity. A protected national park offering world-class diving experiences across southern, central, and northern sections.",
        diveSites: [],
        subregions: [
          {
            region: "North",
            description: "The northern islands (#8-11) have the archipelago's most dramatic underwater topography, with massive boulders, swim-throughs, and the best chance to see larger pelagic species.",
            diveSites: []
          },
          {
            region: "South",
            description: "The southern islands (#1-3) feature more protected reefs and better conditions for beginners, with shallow coral gardens and diverse marine life.",
            diveSites: []
          },
          {
            region: "Central", 
            description: "The central islands (#4-7) offer a mix of dive conditions suitable for all levels, with boulder formations and rich coral gardens.",
            diveSites: []
          }
        ]
      },
      {
        region: "Surin Islands",
        description: "Located in the northern Andaman Sea, the Surin Islands feature pristine reefs with exceptional visibility. These protected waters host an incredible diversity of marine life, with shallow reef systems in the north and more varied dive conditions in the south.",
        diveSites: [],
        subregions: [
          {
            region: "North",
            description: "The northern Surin Islands (#1, #3, #4, #7) have excellent shallow reefs with diverse coral species and abundant reef fish, ideal for beginners and underwater photographers.",
            diveSites: []
          },
          {
            region: "South", 
            description: "The southern Surin Islands (#2, #5, #6) feature more varied underwater landscapes including pinnacles, offering opportunities to see larger marine life.",
            diveSites: []
          }
        ]
      },
      {
        region: "Extended Park",
        description: "Remote dive sites beyond the main island groups, featuring unique underwater landscapes and exceptional marine biodiversity. These sites offer advanced diving experiences with dramatic topography and rare species sightings.",
        diveSites: []
      }
    ];

    // Categorize each dive site into the appropriate region and subregion
    for (const site of allSites) {
      const location = site.location.toLowerCase();
      
      if (location.includes('similan')) {
        const similanRegion = regionStructure[0];
        
        if (location.includes('north')) {
          similanRegion.subregions![0].diveSites.push(site);
        } else if (location.includes('south')) {
          similanRegion.subregions![1].diveSites.push(site);
        } else if (location.includes('central')) {
          similanRegion.subregions![2].diveSites.push(site);
        } else {
          // Fallback for sites without clear sub-region
          similanRegion.diveSites.push(site);
        }
      } else if (location.includes('surin')) {
        const surinRegion = regionStructure[1];
        
        if (location.includes('north')) {
          surinRegion.subregions![0].diveSites.push(site);
        } else if (location.includes('south')) {
          surinRegion.subregions![1].diveSites.push(site);
        } else {
          // Fallback for sites without clear sub-region
          surinRegion.diveSites.push(site);
        }
      } else {
        // Extended Park - sites that don't belong to main island groups
        regionStructure[2].diveSites.push(site);
      }
    }

    // Sort dive sites within each region/subregion by rating (highest first)
    for (const region of regionStructure) {
      region.diveSites.sort((a, b) => b.rating - a.rating);
      
      if (region.subregions) {
        for (const subregion of region.subregions) {
          subregion.diveSites.sort((a, b) => b.rating - a.rating);
        }
      }
    }

    // Filter out empty regions and subregions
    return regionStructure.filter(region => {
      if (region.subregions) {
        region.subregions = region.subregions.filter(sub => sub.diveSites.length > 0);
        return region.diveSites.length > 0 || region.subregions.length > 0;
      }
      return region.diveSites.length > 0;
    });
  }
}