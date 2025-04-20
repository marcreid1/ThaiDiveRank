import { DiveSite, InsertDiveSite, Vote, InsertVote, User, InsertUser, VoteActivity, DiveSiteRanking } from "@shared/schema";

// Modify the interface with CRUD methods
export interface IStorage {
  // User methods (kept from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Dive site methods
  getAllDiveSites(): Promise<DiveSite[]>;
  getDiveSite(id: number): Promise<DiveSite | undefined>;
  createDiveSite(diveSite: InsertDiveSite): Promise<DiveSite>;
  updateDiveSite(id: number, diveSite: Partial<DiveSite>): Promise<DiveSite | undefined>;
  getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }>;
  
  // Matchup methods
  getRandomMatchup(): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }>;
  
  // Vote methods
  createVote(vote: InsertVote): Promise<Vote>;
  getVotes(limit?: number): Promise<Vote[]>;
  getRecentActivity(limit?: number): Promise<VoteActivity[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private diveSites: Map<number, DiveSite>;
  private votes: Map<number, Vote>;
  private rankChanges: Map<number, number>; // Tracks rank changes for dive sites
  private lastUpdated: string;
  
  private userCurrentId: number;
  private diveSiteCurrentId: number;
  private voteCurrentId: number;

  constructor() {
    this.users = new Map();
    this.diveSites = new Map();
    this.votes = new Map();
    this.rankChanges = new Map();
    this.lastUpdated = new Date().toISOString();
    
    this.userCurrentId = 1;
    this.diveSiteCurrentId = 1;
    this.voteCurrentId = 1;
    
    // Initialize with some example dive sites
    this.initializeDiveSites();
  }

  private initializeDiveSites() {
    const initialDiveSites: InsertDiveSite[] = [
      {
        name: "Richelieu Rock",
        location: "Surin Islands, Andaman Sea",
        types: ["Reef", "Wall", "Pinnacle"],
        description: "Famous for whale sharks and rich marine biodiversity. One of Thailand's premier dive sites with exceptional visibility.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Koh Tachai Pinnacle",
        location: "Similan Islands, Andaman Sea",
        types: ["Reef", "Pinnacle"],
        description: "A submerged granite pinnacle with large schools of barracuda, trevally and occasional manta rays.",
        imageUrl: "https://images.unsplash.com/photo-1580019542155-247062e19ce4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "HTMS Chang Wreck",
        location: "Koh Chang, Eastern Gulf",
        types: ["Wreck", "Ocean"],
        description: "An artificial reef created from a decommissioned Thai Navy vessel, now home to abundant marine life.",
        imageUrl: "https://images.unsplash.com/photo-1557111513-7a0abb62ae83?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Shark Point",
        location: "Phuket, Andaman Sea",
        types: ["Reef", "Wall"],
        description: "Named for the leopard sharks often seen resting on the sandy bottom. Rich soft corals and anemones.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-8dd44dcb960d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Koh Bon",
        location: "Similan National Park",
        types: ["Reef", "Wall", "Drift"],
        description: "Known for manta ray sightings and a dramatic wall covered in hard and soft corals.",
        imageUrl: "https://images.unsplash.com/photo-1544572571-ab94fd872ce4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Hin Muang",
        location: "Krabi, Andaman Sea",
        types: ["Reef", "Drift", "Pinnacle"],
        description: "The 'Purple Rock' gets its name from the purple soft corals covering the pinnacle. Big pelagics frequent these waters.",
        imageUrl: "https://images.unsplash.com/photo-1682687980961-78fa83781450?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Boonsung Wreck",
        location: "Khao Lak, Andaman Sea",
        types: ["Wreck", "Reef"],
        description: "A shallow wreck teeming with marine life, perfect for both beginner divers and photographers.",
        imageUrl: "https://images.unsplash.com/photo-1534766438357-2b6e1e72e7b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Koh Haa",
        location: "Krabi, Andaman Sea",
        types: ["Cave", "Reef", "Beach"],
        description: "Five limestone islands with swim-throughs, caverns, and vertical walls. Crystal clear waters with high visibility.",
        imageUrl: "https://images.unsplash.com/photo-1520302719023-bc01804e7e5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "White Rock",
        location: "Koh Tao, Gulf of Thailand",
        types: ["Reef", "Pinnacle"],
        description: "A series of submerged granite boulders with diverse coral formations and reliable turtle sightings.",
        imageUrl: "https://images.unsplash.com/photo-1551244072-5d12893278ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Twins",
        location: "Koh Tao, Gulf of Thailand",
        types: ["Reef", "Pinnacle", "Ocean"],
        description: "Two close pinnacles with swim-throughs and a sandy channel. Perfect for training dives and spotting reef fish.",
        imageUrl: "https://images.unsplash.com/photo-1559983435-fe247b58ccbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Stonehenge",
        location: "Koh Lipe, Andaman Sea",
        types: ["Reef", "Pinnacle", "Drift", "Wall", "Sandy bottom"],
        description: "Named for the rock formations resembling the famous monument. Great spot for macro photography.",
        imageUrl: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "HTMS Mataporn Shipwreck",
        location: "Chumphon, Gulf of Thailand",
        types: ["Wreck", "Ocean"],
        description: "A purposely sunk vessel that's become an artificial reef, attracting schools of snappers and jacks.",
        imageUrl: "https://images.unsplash.com/photo-1579189880841-43ddba8d2746?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      }
    ];

    initialDiveSites.forEach(site => {
      this.createDiveSite(site);
    });
  }

  // User methods (from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Dive site methods
  async getAllDiveSites(): Promise<DiveSite[]> {
    return Array.from(this.diveSites.values());
  }

  async getDiveSite(id: number): Promise<DiveSite | undefined> {
    return this.diveSites.get(id);
  }

  async createDiveSite(insertDiveSite: InsertDiveSite): Promise<DiveSite> {
    const id = this.diveSiteCurrentId++;
    const diveSite: DiveSite = {
      ...insertDiveSite,
      id,
      rating: 1500,
      wins: 0,
      losses: 0,
      createdAt: new Date()
    };
    this.diveSites.set(id, diveSite);
    this.rankChanges.set(id, 0); // Initialize rank change to 0
    return diveSite;
  }

  async updateDiveSite(id: number, diveSiteUpdate: Partial<DiveSite>): Promise<DiveSite | undefined> {
    const existingDiveSite = this.diveSites.get(id);
    if (!existingDiveSite) return undefined;

    const updatedDiveSite = { ...existingDiveSite, ...diveSiteUpdate };
    this.diveSites.set(id, updatedDiveSite);
    return updatedDiveSite;
  }

  async getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }> {
    // Get all dive sites and sort by rating
    const diveSites = Array.from(this.diveSites.values());
    const rankings = diveSites
      .sort((a, b) => b.rating - a.rating)
      .map(site => ({
        ...site,
        rankChange: this.rankChanges.get(site.id) || 0
      }));

    return {
      rankings,
      lastUpdated: this.lastUpdated
    };
  }

  // Matchup methods
  async getRandomMatchup(): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    const allDiveSites = Array.from(this.diveSites.values());
    
    if (allDiveSites.length < 2) {
      throw new Error("Not enough dive sites to create a matchup");
    }
    
    // Pick two random dive sites
    const shuffled = [...allDiveSites].sort(() => 0.5 - Math.random());
    const diveSiteA = shuffled[0];
    const diveSiteB = shuffled[1];
    
    return { diveSiteA, diveSiteB };
  }

  // Vote methods
  async createVote(insertVote: InsertVote): Promise<Vote> {
    // Create the vote
    const id = this.voteCurrentId++;
    const vote: Vote = {
      ...insertVote,
      id,
      timestamp: new Date()
    };
    this.votes.set(id, vote);
    
    // Update dive site stats
    const winner = this.diveSites.get(insertVote.winnerId);
    const loser = this.diveSites.get(insertVote.loserId);
    
    if (winner && loser) {
      this.updateDiveSite(winner.id, {
        wins: winner.wins + 1,
        rating: winner.rating + insertVote.pointsChanged
      });
      
      this.updateDiveSite(loser.id, {
        losses: loser.losses + 1,
        rating: loser.rating - insertVote.pointsChanged
      });
      
      // Update rankings and rank changes
      this.updateRankings();
    }
    
    return vote;
  }

  async getVotes(limit = 20): Promise<Vote[]> {
    const allVotes = Array.from(this.votes.values());
    return allVotes
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getRecentActivity(limit = 10): Promise<VoteActivity[]> {
    const recentVotes = await this.getVotes(limit);
    const activities: VoteActivity[] = [];
    
    for (const vote of recentVotes) {
      const winner = await this.getDiveSite(vote.winnerId);
      const loser = await this.getDiveSite(vote.loserId);
      
      if (winner && loser) {
        activities.push({
          id: vote.id,
          winnerName: winner.name,
          loserName: loser.name,
          pointsChanged: vote.pointsChanged,
          timestamp: vote.timestamp.toISOString()
        });
      }
    }
    
    return activities;
  }

  // Helper method to update rankings after votes
  private updateRankings() {
    const previousRankings = Array.from(this.diveSites.values())
      .sort((a, b) => b.rating - a.rating)
      .map(site => site.id);
    
    const currentRankings = Array.from(this.diveSites.values())
      .sort((a, b) => b.rating - a.rating)
      .map(site => site.id);
    
    // Calculate rank changes
    currentRankings.forEach((id, newIndex) => {
      const oldIndex = previousRankings.indexOf(id);
      if (oldIndex !== -1) {
        // Positive value means the site moved up in rankings
        this.rankChanges.set(id, oldIndex - newIndex);
      }
    });
    
    this.lastUpdated = new Date().toISOString();
  }
}

export const storage = new MemStorage();
