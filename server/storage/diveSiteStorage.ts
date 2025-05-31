import { diveSites, votes, type DiveSite, type InsertDiveSite, type DiveSiteRanking } from "@shared/schema";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import { IDiveSiteStorage, RegionDiveSites } from "./interfaces";

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
    
    // Sort by rating (highest first) and assign ranks
    const sortedSites = allSites.sort((a, b) => b.rating - a.rating);
    
    const rankings: DiveSiteRanking[] = sortedSites.map((site, index) => ({
      ...site,
      rankChange: (site.previousRank ?? 0) > 0 ? (site.previousRank ?? 0) - (index + 1) : 0,
    }));

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
    
    // Group sites by location (region)
    const regionMap = new Map<string, DiveSite[]>();
    
    for (const site of allSites) {
      const region = site.location;
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(site);
    }

    // Convert to RegionDiveSites format
    const regions: RegionDiveSites[] = Array.from(regionMap.entries()).map(([region, sites]) => ({
      region,
      description: `Dive sites in ${region}`,
      diveSites: sites.sort((a, b) => b.rating - a.rating), // Sort by rating
    }));

    return regions.sort((a, b) => a.region.localeCompare(b.region));
  }
}