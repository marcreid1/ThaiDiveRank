import { DiveSite, InsertDiveSite, Vote, InsertVote, User, InsertUser, VoteActivity, DiveSiteRanking } from "@shared/schema";

// Define the interface for region-based organization
export interface RegionDiveSites {
  region: string;
  description: string;
  diveSites: DiveSite[];
  subregions?: RegionDiveSites[];
}

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
  getDiveSitesByRegion(): Promise<RegionDiveSites[]>;
  
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
    
    // Initialize dive sites synchronously
    this.initializeDiveSites();
  }

  private initializeDiveSites() {
    // Initialize with the 43 dive sites from Similan and Surin Islands
    const initialDiveSites: (Omit<InsertDiveSite, 'id'> & { 
      id?: number, 
      depthMin: number, 
      depthMax: number, 
      difficulty: string
    })[] = [
      // Similan Islands sites (Island #1-9)
      {
        name: "Coral Gardens",
        location: "Ko Huyong (Island #1), Similan Islands",
        types: ["Coral Garden", "Reef"],
        description: "Shallow reef area featuring vibrant hard corals. Perfect for beginners.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 0,
        depthMax: 10,
        difficulty: "Beginner",
        rating: 1500,
        wins: 0,
        losses: 0
      },
      // Add more dive sites here...
      // ... [All other dive sites would be here] ...
    ];

    // Directly add to the map instead of using async methods
    initialDiveSites.forEach(site => {
      const id = this.diveSiteCurrentId++;
      
      const diveSite: DiveSite = {
        id,
        name: site.name,
        location: site.location,
        types: site.types,
        description: site.description,
        imageUrl: site.imageUrl,
        rating: site.rating || 1500,
        wins: site.wins || 0,
        losses: site.losses || 0,
        depthMin: site.depthMin,
        depthMax: site.depthMax,
        difficulty: site.difficulty,
        createdAt: new Date()
      };
      
      this.diveSites.set(id, diveSite);
    });
  }

  // User methods (from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
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
      depthMin: null,
      depthMax: null,
      difficulty: null,
      createdAt: new Date()
    };
    
    this.diveSites.set(id, diveSite);
    return diveSite;
  }

  async updateDiveSite(id: number, diveSiteUpdate: Partial<DiveSite>): Promise<DiveSite | undefined> {
    const diveSite = this.diveSites.get(id);
    
    if (!diveSite) {
      return undefined;
    }
    
    const updatedDiveSite = { ...diveSite, ...diveSiteUpdate };
    this.diveSites.set(id, updatedDiveSite);
    
    return updatedDiveSite;
  }

  async getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }> {
    // Get all dive sites sorted by rating (highest first)
    const diveSites = Array.from(this.diveSites.values());
    const sortedDiveSites = [...diveSites].sort((a, b) => b.rating - a.rating);
    
    // Map to rankings with rank change
    const rankings: DiveSiteRanking[] = sortedDiveSites.map((diveSite) => ({
      ...diveSite,
      rankChange: this.rankChanges.get(diveSite.id) || 0
    }));
    
    return {
      rankings,
      lastUpdated: this.lastUpdated
    };
  }

  async getDiveSitesByRegion(): Promise<RegionDiveSites[]> {
    const diveSites = Array.from(this.diveSites.values());
    const sitesBySection = new Map<string, DiveSite[]>();
    
    // Main region descriptions
    const mainRegionDescriptions: Record<string, string> = {
      "Similan Islands": "A chain of nine granite islands in the Andaman Sea, renowned for their boulder formations, colorful coral reefs, and exceptional underwater visibility. Designated as a Marine National Park since 1982.",
      
      "Surin Islands": "Located further north than the Similans, this pristine archipelago offers unspoiled diving with healthy coral reefs and a great diversity of marine life. The islands are renowned for their shallow hard coral gardens and tropical reef fish.",
      
      "Extended Park": "This section includes the legendary Richelieu Rock, one of the most celebrated dive sites in Thailand and known worldwide for its marine biodiversity and regular whale shark sightings."
    };
    
    // Sub-region descriptions
    const subRegionDescriptions: Record<string, string> = {
      "Similan Islands - South": "The southern islands (#1-4) feature pristine beaches, shallow coral gardens, and diverse marine life. Known for their accessibility and excellent diving conditions for beginners to intermediate levels.",
      
      "Similan Islands - Central": "The central islands (#5-7) offer an impressive mix of boulder formations, vibrant coral gardens, and deeper dive sites. This area bridges the gap between the more accessible southern sites and the advanced northern dive spots.",
      
      "Similan Islands - North": "The northern islands (#8-9) feature dramatic underwater topography with massive granite boulders, exciting swim-throughs, and intricate caverns. These sites often have stronger currents suitable for more experienced divers.",
      
      "Surin Islands - North": "The northern Surin Islands feature pristine shallow reefs with exceptional coral coverage and visibility. This area offers gentle conditions perfect for beginners and snorkelers with abundant reef fish and occasional turtle sightings.",
      
      "Surin Islands - South": "The southern Surin Islands provide varied diving environments from protected bays to exposed reefs. These sites offer diverse underwater topography and marine ecosystems suitable for different experience levels.",
      
      "Richelieu Rock": "This legendary horseshoe-shaped pinnacle in the open Andaman Sea is considered Thailand's premier dive site. Famous for its exceptional biodiversity, vibrant soft corals, and frequent whale shark encounters."
    };
    
    // Determine which section each dive site belongs to
    diveSites.forEach(site => {
      const location = site.location;
      let section: string;
      
      // Handle special case for Richelieu Rock
      if (site.name === "Richelieu Rock" || location.includes("Extended Park")) {
        section = "Richelieu Rock";
      }
      // Determine Similan Islands sections
      else if (location.includes("Island #1") || location.includes("Island #2") || 
          location.includes("Island #3") || location.includes("Island #4")) {
        section = "Similan Islands - South";
      }
      else if (location.includes("Island #5") || location.includes("Island #6") || 
          location.includes("Island #7")) {
        section = "Similan Islands - Central";
      }
      else if (location.includes("Island #8") || location.includes("Island #9")) {
        section = "Similan Islands - North";
      }
      // Properly categorize Island #10, #11, Ko Bon, and Ko Tachai to Surin Islands
      else if (location.includes("Island #10") || location.includes("Island #11") || 
          location.includes("Ko Bon") || location.includes("Ko Tachai")) {
        // These locations belong to Surin Islands, not Similan Islands
        if (location.toLowerCase().includes("north") || location.includes("Ko Tachai")) {
          section = "Surin Islands - North";
        } else {
          section = "Surin Islands - South";
        }
      }
      // Determine other Surin Islands sections
      else if (location.includes("Ko Surin Nuea") || 
          (location.includes("Surin") && location.includes("Island #1"))) {
        section = "Surin Islands - North";
      }
      else if (location.includes("Ko Surin Tai") || location.includes("Ko Khai") || 
          location.includes("Ko Klang") || location.includes("Koh Chi")) {
        section = "Surin Islands - South";
      }
      else {
        // Default catchall (shouldn't be needed with our 43 sites)
        section = "Other Thailand Locations";
      }
      
      if (!sitesBySection.has(section)) {
        sitesBySection.set(section, []);
      }
      
      sitesBySection.get(section)!.push(site);
    });
    
    // Organize sections into main groups as requested
    const mainGroups: RegionDiveSites[] = [];
    
    // 1. Similan Islands with subregions
    const similarSubregions: RegionDiveSites[] = [];
    
    if (sitesBySection.has("Similan Islands - South")) {
      similarSubregions.push({
        region: "South (Islands #1-4)",
        description: subRegionDescriptions["Similan Islands - South"],
        diveSites: sitesBySection.get("Similan Islands - South")!.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
    
    if (sitesBySection.has("Similan Islands - Central")) {
      similarSubregions.push({
        region: "Central (Islands #5-7)",
        description: subRegionDescriptions["Similan Islands - Central"],
        diveSites: sitesBySection.get("Similan Islands - Central")!.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
    
    if (sitesBySection.has("Similan Islands - North")) {
      similarSubregions.push({
        region: "North (Islands #8-9)",
        description: subRegionDescriptions["Similan Islands - North"],
        diveSites: sitesBySection.get("Similan Islands - North")!.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
    
    mainGroups.push({
      region: "Similan Islands",
      description: mainRegionDescriptions["Similan Islands"],
      diveSites: [],
      subregions: similarSubregions
    });
    
    // 2. Surin Islands with subregions
    const surinSubregions: RegionDiveSites[] = [];
    
    if (sitesBySection.has("Surin Islands - North")) {
      surinSubregions.push({
        region: "North",
        description: subRegionDescriptions["Surin Islands - North"],
        diveSites: sitesBySection.get("Surin Islands - North")!.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
    
    if (sitesBySection.has("Surin Islands - South")) {
      surinSubregions.push({
        region: "South",
        description: subRegionDescriptions["Surin Islands - South"],
        diveSites: sitesBySection.get("Surin Islands - South")!.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
    
    mainGroups.push({
      region: "Surin Islands",
      description: mainRegionDescriptions["Surin Islands"],
      diveSites: [],
      subregions: surinSubregions
    });
    
    // 3. Extended Park (Richelieu Rock)
    if (sitesBySection.has("Richelieu Rock")) {
      mainGroups.push({
        region: "Extended Park",
        description: mainRegionDescriptions["Extended Park"],
        diveSites: sitesBySection.get("Richelieu Rock")!.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
    
    return mainGroups;
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
    const id = this.voteCurrentId++;
    
    const vote: Vote = {
      ...insertVote,
      id,
      createdAt: new Date()
    };
    
    this.votes.set(id, vote);
    
    // Update dive site ratings based on ELO algorithm (K-factor of 32)
    const winnerDiveSite = this.diveSites.get(insertVote.winnerId);
    const loserDiveSite = this.diveSites.get(insertVote.loserId);
    
    if (winnerDiveSite && loserDiveSite) {
      // Calculate using the ELO algorithm from utils/elo.ts
      const expectedWinnerScore = 1 / (1 + Math.pow(10, (loserDiveSite.rating - winnerDiveSite.rating) / 400));
      const expectedLoserScore = 1 / (1 + Math.pow(10, (winnerDiveSite.rating - loserDiveSite.rating) / 400));
      
      const kFactor = 32;
      
      // Calculate new ratings
      const winnerRatingChange = Math.round(kFactor * (1 - expectedWinnerScore));
      const loserRatingChange = Math.round(kFactor * (0 - expectedLoserScore));
      
      // Keep track of rating changes for rankings
      if (!this.rankChanges.has(winnerDiveSite.id)) {
        this.rankChanges.set(winnerDiveSite.id, 0);
      }
      
      if (!this.rankChanges.has(loserDiveSite.id)) {
        this.rankChanges.set(loserDiveSite.id, 0);
      }
      
      // Update dive site ratings
      this.updateDiveSite(winnerDiveSite.id, { 
        rating: winnerDiveSite.rating + winnerRatingChange,
        wins: winnerDiveSite.wins + 1
      });
      
      this.updateDiveSite(loserDiveSite.id, { 
        rating: loserDiveSite.rating + loserRatingChange,
        losses: loserDiveSite.losses + 1
      });
      
      // Update the lastUpdated timestamp
      this.lastUpdated = new Date().toISOString();
      
      // Update ranking changes (for UI display)
      this.rankChanges.set(winnerDiveSite.id, (this.rankChanges.get(winnerDiveSite.id) || 0) + winnerRatingChange);
      this.rankChanges.set(loserDiveSite.id, (this.rankChanges.get(loserDiveSite.id) || 0) + loserRatingChange);
      
      // Recalculate rankings
      this.updateRankings();
    }
    
    return vote;
  }

  async getVotes(limit = 20): Promise<Vote[]> {
    const votes = Array.from(this.votes.values());
    return votes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }

  async getRecentActivity(limit = 10): Promise<VoteActivity[]> {
    const votes = await this.getVotes(limit);
    const activities: VoteActivity[] = [];
    
    for (const vote of votes) {
      const winner = this.diveSites.get(vote.winnerId);
      const loser = this.diveSites.get(vote.loserId);
      
      if (winner && loser) {
        activities.push({
          id: vote.id,
          winnerName: winner.name,
          loserName: loser.name,
          pointsChanged: Math.abs(Math.round((winner.rating - loser.rating) * 0.1)), // Simplified points calculation
          timestamp: vote.createdAt.toISOString()
        });
      }
    }
    
    return activities;
  }

  private updateRankings() {
    // This method is called after votes to update any necessary ranking stats
    // Currently all the work is done in createVote, but this could be expanded if needed
  }
}

export const storage = new MemStorage();