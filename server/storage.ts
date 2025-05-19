import { DiveSite, InsertDiveSite, Vote, InsertVote, User, InsertUser, VoteActivity, DiveSiteRanking } from "@shared/schema";

// Modify the interface with CRUD methods
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
    
    // Initialize with some example dive sites
    this.initializeDiveSites();
  }

  private initializeDiveSites() {
    // Initialize with the 43 dive sites from Similan and Surin Islands
    const initialDiveSites: (InsertDiveSite & { depthMin: number, depthMax: number, difficulty: string })[] = [
      // Similan Islands sites (Island #1-9)
      {
        name: "Coral Gardens",
        location: "Ko Huyong (Island #1), Similan Islands",
        types: ["Coral Garden", "Reef"],
        description: "Shallow reef area featuring vibrant hard corals. Perfect for beginners.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 0,
        depthMax: 10,
        difficulty: "Beginner"
      },
      {
        name: "Shark Fin Reef",
        location: "Ko Payan (Island #3), Similan Islands",
        types: ["Reef"],
        description: "Distinctive rock formation resembling a shark fin. Suitable for intermediate divers.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-92ab472cad5d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 35,
        difficulty: "Intermediate"
      },
      {
        name: "Boulder City",
        location: "Ko Payan (Island #3), Similan Islands",
        types: ["Boulder", "Reef"],
        description: "Massive underwater boulders create an impressive underwater landscape. For advanced divers.",
        imageUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 15,
        depthMax: 40,
        difficulty: "Advanced"
      },
      {
        name: "Princess Bay",
        location: "Ko Miang (Island #4), Similan Islands",
        types: ["Bay", "Reef"],
        description: "Shallow bay with coral gardens, ideal for beginners and photographers.",
        imageUrl: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 18,
        difficulty: "Beginner"
      },
      {
        name: "Honeymoon Bay",
        location: "Ko Miang (Island #4), Similan Islands",
        types: ["Bay", "Reef"],
        description: "Popular for night dives with diverse marine life. Good for intermediate divers.",
        imageUrl: "https://images.unsplash.com/photo-1570739154793-6d4b04e27876?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      {
        name: "Bird Rock (Chinese Wall)",
        location: "Ko Miang (Island #4), Similan Islands",
        types: ["Wall", "Reef"],
        description: "Large granite boulders which form a wall-like structure with abundant marine life.",
        imageUrl: "https://images.unsplash.com/photo-1534766438357-2b6e1e72e7b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      {
        name: "Stonehenge",
        location: "Ko Miang (Island #4), Similan Islands",
        types: ["Boulder", "Reef"],
        description: "Named for the towering rocks that rise from the depths, featuring swim-throughs and rich marine biodiversity.",
        imageUrl: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 0,
        depthMax: 40,
        difficulty: "Advanced"
      },
      {
        name: "Hideaway Bay (Barracuda Point)",
        location: "Ko Ha (Island #5), Similan Islands",
        types: ["Bay", "Reef"],
        description: "Gentle sloping reef with scattered boulders and frequent barracuda sightings.",
        imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      {
        name: "Anita's Reef",
        location: "Ko Payu (Island #6), Similan Islands",
        types: ["Coral Garden", "Reef"],
        description: "Hard coral garden with gentle currents, making it perfect for intermediate divers.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-8dd44dcb960d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      {
        name: "Deep Six",
        location: "Ko Hin Pousar (Island #7), Similan Islands",
        types: ["Boulder", "Reef"],
        description: "Deep dive with boulder formations and challenging conditions. For advanced divers only.",
        imageUrl: "https://images.unsplash.com/photo-1560275619-4cc5fa59d3ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 18,
        depthMax: 40,
        difficulty: "Advanced"
      },
      {
        name: "East of Eden",
        location: "Ko Hin Pousar (Island #7), Similan Islands",
        types: ["Coral Garden", "Reef"],
        description: "Rich coral garden with abundant sea life and excellent visibility.",
        imageUrl: "https://images.unsplash.com/photo-1515765317588-ccc88719e62c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 35,
        difficulty: "Intermediate"
      },
      {
        name: "West of Eden",
        location: "Ko Hin Pousar (Island #7), Similan Islands",
        types: ["Wall", "Reef"],
        description: "Dramatic drop-offs and abundant soft corals with occasional strong currents.",
        imageUrl: "https://images.unsplash.com/photo-1621394241361-ebfbfdff9f4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 40,
        difficulty: "Advanced"
      },
      {
        name: "Turtle Rock",
        location: "Ko Similan (Island #8), Similan Islands",
        types: ["Reef"],
        description: "Popular for turtle sightings and colorful reef fish. Great for underwater photography.",
        imageUrl: "https://images.unsplash.com/photo-1529928520614-7c76e2d99740?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      {
        name: "Waterfall Bay",
        location: "Ko Similan (Island #8), Similan Islands",
        types: ["Bay", "Reef"],
        description: "Named for a seasonal waterfall, offers easy diving conditions and rich coral life.",
        imageUrl: "https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 20,
        difficulty: "Beginner"
      },
      {
        name: "Elephant Head Rock",
        location: "Ko Similan (Island #8), Similan Islands",
        types: ["Boulder", "Reef"],
        description: "Famous for swim-throughs and caverns that test advanced diving skills.",
        imageUrl: "https://images.unsplash.com/photo-1622476054629-7d57a5435317?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 10,
        depthMax: 40,
        difficulty: "Advanced"
      },
      {
        name: "Beacon Point",
        location: "Ko Similan (Island #8), Similan Islands",
        types: ["Point", "Reef"],
        description: "Named for a navigation beacon, features a mix of hard and soft corals with pelagic species.",
        imageUrl: "https://images.unsplash.com/photo-1551244072-5d12893278ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 10,
        depthMax: 35,
        difficulty: "Intermediate"
      },
      {
        name: "Fantasy Reef",
        location: "Ko Similan (Island #8), Similan Islands",
        types: ["Coral Garden", "Reef"],
        description: "Colorful coral formations with abundant reef fish and occasional turtle sightings.",
        imageUrl: "https://images.unsplash.com/photo-1588644525273-f37b60d78512?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      {
        name: "Beacon Reef (Beacon Beach)",
        location: "Ko Similan (Island #8), Similan Islands",
        types: ["Reef", "Wreck"],
        description: "Extension of Beacon Point, also features the Atlantis Wreck which adds interest for wreck enthusiasts.",
        imageUrl: "https://images.unsplash.com/photo-1557111513-7a0abb62ae83?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 10,
        depthMax: 35,
        difficulty: "Intermediate"
      },
      {
        name: "Donald Duck Bay",
        location: "Ko Similan (Island #8), Similan Islands",
        types: ["Bay", "Reef"],
        description: "Named for a rock formation resembling Donald Duck, offers gentle conditions for beginners.",
        imageUrl: "https://images.unsplash.com/photo-1559983001-d088c8213eb9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 20,
        difficulty: "Beginner"
      },
      {
        name: "Snapper Alley",
        location: "Ko Ba-ngu (Island #9), Similan Islands",
        types: ["Reef"],
        description: "Known for large schools of snappers that create mesmerizing underwater scenery.",
        imageUrl: "https://images.unsplash.com/photo-1478029305454-2835ba7d6e76?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 6,
        depthMax: 20,
        difficulty: "Beginner"
      },
      {
        name: "Three Trees",
        location: "Ko Ba-ngu (Island #9), Similan Islands",
        types: ["Reef"],
        description: "Named for three large trees visible from the sea, offering varied marine life and coral formations.",
        imageUrl: "https://images.unsplash.com/photo-1570739154793-6d4b04e27876?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      {
        name: "North Point (Rocky Point)",
        location: "Ko Ba-ngu (Island #9), Similan Islands",
        types: ["Point", "Reef"],
        description: "Boulders and coral formations with occasional strong currents bringing pelagic visitors.",
        imageUrl: "https://images.unsplash.com/photo-1562059392-096320bccc7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 10,
        depthMax: 35,
        difficulty: "Intermediate"
      },
      {
        name: "Breakfast Bend",
        location: "Ko Ba-ngu (Island #9), Similan Islands",
        types: ["Reef"],
        description: "Morning dive with gentle current that's perfect for enjoying the vibrant coral gardens.",
        imageUrl: "https://images.unsplash.com/photo-1576086276648-319822031d24?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      {
        name: "Christmas Point",
        location: "Ko Ba-ngu (Island #9), Similan Islands",
        types: ["Point", "Reef"],
        description: "Rock formations resembling a Christmas tree with challenging swim-throughs and depths.",
        imageUrl: "https://images.unsplash.com/photo-1545592097-adc686a2da1c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 10,
        depthMax: 40,
        difficulty: "Advanced"
      },
      {
        name: "Batfish Bend",
        location: "Ko Ba-ngu (Island #9), Similan Islands",
        types: ["Reef"],
        description: "Large schools of longfin batfish create spectacular underwater scenery against coral backgrounds.",
        imageUrl: "https://images.unsplash.com/photo-1571813092106-e1e434774891?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 8,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      
      // Similan Islands extended sites (Island #10-11)
      {
        name: "Koh Bon Pinnacle",
        location: "Ko Bon (Island #10), Similan Islands",
        types: ["Pinnacle", "Wall"],
        description: "Deep pinnacle with vertical wall that attracts manta rays and other large pelagics.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-92ab472cad5d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 20,
        depthMax: 45,
        difficulty: "Advanced"
      },
      {
        name: "Koh Bon Ridge/West Ridge (Manta Road)",
        location: "Ko Bon (Island #10), Similan Islands",
        types: ["Ridge", "Reef", "Wall"],
        description: "Famous for manta ray cleaning stations and dramatic underwater topography.",
        imageUrl: "https://images.unsplash.com/photo-1573725342230-178c824a10f2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 10,
        depthMax: 40,
        difficulty: "Advanced"
      },
      {
        name: "Koh Bon Bay",
        location: "Ko Bon (Island #10), Similan Islands",
        types: ["Bay", "Reef"],
        description: "Protected bay area with gentle reef slope and abundant marine life for less experienced divers.",
        imageUrl: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      {
        name: "Koh Tachai Pinnacle/Plateau",
        location: "Ko Tachai (Island #11), Similan Islands",
        types: ["Pinnacle", "Reef"],
        description: "Submerged reef with strong currents and pelagics including whale sharks and manta rays.",
        imageUrl: "https://images.unsplash.com/photo-1580019542155-247062e19ce4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 12,
        depthMax: 40,
        difficulty: "Advanced"
      },
      {
        name: "Koh Tachai Reef",
        location: "Ko Tachai (Island #11), Similan Islands",
        types: ["Reef", "Boulder"],
        description: "More protected area with boulder formations and rich marine life for intermediate divers.",
        imageUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      
      // Surin Islands sites (North)
      {
        name: "Ao Mai Ngam",
        location: "Ko Surin Nuea (Island #1), Surin Islands",
        types: ["Bay", "Reef"],
        description: "Protected bay with gentle slope and coral garden, perfect for beginners and snorkelers.",
        imageUrl: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 3,
        depthMax: 20,
        difficulty: "Beginner"
      },
      {
        name: "Ao Chong Kad",
        location: "Ko Surin Nuea (Island #1), Surin Islands",
        types: ["Channel", "Reef"],
        description: "Channel with reef and rubble featuring good macro life for underwater photographers.",
        imageUrl: "https://images.unsplash.com/photo-1576086276648-319822031d24?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      {
        name: "Ao Mae Yai",
        location: "Ko Surin Nuea (Island #1), Surin Islands",
        types: ["Bay", "Reef"],
        description: "Big Bay with gentle sloping reef and good coral coverage, ideal for beginners.",
        imageUrl: "https://images.unsplash.com/photo-1570739154793-6d4b04e27876?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 3,
        depthMax: 15,
        difficulty: "Beginner"
      },
      {
        name: "Ao Jaak",
        location: "Ko Surin Nuea (Island #1), Surin Islands",
        types: ["Bay", "Reef"],
        description: "Beautiful bay of pristine coral reefs with excellent visibility and gentle conditions.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 3,
        depthMax: 15,
        difficulty: "Beginner"
      },
      {
        name: "Ao Sai Daeng",
        location: "Ko Surin Nuea (Island #1), Surin Islands",
        types: ["Reef"],
        description: "Pristine coral reefs and shallow water with abundant reef fish, perfect for snorkelers too.",
        imageUrl: "https://images.unsplash.com/photo-1588644525273-f37b60d78512?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 3,
        depthMax: 10,
        difficulty: "Beginner"
      },
      {
        name: "Ao Sai Ean",
        location: "Ko Surin Nuea (Island #1), Surin Islands",
        types: ["Reef"],
        description: "Popular spot for snorkelling with shallow coral gardens and diverse fish life.",
        imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 3,
        depthMax: 10,
        difficulty: "Beginner"
      },
      
      // Surin Islands sites (South)
      {
        name: "Ao Pakkad",
        location: "Ko Surin Tai (Island #2), Surin Islands",
        types: ["Reef"],
        description: "Simple and colorful reef, good for beginners and snorkelers with easy conditions.",
        imageUrl: "https://images.unsplash.com/photo-1551244072-5d12893278ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 20,
        difficulty: "Beginner"
      },
      {
        name: "Ao Tao (Turtle Bay)",
        location: "Ko Surin Tai (Island #2), Surin Islands",
        types: ["Bay", "Reef"],
        description: "Turtle Bay with shallow coral formations popular for snorkeling and turtle encounters.",
        imageUrl: "https://images.unsplash.com/photo-1529928520614-7c76e2d99740?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 3,
        depthMax: 15,
        difficulty: "Beginner"
      },
      {
        name: "Ao Suthep",
        location: "Ko Surin Tai (Island #2), Surin Islands",
        types: ["Reef"],
        description: "Named after park ranger features small bommies and hard corals with interesting marine life.",
        imageUrl: "https://images.unsplash.com/photo-1515765317588-ccc88719e62c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      {
        name: "Torinla Pinnacle",
        location: "Ko Khai (Torinla Islet), Surin Islands",
        types: ["Pinnacle", "Reef"],
        description: "Submerged granite pinnacle with pelagic species and sometimes challenging conditions.",
        imageUrl: "https://images.unsplash.com/photo-1580019542155-247062e19ce4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 12,
        depthMax: 40,
        difficulty: "Advanced"
      },
      {
        name: "Koh Klang",
        location: "Ko Klang (Mankom Islet), Surin Islands",
        types: ["Reef"],
        description: "Islet with surrounding reef system featuring diverse marine life and coral formations.",
        imageUrl: "https://images.unsplash.com/photo-1603279560023-f2771a6a2bcb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      {
        name: "Koh Chi",
        location: "Koh Chi (Stock Islet), Surin Islands",
        types: ["Point", "Reef"],
        description: "Southern point with currents and pelagic sightings including mantas and reef sharks.",
        imageUrl: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 8,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      {
        name: "Richelieu Rock",
        location: "Extended Park, Surin Islands",
        types: ["Pinnacle", "Reef", "Wall", "Drift", "Channel"],
        description: "Legendary horseshoe-shaped pinnacle with rich marine life and the best diving in Thailand. Known for whale shark sightings.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      }
    ];

    for (const site of initialDiveSites) {
      const { depthMin, depthMax, difficulty, ...insertSite } = site;
      const diveSite = this.createDiveSite(insertSite);
      
      // Update with the additional fields
      this.updateDiveSite(diveSite.id, { 
        depthMin, 
        depthMax, 
        difficulty 
      });
    }
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
      depthMin: 0,
      depthMax: 0,
      difficulty: "Intermediate",
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
  
  async getDiveSitesByRegion(): Promise<RegionDiveSites[]> {
    const diveSites = Array.from(this.diveSites.values());
    
    // Organize the sites by section first, then we'll restructure them
    const sitesBySection = new Map<string, DiveSite[]>();
    
    // Main descriptions for the parent regions
    const mainRegionDescriptions: Record<string, string> = {
      "Similan Islands": "The Similan Islands are an archipelago of nine islands in the Andaman Sea, renowned for granite boulder formations, white sandy beaches, and rich marine biodiversity. A protected national park offering world-class diving experiences across southern, central, and northern sections.",
      
      "Surin Islands": "Located in the northern Andaman Sea, the Surin Islands feature pristine reefs with exceptional visibility. These protected waters host an incredible diversity of marine life, with shallow reef systems in the north and more varied dive conditions in the south.",
      
      "Extended Park": "The Extended Park includes the legendary Richelieu Rock, considered Thailand's premier dive site. This horseshoe-shaped pinnacle in the open Andaman Sea is famous for its exceptional biodiversity, vibrant soft corals, and frequent whale shark encounters."
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
      else if (location.includes("Island #10") || location.includes("Island #11") || 
          location.includes("Ko Bon") || location.includes("Ko Tachai")) {
        section = "Similan Islands - North"; // Reclassify from Extended North to just North
      }
      // Determine Surin Islands sections
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
        region: "North (Islands #8-11)",
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
