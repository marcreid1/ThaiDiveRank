import { users, diveSites, votes, userSessions, type User, type InsertUser, type DiveSite, type InsertDiveSite, type Vote, type InsertVote, type UserSession, type InsertUserSession, type DiveSiteRanking, type VoteActivity } from "@shared/schema";
import { calculateEloChange } from "./utils/elo";
import { db } from "./db";
import { eq, desc, sql, inArray, gt, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface RegionDiveSites {
  region: string;
  description: string;
  diveSites: DiveSite[];
  subregions?: RegionDiveSites[];
}

export interface IStorage {
  // User methods
  getUser(id: number, requestingUserId?: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(username: string, password: string): Promise<User | null>;

  // Session methods
  createUserSession(sessionId: string, userId: number): Promise<UserSession>;
  getUserFromSession(sessionId: string): Promise<User | null>;
  deleteSession(sessionId: string, userId?: number): Promise<void>;
  
  // Dive site methods (public data)
  getAllDiveSites(): Promise<DiveSite[]>;
  getDiveSite(id: number): Promise<DiveSite | undefined>;
  createDiveSite(diveSite: InsertDiveSite): Promise<DiveSite>;
  updateDiveSite(id: number, diveSite: Partial<DiveSite>): Promise<DiveSite | undefined>;
  getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }>;
  getDiveSitesByRegion(): Promise<RegionDiveSites[]>;
  
  // Matchup methods
  getRandomMatchup(winnerId?: number, winnerSide?: 'A' | 'B'): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }>;
  
  // Vote methods with user authorization
  createVote(vote: InsertVote, requestingUserId: number): Promise<Vote>;
  getUserVotes(userId: number, requestingUserId: number, limit?: number): Promise<Vote[]>;
  getVotes(limit?: number): Promise<Vote[]>; // Admin only - returns anonymized data
  getRecentActivity(limit?: number): Promise<VoteActivity[]>; // Public activity without user details
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number, requestingUserId?: number): Promise<User | undefined> {
    // Users can only access their own profile data
    if (requestingUserId && requestingUserId !== id) {
      throw new Error("Unauthorized: Users can only access their own data");
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return null;
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }
    
    // Update last login timestamp
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));
    
    return user;
  }

  async createUserSession(sessionId: string, userId: number): Promise<UserSession> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const [session] = await db.insert(userSessions).values({
      sessionId,
      userId,
      expiresAt,
    }).returning();

    return session;
  }

  async getUserFromSession(sessionId: string): Promise<User | null> {
    const [session] = await db
      .select({
        user: users,
      })
      .from(userSessions)
      .innerJoin(users, eq(userSessions.userId, users.id))
      .where(eq(userSessions.sessionId, sessionId))
      .limit(1);

    return session?.user || null;
  }

  async deleteSession(sessionId: string, userId?: number): Promise<void> {
    if (userId) {
      // User can only delete their own sessions
      await db.delete(userSessions)
        .where(and(
          eq(userSessions.sessionId, sessionId),
          eq(userSessions.userId, userId)
        ));
    } else {
      // Admin or system can delete any session
      await db.delete(userSessions).where(eq(userSessions.sessionId, sessionId));
    }
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
          description: "The northern Surin Islands have excellent shallow reefs with diverse coral species and abundant reef fish, ideal for beginners and underwater photographers.",
          diveSites: northSurinSites,
        });
      }
      
      // South Surin Islands
      const southSurinSites = surinSites.filter(site => site.location.includes("South, Surin"));
      if (southSurinSites.length > 0) {
        surinSubregions.push({
          region: "South",
          description: "The southern Surin Islands feature more varied underwater landscapes including pinnacles, offering opportunities to see larger marine life.",
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

    // If we have a winner from previous vote, keep them on the same side
    if (winnerId && winnerSide) {
      const winner = allSites.find(site => site.id === winnerId);
      if (winner) {
        // Get a random opponent (excluding the winner)
        const opponents = allSites.filter(site => site.id !== winnerId);
        const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
        
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

  async createVote(insertVote: InsertVote, requestingUserId: number): Promise<Vote> {
    // Ensure the vote is being created by the authenticated user
    if (insertVote.userId && insertVote.userId !== requestingUserId) {
      throw new Error("Unauthorized: Users can only create votes for themselves");
    }
    // Get current ratings for ELO calculation
    const winner = await this.getDiveSite(insertVote.winnerId);
    const loser = await this.getDiveSite(insertVote.loserId);

    if (!winner || !loser) {
      throw new Error("Invalid dive site IDs");
    }

    // Use database transaction for atomic operations
    return await db.transaction(async (tx) => {
      // Calculate ELO change
      const eloChange = calculateEloChange(winner.rating, loser.rating);

      // Create vote and update ratings atomically
      const [vote] = await tx
        .insert(votes)
        .values({
          winnerId: insertVote.winnerId,
          loserId: insertVote.loserId,
          pointsChanged: eloChange,
          userId: requestingUserId, // Always use the authenticated user
        })
        .returning();

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

      return vote;
    });
  }

  async getUserVotes(userId: number, requestingUserId: number, limit = 20): Promise<Vote[]> {
    // Users can only access their own votes
    if (userId !== requestingUserId) {
      throw new Error("Unauthorized: Users can only access their own votes");
    }
    
    return await db.select()
      .from(votes)
      .where(eq(votes.userId, userId))
      .orderBy(desc(votes.timestamp))
      .limit(limit);
  }

  async getVotes(limit = 20): Promise<Vote[]> {
    // Return votes without exposing user IDs - for admin/analytics only
    const results = await db.select({
      id: votes.id,
      winnerId: votes.winnerId,
      loserId: votes.loserId,
      pointsChanged: votes.pointsChanged,
      timestamp: votes.timestamp,
    }).from(votes)
      .orderBy(desc(votes.timestamp))
      .limit(limit);
    
    // Map to Vote type with null userId and sessionId
    return results.map(vote => ({
      ...vote,
      userId: null,
      sessionId: null
    }));
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
      username: "Anonymous User",
    }));
  }


}

export const storage = new DatabaseStorage();