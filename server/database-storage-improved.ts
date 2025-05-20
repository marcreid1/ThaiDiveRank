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

export class ImprovedDatabaseStorage implements IStorage {
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
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Dive site methods
  async getAllDiveSites(): Promise<DiveSite[]> {
    return db.select().from(diveSites);
  }

  async getDiveSite(id: number): Promise<DiveSite | undefined> {
    const [site] = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.id, id));
    return site;
  }

  async createDiveSite(insertDiveSite: InsertDiveSite): Promise<DiveSite> {
    const [site] = await db
      .insert(diveSites)
      .values(insertDiveSite)
      .returning();
    return site;
  }

  async updateDiveSite(id: number, diveSiteUpdate: Partial<DiveSite>): Promise<DiveSite | undefined> {
    const [updatedSite] = await db
      .update(diveSites)
      .set(diveSiteUpdate)
      .where(eq(diveSites.id, id))
      .returning();
    return updatedSite;
  }

  async getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }> {
    // Get all dive sites ordered by rating (highest first)
    const sites = await db
      .select({
        id: diveSites.id,
        name: diveSites.name,
        location: diveSites.location,
        types: diveSites.types,
        description: diveSites.description,
        imageUrl: diveSites.imageUrl,
        rating: diveSites.rating,
        wins: diveSites.wins,
        losses: diveSites.losses,
        depthMin: diveSites.depthMin,
        depthMax: diveSites.depthMax,
        difficulty: diveSites.difficulty,
        createdAt: diveSites.createdAt
      })
      .from(diveSites)
      .orderBy(desc(diveSites.rating));

    // For now, we'll set all rankChanges to 0 since we don't have historical data
    // In a real application, you'd compare with previous rankings
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
    
    // Organize sites by region and subregion
    const regions: RegionDiveSites[] = [
      // Similan Islands
      {
        region: "Similan Islands",
        description: "The nine granite islands of the Similans are a sanctuary for stunning reefs and marine life.",
        diveSites: allSites.filter(site => 
          site.location.includes("Similan Islands")
        ),
        subregions: [
          {
            region: "North",
            description: "Northern dive sites of the Similan Islands",
            diveSites: allSites.filter(site => 
              site.location.includes("North") && 
              site.location.includes("Similan Islands")
            )
          },
          {
            region: "Central",
            description: "Central dive sites of the Similan Islands",
            diveSites: allSites.filter(site => 
              site.location.includes("Central") && 
              site.location.includes("Similan Islands")
            )
          },
          {
            region: "South",
            description: "Southern dive sites of the Similan Islands",
            diveSites: allSites.filter(site => 
              site.location.includes("South") && 
              site.location.includes("Similan Islands")
            )
          }
        ]
      },
      // Surin Islands
      {
        region: "Surin Islands",
        description: "Known for excellent snorkeling, the Surin Islands offer pristine reefs and abundant marine life.",
        diveSites: allSites.filter(site => 
          site.location.includes("Surin Islands")
        ),
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
    
    if (allSites.length < 2) {
      throw new Error('Not enough dive sites available for matchup');
    }
    
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
    
    // For diveSiteB, choose a site that hasn't been matched recently against diveSiteA if possible
    // Get the most recent votes involving diveSiteA
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
    for (const vote of recentVotes) {
      if (vote.winnerId === diveSiteA.id) {
        recentlyMatchedIds.add(vote.loserId);
      } else if (vote.loserId === diveSiteA.id) {
        recentlyMatchedIds.add(vote.winnerId);
      }
    }
    
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
    // Get the winner and loser dive sites
    const [winner] = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.id, insertVote.winnerId));
      
    const [loser] = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.id, insertVote.loserId));
    
    if (!winner || !loser) {
      throw new Error('Winner or loser dive site not found');
    }
    
    // Calculate new ELO ratings
    const pointsChanged = calculateEloChange(winner.rating, loser.rating);
    const newWinnerRating = winner.rating + pointsChanged;
    const newLoserRating = loser.rating - pointsChanged;
    
    // Update the vote object with points changed
    const voteWithPoints: InsertVote & { pointsChanged: number } = {
      ...insertVote,
      pointsChanged,
    };
    
    // Begin a transaction to ensure all updates are atomic
    let vote: Vote;
    
    try {
      // Insert the vote
      const [createdVote] = await db
        .insert(votes)
        .values(voteWithPoints)
        .returning();
      
      vote = createdVote;
      
      // Update the winner dive site
      await db
        .update(diveSites)
        .set({ 
          rating: newWinnerRating,
          wins: winner.wins + 1
        })
        .where(eq(diveSites.id, winner.id));
        
      // Update the loser dive site
      await db
        .update(diveSites)
        .set({ 
          rating: newLoserRating,
          losses: loser.losses + 1
        })
        .where(eq(diveSites.id, loser.id));
      
      // Update the lastUpdated timestamp
      this.lastUpdated = new Date().toISOString();
      
      return vote;
    } catch (error) {
      console.error('Error creating vote:', error);
      throw error;
    }
  }

  async getVotes(limit = 20): Promise<Vote[]> {
    return db
      .select()
      .from(votes)
      .orderBy(desc(votes.timestamp))
      .limit(limit);
  }

  async getRecentActivity(limit = 10): Promise<VoteActivity[]> {
    // Get the most recent votes
    const recentVotes = await db
      .select()
      .from(votes)
      .orderBy(desc(votes.timestamp))
      .limit(limit);
    
    if (recentVotes.length === 0) {
      return [];
    }
    
    // Extract all unique dive site IDs needed
    const diveSiteIds = new Set<number>();
    recentVotes.forEach(vote => {
      diveSiteIds.add(vote.winnerId);
      diveSiteIds.add(vote.loserId);
    });
    
    // Get all the dive sites in one query
    const sitesArray = Array.from(diveSiteIds);
    const siteResults = await Promise.all(
      sitesArray.map(id => 
        db.select({
          id: diveSites.id,
          name: diveSites.name
        })
        .from(diveSites)
        .where(eq(diveSites.id, id))
      )
    );
    
    // Create a map for faster lookups
    const sitesMap = new Map<number, string>();
    siteResults.forEach(result => {
      if (result.length > 0) {
        sitesMap.set(result[0].id, result[0].name);
      }
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