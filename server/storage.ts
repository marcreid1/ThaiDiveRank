import { users, diveSites, votes, type User, type InsertUser, type DiveSite, type InsertDiveSite, type Vote, type InsertVote, type DiveSiteRanking, type VoteActivity } from "@shared/schema";
import { calculateEloChange } from "./utils/elo";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface RegionDiveSites {
  region: string;
  description: string;
  diveSites: DiveSite[];
  subregions?: RegionDiveSites[];
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Dive site methods
  getAllDiveSites(): Promise<DiveSite[]>;
  getDiveSite(id: number): Promise<DiveSite | undefined>;
  createDiveSite(diveSite: InsertDiveSite): Promise<DiveSite>;
  updateDiveSite(id: number, diveSite: Partial<DiveSite>): Promise<DiveSite | undefined>;
  getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }>;
  getDiveSitesByRegion(): Promise<RegionDiveSites[]>;
  
  // Matchup methods
  getRandomMatchup(): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }>;
  
  // Vote methods
  createVote(vote: InsertVote): Promise<Vote>;
  getVotes(limit?: number): Promise<Vote[]>;
  getRecentActivity(limit?: number): Promise<VoteActivity[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllDiveSites(): Promise<DiveSite[]> {
    return await db.select().from(diveSites).orderBy(desc(diveSites.rating));
  }

  async getDiveSite(id: number): Promise<DiveSite | undefined> {
    const [diveSite] = await db.select().from(diveSites).where(eq(diveSites.id, id));
    return diveSite || undefined;
  }

  async createDiveSite(insertDiveSite: InsertDiveSite): Promise<DiveSite> {
    const [diveSite] = await db
      .insert(diveSites)
      .values({
        ...insertDiveSite,
        rating: 1500,
        wins: 0,
        losses: 0,
        depthMin: 0,
        depthMax: 0,
        difficulty: "Intermediate",
      })
      .returning();
    return diveSite;
  }

  async updateDiveSite(id: number, diveSiteUpdate: Partial<DiveSite>): Promise<DiveSite | undefined> {
    const [diveSite] = await db
      .update(diveSites)
      .set(diveSiteUpdate)
      .where(eq(diveSites.id, id))
      .returning();
    return diveSite || undefined;
  }

  async getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }> {
    const allSites = await db.select().from(diveSites).orderBy(desc(diveSites.rating));
    
    // Get the most recent vote timestamp
    const [latestVote] = await db.select({ timestamp: votes.timestamp }).from(votes).orderBy(desc(votes.timestamp)).limit(1);
    const lastUpdated = latestVote?.timestamp?.toISOString() || new Date().toISOString();

    const rankings = allSites.map(site => ({
      ...site,
      rankChange: site.previousRank > 0 ? site.previousRank - site.currentRank : 0,
    }));

    return { rankings, lastUpdated };
  }

  async getDiveSitesByRegion(): Promise<RegionDiveSites[]> {
    const allSites = await this.getAllDiveSites();
    
    // Group dive sites by region (based on location patterns)
    const regionMap = new Map<string, DiveSite[]>();
    
    allSites.forEach(site => {
      let region = "Other";
      
      if (site.location.includes("Similan")) {
        region = "Similan Islands";
      } else if (site.location.includes("Surin")) {
        region = "Surin Islands";
      } else if (site.location.includes("Richelieu")) {
        region = "Richelieu Rock Area";
      }
      
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(site);
    });

    const regions: RegionDiveSites[] = [];
    
    regionMap.forEach((sites, regionName) => {
      let description = "";
      
      switch (regionName) {
        case "Similan Islands":
          description = "A pristine archipelago known for its crystal-clear waters and diverse marine life.";
          break;
        case "Surin Islands":
          description = "Remote islands offering untouched coral reefs and excellent visibility.";
          break;
        case "Richelieu Rock Area":
          description = "Famous seamount diving with whale shark encounters and macro life.";
          break;
        default:
          description = "Additional diving locations in the region.";
      }
      
      regions.push({
        region: regionName,
        description,
        diveSites: sites,
      });
    });

    return regions;
  }

  async getRandomMatchup(): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    const allSites = await this.getAllDiveSites();
    
    if (allSites.length < 2) {
      throw new Error("Not enough dive sites for matchup");
    }

    // Simple random selection for now
    const shuffled = allSites.sort(() => 0.5 - Math.random());
    return {
      diveSiteA: shuffled[0],
      diveSiteB: shuffled[1],
    };
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    // Get current ratings for ELO calculation
    const winner = await this.getDiveSite(insertVote.winnerId);
    const loser = await this.getDiveSite(insertVote.loserId);

    if (!winner || !loser) {
      throw new Error("Invalid dive site IDs");
    }

    // Get current rankings before vote
    const currentRankings = await db.select().from(diveSites).orderBy(desc(diveSites.rating));
    const rankingMap = new Map();
    currentRankings.forEach((site, index) => {
      rankingMap.set(site.id, index + 1);
    });

    // Store previous ranks
    await Promise.all([
      db.update(diveSites).set({ previousRank: rankingMap.get(insertVote.winnerId) }).where(eq(diveSites.id, insertVote.winnerId)),
      db.update(diveSites).set({ previousRank: rankingMap.get(insertVote.loserId) }).where(eq(diveSites.id, insertVote.loserId))
    ]);

    // Calculate ELO change
    const eloChange = calculateEloChange(winner.rating, loser.rating);

    // Create the vote with calculated points
    const [vote] = await db
      .insert(votes)
      .values({
        ...insertVote,
        pointsChanged: eloChange,
      })
      .returning();

    // Update the dive site ratings
    await Promise.all([
      db
        .update(diveSites)
        .set({ 
          rating: winner.rating + eloChange,
          wins: winner.wins + 1,
        })
        .where(eq(diveSites.id, insertVote.winnerId)),
      
      db
        .update(diveSites)
        .set({ 
          rating: loser.rating - eloChange,
          losses: loser.losses + 1,
        })
        .where(eq(diveSites.id, insertVote.loserId))
    ]);

    // Get new rankings after vote and update current ranks
    const newRankings = await db.select().from(diveSites).orderBy(desc(diveSites.rating));
    const newRankingMap = new Map();
    newRankings.forEach((site, index) => {
      newRankingMap.set(site.id, index + 1);
    });

    // Update current ranks for all sites
    await Promise.all(newRankings.map((site, index) => 
      db.update(diveSites).set({ currentRank: index + 1 }).where(eq(diveSites.id, site.id))
    ));

    return vote;
  }

  async getVotes(limit = 20): Promise<Vote[]> {
    return await db.select().from(votes).orderBy(desc(votes.timestamp)).limit(limit);
  }

  async getRecentActivity(limit = 10): Promise<VoteActivity[]> {
    const recentVotes = await db
      .select({
        id: votes.id,
        winnerId: votes.winnerId,
        loserId: votes.loserId,
        pointsChanged: votes.pointsChanged,
        timestamp: votes.timestamp,
      })
      .from(votes)
      .orderBy(desc(votes.timestamp))
      .limit(limit);

    if (recentVotes.length === 0) {
      return [];
    }

    // Get all unique site IDs and fetch their names
    const siteIds = [...new Set([...recentVotes.map(v => v.winnerId), ...recentVotes.map(v => v.loserId)])];
    const sites = await db.select({ id: diveSites.id, name: diveSites.name }).from(diveSites);
    
    // Create a map for quick lookup
    const siteMap = new Map(sites.map(site => [site.id, site.name]));

    return recentVotes.map(vote => ({
      id: vote.id,
      winnerName: siteMap.get(vote.winnerId) || "Unknown",
      loserName: siteMap.get(vote.loserId) || "Unknown",
      pointsChanged: vote.pointsChanged,
      timestamp: vote.timestamp.toISOString(),
    }));
  }
}

export const storage = new DatabaseStorage();