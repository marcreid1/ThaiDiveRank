import { 
  users, diveSites, votes, 
  User, InsertUser, 
  DiveSite, InsertDiveSite, 
  Vote, InsertVote, 
  VoteActivity, DiveSiteRanking 
} from "@shared/schema";
import { db } from "./db";
import { IStorage, RegionDiveSites } from "./storage";
import { eq, desc, and, or, sql, asc } from "drizzle-orm";
import { calculateEloChange } from "./utils/elo";

export class DatabaseStorage implements IStorage {
  private lastUpdated: string;
  
  constructor() {
    this.lastUpdated = new Date().toISOString();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Dive site methods
  async getAllDiveSites(): Promise<DiveSite[]> {
    return await db.select().from(diveSites);
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
    // Get all dive sites ordered by rating
    const sites = await db.select().from(diveSites).orderBy(desc(diveSites.rating));
    
    // For now, we don't have a proper way to track rank changes in the database,
    // so we'll set all to 0 for the initial implementation
    const rankings: DiveSiteRanking[] = sites.map(site => ({
      ...site,
      rankChange: 0
    }));
    
    return { 
      rankings,
      lastUpdated: this.lastUpdated
    };
  }

  async getDiveSitesByRegion(): Promise<RegionDiveSites[]> {
    const allSites = await this.getAllDiveSites();
    
    // Organize sites by region
    const regions: RegionDiveSites[] = [
      // Similan Islands with subregions
      {
        region: "Similan Islands",
        description: "The Similan Islands are an archipelago of eleven islands in the Andaman Sea, Thailand.",
        diveSites: [],
        subregions: [
          {
            region: "North",
            description: "Northern dive sites of the Similan Islands",
            diveSites: allSites.filter(site => 
              site.location.includes("North") && 
              site.location.includes("Similan Islands") &&
              !site.location.includes("Surin")
            )
          },
          {
            region: "Central",
            description: "Central dive sites of the Similan Islands",
            diveSites: allSites.filter(site => 
              site.location.includes("Central") && 
              site.location.includes("Similan Islands") &&
              !site.location.includes("Surin")
            )
          },
          {
            region: "South",
            description: "Southern dive sites of the Similan Islands",
            diveSites: allSites.filter(site => 
              site.location.includes("South") && 
              site.location.includes("Similan Islands") &&
              !site.location.includes("Surin")
            )
          }
        ]
      },
      // Surin Islands with subregions
      {
        region: "Surin Islands",
        description: "The Surin Islands are an archipelago of five islands in the Andaman Sea, Thailand.",
        diveSites: [],
        subregions: [
          {
            region: "North",
            description: "Northern dive sites of the Surin Islands",
            diveSites: allSites.filter(site => 
              site.location.includes("North") && 
              site.location.includes("Surin Islands")
            )
          },
          {
            region: "South",
            description: "Southern dive sites of the Surin Islands",
            diveSites: allSites.filter(site => 
              site.location.includes("South") && 
              site.location.includes("Surin Islands")
            )
          }
        ]
      },
      // Extended Park
      {
        region: "Extended Park",
        description: "Additional dive sites in the extended park area.",
        diveSites: allSites.filter(site => 
          site.name.includes("Richelieu Rock")
        )
      }
    ];
    
    return regions;
  }

  // Matchup methods
  async getRandomMatchup(specificWinnerId?: number): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    const allSites = await this.getAllDiveSites();
    
    // Use a specific winner site if provided, otherwise choose one randomly
    let diveSiteA: DiveSite;
    if (specificWinnerId) {
      const site = allSites.find(s => s.id === specificWinnerId);
      if (!site) {
        // If not found, pick a random one
        diveSiteA = allSites[Math.floor(Math.random() * allSites.length)];
      } else {
        diveSiteA = site;
      }
    } else {
      diveSiteA = allSites[Math.floor(Math.random() * allSites.length)];
    }
    
    // For diveSiteB, choose one from the remaining sites, ideally one that hasn't
    // been matched against diveSiteA recently
    const recentVotes = await db
      .select()
      .from(votes)
      .where(
        or(
          eq(votes.winnerId, diveSiteA.id),
          eq(votes.loserId, diveSiteA.id)
        )
      )
      .orderBy(desc(votes.timestamp))
      .limit(allSites.length / 2); // Use half the sites to determine recency
      
    // Get IDs that have been matched against the chosen site recently
    const recentlyMatchedIds = new Set<number>();
    recentVotes.forEach(vote => {
      if (vote.winnerId === diveSiteA.id) {
        recentlyMatchedIds.add(vote.loserId);
      } else if (vote.loserId === diveSiteA.id) {
        recentlyMatchedIds.add(vote.winnerId);
      }
    });
    
    // Choose a site that hasn't been matched recently, if possible
    const potentialOpponents = allSites.filter(site => 
      site.id !== diveSiteA.id && 
      !recentlyMatchedIds.has(site.id)
    );
    
    // If we have potential opponents that haven't been matched recently, use those
    // Otherwise, just select any opponent that's not the same as diveSiteA
    const opponentPool = potentialOpponents.length > 0 
      ? potentialOpponents 
      : allSites.filter(site => site.id !== diveSiteA.id);
    
    const diveSiteB = opponentPool[Math.floor(Math.random() * opponentPool.length)];
    
    return { diveSiteA, diveSiteB };
  }

  // Vote methods
  async createVote(insertVote: InsertVote): Promise<Vote> {
    // Calculate Elo changes
    const [winner] = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.id, insertVote.winnerId));
      
    const [loser] = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.id, insertVote.loserId));
    
    if (!winner || !loser) {
      throw new Error('Winner or loser not found');
    }
    
    // Calculate new ELO ratings
    const pointsChanged = calculateEloChange(winner.rating, loser.rating);
    const newWinnerRating = winner.rating + pointsChanged;
    const newLoserRating = loser.rating - pointsChanged;
    
    // Update the vote object with points changed
    const voteWithPoints = {
      ...insertVote,
      pointsChanged,
    };
    
    // Insert the vote
    const [vote] = await db
      .insert(votes)
      .values(voteWithPoints)
      .returning();
    
    // Update dive site ratings, wins, and losses
    await db
      .update(diveSites)
      .set({ 
        rating: newWinnerRating,
        wins: winner.wins + 1
      })
      .where(eq(diveSites.id, winner.id));
      
    await db
      .update(diveSites)
      .set({ 
        rating: newLoserRating,
        losses: loser.losses + 1
      })
      .where(eq(diveSites.id, loser.id));
    
    // Update lastUpdated
    this.lastUpdated = new Date().toISOString();
    
    return vote;
  }

  async getVotes(limit = 20): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .orderBy(desc(votes.timestamp))
      .limit(limit);
  }

  async getRecentActivity(limit = 10): Promise<VoteActivity[]> {
    // Join votes with dive sites to get names
    const recentVotes = await db
      .select({
        id: votes.id,
        winnerId: votes.winnerId,
        loserId: votes.loserId,
        pointsChanged: votes.pointsChanged,
        timestamp: votes.timestamp
      })
      .from(votes)
      .orderBy(desc(votes.timestamp))
      .limit(limit);
    
    // Collect all dive site IDs
    const diveSiteIds = new Set<number>();
    recentVotes.forEach(vote => {
      diveSiteIds.add(vote.winnerId);
      diveSiteIds.add(vote.loserId);
    });
    
    // Fetch all needed dive sites in one query
    const diveSiteIdsArray = Array.from(diveSiteIds);
    const sites = await db
      .select({
        id: diveSites.id,
        name: diveSites.name
      })
      .from(diveSites)
      .where(
        sql`${diveSites.id} = ANY(ARRAY[${diveSiteIdsArray.join(',')}]::int[])`
      );
    
    // Create a map for faster lookups
    const sitesMap = new Map<number, string>();
    sites.forEach(site => {
      sitesMap.set(site.id, site.name);
    });
    
    // Convert to VoteActivity objects
    const activities: VoteActivity[] = recentVotes.map(vote => ({
      id: vote.id,
      winnerName: sitesMap.get(vote.winnerId) || `Site #${vote.winnerId}`,
      loserName: sitesMap.get(vote.loserId) || `Site #${vote.loserId}`,
      pointsChanged: vote.pointsChanged,
      timestamp: vote.timestamp.toISOString()
    }));
    
    return activities;
  }
}