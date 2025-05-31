import { diveSites, votes, users, type DiveSite, type InsertDiveSite, type Vote, type InsertVote, type DiveSiteRanking, type VoteActivity, type User, type InsertUser } from "@shared/schema";
import { calculateEloChange } from "./utils/elo";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface RegionDiveSites {
  region: string;
  description: string;
  diveSites: DiveSite[];
  subregions?: RegionDiveSites[];
}

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  
  // Dive site methods (public data)
  getAllDiveSites(): Promise<DiveSite[]>;
  getDiveSite(id: number): Promise<DiveSite | undefined>;
  createDiveSite(diveSite: InsertDiveSite): Promise<DiveSite>;
  updateDiveSite(id: number, diveSite: Partial<DiveSite>): Promise<DiveSite | undefined>;
  getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }>;
  getDiveSitesByRegion(): Promise<RegionDiveSites[]>;
  
  // Matchup methods
  getRandomMatchup(winnerId?: number, winnerSide?: 'A' | 'B'): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }>;
  
  // Vote methods
  createVote(vote: InsertVote): Promise<Vote>;
  getVotes(limit?: number): Promise<Vote[]>;
  getUserVotes(userId: string): Promise<Vote[]>;
  getRecentActivity(limit?: number): Promise<VoteActivity[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

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
    const allSites = await db.select().from(diveSites).orderBy(desc(diveSites.rating));
    
    // Get the most recent vote timestamp
    const [latestVote] = await db.select({ timestamp: votes.timestamp }).from(votes).orderBy(desc(votes.timestamp)).limit(1);
    const lastUpdated = latestVote?.timestamp?.toISOString() || new Date().toISOString();

    const rankings = allSites.map(site => ({
      ...site,
      rankChange: (site.previousRank !== null && site.currentRank !== null && site.previousRank > 0) 
        ? site.previousRank - site.currentRank 
        : 0,
    }));

    return { rankings, lastUpdated };
  }

  async getDiveSitesByRegion(): Promise<RegionDiveSites[]> {
    const allSites = await this.getAllDiveSites();
    
    // Create organized structure with geographic subregions
    const regions: RegionDiveSites[] = [];
    
    // Similan Islands with geographic subregions
    const similanSites = allSites.filter(site => site.location.includes("Similan"));
    if (similanSites.length > 0) {
      const similanSubregions: RegionDiveSites[] = [];
      
      // South Similan Islands (Islands #1-3)
      const southSites = similanSites.filter(site => site.location.includes("South, Similan"));
      if (southSites.length > 0) {
        similanSubregions.push({
          region: "South",
          description: "The southern islands (#1-3) feature more protected reefs and better conditions for beginners, with shallow coral gardens and diverse marine life.",
          diveSites: southSites,
        });
      }
      
      // Central Similan Islands (Islands #4-7)
      const centralSites = similanSites.filter(site => site.location.includes("Central, Similan"));
      if (centralSites.length > 0) {
        similanSubregions.push({
          region: "Central",
          description: "The central islands (#4-7) offer a mix of dive conditions suitable for all levels, with boulder formations and rich coral gardens.",
          diveSites: centralSites,
        });
      }
      
      // North Similan Islands (Islands #8-11)
      const northSites = similanSites.filter(site => site.location.includes("North, Similan"));
      if (northSites.length > 0) {
        similanSubregions.push({
          region: "North",
          description: "The northern islands (#8-11) have the archipelago's most dramatic underwater topography, with massive boulders, swim-throughs, and the best chance to see larger pelagic species.",
          diveSites: northSites,
        });
      }
      
      regions.push({
        region: "Similan Islands",
        description: "The Similan Islands are an archipelago of nine islands in the Andaman Sea, renowned for granite boulder formations, white sandy beaches, and rich marine biodiversity. A protected national park offering world-class diving experiences across southern, central, and northern sections.",
        diveSites: [],
        subregions: similanSubregions,
      });
    }
    
    // Surin Islands with geographic subregions
    const surinSites = allSites.filter(site => site.location.includes("Surin"));
    if (surinSites.length > 0) {
      const surinSubregions: RegionDiveSites[] = [];
      
      // North Surin Islands
      const northSurinSites = surinSites.filter(site => site.location.includes("North, Surin"));
      if (northSurinSites.length > 0) {
        surinSubregions.push({
          region: "North",
          description: "The northern Surin Islands (#1, #3, #4, #7) have excellent shallow reefs with diverse coral species and abundant reef fish, ideal for beginners and underwater photographers.",
          diveSites: northSurinSites,
        });
      }
      
      // South Surin Islands
      const southSurinSites = surinSites.filter(site => site.location.includes("South, Surin"));
      if (southSurinSites.length > 0) {
        surinSubregions.push({
          region: "South",
          description: "The southern Surin Islands (#2, #5, #6) feature more varied underwater landscapes including pinnacles, offering opportunities to see larger marine life.",
          diveSites: southSurinSites,
        });
      }
      
      regions.push({
        region: "Surin Islands",
        description: "Located in the northern Andaman Sea, the Surin Islands feature pristine reefs with exceptional visibility. These protected waters host an incredible diversity of marine life, with shallow reef systems in the north and more varied dive conditions in the south.",
        diveSites: [],
        subregions: surinSubregions,
      });
    }
    
    // Richelieu Rock Area (no subregions)
    const richelieuSites = allSites.filter(site => site.location.includes("Richelieu"));
    if (richelieuSites.length > 0) {
      regions.push({
        region: "Richelieu Rock Area",
        description: "Famous seamount diving with whale shark encounters and macro life.",
        diveSites: richelieuSites,
      });
    }
    
    // Other sites (fallback for any sites not matching the above patterns)
    const otherSites = allSites.filter(site => 
      !site.location.includes("Similan") && 
      !site.location.includes("Surin") && 
      !site.location.includes("Richelieu")
    );
    if (otherSites.length > 0) {
      regions.push({
        region: "Other",
        description: "Additional diving locations in the region.",
        diveSites: otherSites,
      });
    }

    return regions;
  }

  async getRandomMatchup(winnerId?: number, winnerSide?: 'A' | 'B'): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    const allSites = await this.getAllDiveSites();
    
    if (allSites.length < 2) {
      throw new Error("Not enough dive sites for matchup");
    }

    // If we have a winner from previous vote, check if they should continue as champion
    if (winnerId && winnerSide) {
      const winner = allSites.find(site => site.id === winnerId);
      if (winner) {
        // Get opponents this champion hasn't faced yet
        const unfacedOpponents = await this.getUnfacedOpponents(winnerId, allSites);
        
        // If champion has faced all opponents, retire them and start fresh
        if (unfacedOpponents.length === 0) {
          // Champion retired - start new random matchup
          const shuffled = allSites.sort(() => 0.5 - Math.random());
          return {
            diveSiteA: shuffled[0],
            diveSiteB: shuffled[1],
          };
        }
        
        // Champion continues with a random unfaced opponent
        const randomOpponent = unfacedOpponents[Math.floor(Math.random() * unfacedOpponents.length)];
        
        if (winnerSide === 'A') {
          return {
            diveSiteA: winner,
            diveSiteB: randomOpponent,
          };
        } else {
          return {
            diveSiteA: randomOpponent,
            diveSiteB: winner,
          };
        }
      }
    }

    // Default random selection for new matchups
    const shuffled = allSites.sort(() => 0.5 - Math.random());
    return {
      diveSiteA: shuffled[0],
      diveSiteB: shuffled[1],
    };
  }

  // Helper method to find opponents a champion hasn't faced
  private async getUnfacedOpponents(championId: number, allSites: DiveSite[]): Promise<DiveSite[]> {
    // Get all votes where this site was the winner
    const championWins = await db
      .select({ loserId: votes.loserId })
      .from(votes)
      .where(eq(votes.winnerId, championId));
    
    // Extract IDs of sites this champion has already beaten
    const facedOpponentIds = new Set(championWins.map((vote: any) => vote.loserId));
    
    // Return sites this champion hasn't faced yet (excluding itself)
    return allSites.filter(site => 
      site.id !== championId && !facedOpponentIds.has(site.id)
    );
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    console.log(`[STORAGE] createVote called with data:`, insertVote);
    console.log(`[STORAGE] User ID from insertVote: ${insertVote.userId}`);
    
    // Get current ratings for ELO calculation
    const winner = await this.getDiveSite(insertVote.winnerId);
    const loser = await this.getDiveSite(insertVote.loserId);

    if (!winner || !loser) {
      throw new Error("Invalid dive site IDs");
    }

    console.log(`[STORAGE] Winner: ${winner.name} (Rating: ${winner.rating})`);
    console.log(`[STORAGE] Loser: ${loser.name} (Rating: ${loser.rating})`);

    // Use database transaction for atomic operations
    return await db.transaction(async (tx) => {
      // Calculate ELO change
      const eloChange = calculateEloChange(winner.rating, loser.rating);
      console.log(`[STORAGE] Calculated ELO change: ${eloChange} points`);

      const insertData = {
        winnerId: insertVote.winnerId,
        loserId: insertVote.loserId,
        pointsChanged: eloChange,
        userId: insertVote.userId,
      };
      
      console.log(`[STORAGE] Full SQL INSERT data:`, insertData);
      console.log(`[STORAGE] Executing INSERT INTO votes...`);

      // Create vote and update ratings atomically
      const [vote] = await tx
        .insert(votes)
        .values(insertData)
        .returning();

      console.log(`[STORAGE] Successfully inserted vote with ID ${vote.id}`);
      console.log(`[STORAGE] Inserted vote userId: ${vote.userId}`);

      // Update dive site ratings
      await Promise.all([
        tx
          .update(diveSites)
          .set({ 
            rating: winner.rating + eloChange,
            wins: winner.wins + 1,
          })
          .where(eq(diveSites.id, insertVote.winnerId)),
        
        tx
          .update(diveSites)
          .set({ 
            rating: loser.rating - eloChange,
            losses: loser.losses + 1,
          })
          .where(eq(diveSites.id, insertVote.loserId))
      ]);

      console.log(`[STORAGE] Updated ratings - Winner: ${winner.rating + eloChange}, Loser: ${loser.rating - eloChange}`);

      return vote;
    });
  }

  async getVotes(limit = 20): Promise<Vote[]> {
    return await db.select()
      .from(votes)
      .orderBy(desc(votes.timestamp))
      .limit(limit);
  }

  async getUserVotes(userId: string): Promise<Vote[]> {
    return await db.select()
      .from(votes)
      .where(eq(votes.userId, userId))
      .orderBy(desc(votes.timestamp));
  }

  async getRecentActivity(limit = 10): Promise<VoteActivity[]> {
    // Single efficient query with JOINs to get all data at once
    const recentActivity = await db
      .select({
        id: votes.id,
        pointsChanged: votes.pointsChanged,
        timestamp: votes.timestamp,
        winnerName: sql<string>`winner_site.name`,
        loserName: sql<string>`loser_site.name`,
      })
      .from(votes)
      .leftJoin(sql`${diveSites} AS winner_site`, sql`${votes.winnerId} = winner_site.id`)
      .leftJoin(sql`${diveSites} AS loser_site`, sql`${votes.loserId} = loser_site.id`)
      .orderBy(desc(votes.timestamp))
      .limit(limit);

    return recentActivity.map(activity => ({
      id: activity.id,
      winnerName: activity.winnerName || "Unknown",
      loserName: activity.loserName || "Unknown",
      pointsChanged: activity.pointsChanged,
      timestamp: activity.timestamp.toISOString(),
    }));
  }
}

export const storage = new DatabaseStorage();