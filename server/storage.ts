import { DiveSite, InsertDiveSite, Vote, InsertVote, User, InsertUser, VoteActivity, DiveSiteRanking } from "@shared/schema";
import { calculateEloChange } from "./utils/elo";

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
    
    // Initialize with dive sites from the CSV file
    this.initializeDiveSites();
  }

  private initializeDiveSites() {
    // CSV data converted to dive site objects
    const initialDiveSites: (InsertDiveSite & { depthMin: number, depthMax: number, difficulty: string })[] = [
      // Site 1
      {
        name: "Coral Gardens",
        location: "Ko Huyong, Island #1, South, Similan Islands",
        types: ["Coral Garden"],
        description: "Shallow reef area featuring vibrant hard corals",
        imageUrl: "/src/assets/images/dive-sites/1. Coral Gardens.png",
        depthMin: 0,
        depthMax: 10,
        difficulty: "Beginner"
      },
      // Site 2
      {
        name: "Shark Fin Reef",
        location: "Ko Payan, Island #3, South, Similan Islands",
        types: ["Reef"],
        description: "Distinctive rock formation resembling a shark fin",
        imageUrl: "/src/assets/images/dive-sites/2. Shark Fin Reef.png",
        depthMin: 5,
        depthMax: 35,
        difficulty: "Intermediate"
      },
      // Site 3
      {
        name: "Boulder City",
        location: "Ko Payan, Island #3, South, Similan Islands",
        types: ["Boulder"],
        description: "Massive underwater boulders",
        imageUrl: "/src/assets/images/dive-sites/3. Boulder City.png",
        depthMin: 15,
        depthMax: 40,
        difficulty: "Advanced"
      },
      // Site 4
      {
        name: "Princess Bay",
        location: "Ko Miang, Island #4, Central, Similan Islands",
        types: ["Bay"],
        description: "Shallow bay with coral gardens",
        imageUrl: "/src/assets/images/dive-sites/4. Princess Bay.png",
        depthMin: 5,
        depthMax: 18,
        difficulty: "Beginner"
      },
      // Site 5
      {
        name: "Honeymoon Bay",
        location: "Ko Miang, Island #4, Central, Similan Islands",
        types: ["Bay"],
        description: "Popular for night dives",
        imageUrl: "/src/assets/images/dive-sites/5. Honeymoon Bay.png",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      // Site 6
      {
        name: "Bird Rock (Chinese Wall)",
        location: "Ko Miang, Island #4, Central, Similan Islands",
        types: ["Wall"],
        description: "Large granite boulders which form a wall-like structure",
        imageUrl: "/src/assets/images/dive-sites/6. Bird Rock.png",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      // Site 7
      {
        name: "Stonehenge",
        location: "Ko Miang, Island #4, Central, Similan Islands",
        types: ["Boulder"],
        description: "Named for the towering rocks that rise from the depths",
        imageUrl: "/src/assets/images/dive-sites/7. Stonehenge.png",
        depthMin: 0,
        depthMax: 40,
        difficulty: "Advanced"
      },
      // Site 8
      {
        name: "Hideaway Bay (Barracuda Point)",
        location: "Ko Ha, Island #5, Central, Similan Islands",
        types: ["Bay"],
        description: "Gentle sloping reef with scattered boulders",
        imageUrl: "/src/assets/images/dive-sites/8. Hideaway Bay.png",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      // Site 9
      {
        name: "Anita's Reef",
        location: "Ko Payu, Island #6, Central, Similan Islands",
        types: ["Coral Garden"],
        description: "Hard coral garden with gentle currents",
        imageUrl: "/src/assets/images/dive-sites/9. Anita's Reef.png",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      // Site 10
      {
        name: "Deep Six",
        location: "Ko Hin Pousar, Island #7, Central, Similan Islands",
        types: ["Boulder"],
        description: "Deep dive with boulder formations",
        imageUrl: "/src/assets/images/dive-sites/10. Deep Six.png",
        depthMin: 18,
        depthMax: 40,
        difficulty: "Advanced"
      },
      // Site 11
      {
        name: "East of Eden",
        location: "Ko Hin Pousar, Island #7, Central, Similan Islands",
        types: ["Coral Garden"],
        description: "Rich coral garden with abundant sea life",
        imageUrl: "/src/assets/images/dive-sites/11. East of Eden.png",
        depthMin: 5,
        depthMax: 35,
        difficulty: "Intermediate"
      },
      // Site 12
      {
        name: "West of Eden",
        location: "Ko Hin Pousar, Island #7, Central, Similan Islands",
        types: ["Wall"],
        description: "Dramatic drop-offs and abundant soft corals",
        imageUrl: "/src/assets/images/dive-sites/12. West of Eden.png",
        depthMin: 5,
        depthMax: 40,
        difficulty: "Advanced"
      },
      // Site 13
      {
        name: "Turtle Rock",
        location: "Ko Similan, Island #8, North, Similan Islands",
        types: ["Reef"],
        description: "Popular for turtle sightings",
        imageUrl: "/src/assets/images/dive-sites/13. Turtle Rock.png",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      // Site 14
      {
        name: "Waterfall Bay",
        location: "Ko Similan, Island #8, North, Similan Islands",
        types: ["Bay"],
        description: "Named for a seasonal waterfall",
        imageUrl: "/src/assets/images/dive-sites/14. Waterfall Bay.png",
        depthMin: 5,
        depthMax: 20,
        difficulty: "Beginner"
      },
      // Site 15
      {
        name: "Elephant Head Rock",
        location: "Ko Similan, Island #8, North, Similan Islands",
        types: ["Boulder"],
        description: "Famous for swim-throughs and caverns",
        imageUrl: "/src/assets/images/dive-sites/15. Elephant Head Rock.png",
        depthMin: 10,
        depthMax: 40,
        difficulty: "Advanced"
      },
      // Site 16
      {
        name: "Beacon Point",
        location: "Ko Similan, Island #8, North, Similan Islands",
        types: ["Point"],
        description: "Named for a navigation beacon",
        imageUrl: "/src/assets/images/dive-sites/16. Beacon Point.png",
        depthMin: 10,
        depthMax: 35,
        difficulty: "Intermediate"
      },
      // Site 17
      {
        name: "Fantasy Reef",
        location: "Ko Similan, Island #8, North, Similan Islands",
        types: ["Coral Garden"],
        description: "Colorful coral formations",
        imageUrl: "/src/assets/images/dive-sites/17. Fantasy Reef.png",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      // Site 18
      {
        name: "Beacon Reef (Beacon Beach)",
        location: "Ko Similan, Island #8, North, Similan Islands",
        types: ["Reef"],
        description: "Extension of Beacon Point, also features the Atlantis Wreck",
        imageUrl: "/src/assets/images/dive-sites/18. Beacon Reef.png",
        depthMin: 10,
        depthMax: 35,
        difficulty: "Intermediate"
      },
      // Site 19
      {
        name: "Donald Duck Bay",
        location: "Ko Similan, Island #8, North, Similan Islands",
        types: ["Bay"],
        description: "Named for a rock formation resembling Donald Duck",
        imageUrl: "/src/assets/images/dive-sites/19. Donald Duck Bay.png",
        depthMin: 5,
        depthMax: 20,
        difficulty: "Beginner"
      },
      // Site 20
      {
        name: "Snapper Alley",
        location: "Ko Ba-ngu, Island #9, North, Similan Islands",
        types: ["Reef"],
        description: "Known for large schools of snappers",
        imageUrl: "/src/assets/images/dive-sites/20. Snapper Alley.png",
        depthMin: 6,
        depthMax: 20,
        difficulty: "Beginner"
      },
      // Site 21
      {
        name: "Three Trees",
        location: "Ko Ba-ngu, Island #9, North, Similan Islands",
        types: ["Reef"],
        description: "Named for three large trees visible from the sea",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      // Site 22
      {
        name: "North Point (Rocky Point)",
        location: "Ko Ba-ngu, Island #9, North, Similan Islands",
        types: ["Point"],
        description: "Boulders and coral formations",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 10,
        depthMax: 35,
        difficulty: "Intermediate"
      },
      // Site 23
      {
        name: "Breakfast Bend",
        location: "Ko Ba-ngu, Island #9, North, Similan Islands",
        types: ["Reef"],
        description: "Morning dive with gentle current",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      // Site 24
      {
        name: "Christmas Point",
        location: "Ko Ba-ngu, Island #9, North, Similan Islands",
        types: ["Point"],
        description: "Rock formations resembling a Christmas tree",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 10,
        depthMax: 40,
        difficulty: "Advanced"
      },
      // Site 25
      {
        name: "Batfish Bend",
        location: "Ko Ba-ngu, Island #9, North, Similan Islands",
        types: ["Reef"],
        description: "Large schools of longfin batfish",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 8,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      // Site 26
      {
        name: "Koh Bon Pinnacle",
        location: "Ko Bon, Island #10, North, Similan Islands",
        types: ["Pinnacle"],
        description: "Deep pinnacle with vertical wall",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 20,
        depthMax: 45,
        difficulty: "Advanced"
      },
      // Site 27
      {
        name: "Koh Bon Ridge/West Ridge (Manta Road)",
        location: "Ko Bon, Island #10, North, Similan Islands",
        types: ["Ridge"],
        description: "Famous for manta ray cleaning stations",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 10,
        depthMax: 40,
        difficulty: "Advanced"
      },
      // Site 28
      {
        name: "Koh Bon Bay",
        location: "Ko Bon, Island #10, North, Similan Islands",
        types: ["Bay"],
        description: "Protected bay area with gentle reef slope",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      // Site 29
      {
        name: "Koh Tachai Pinnacle/Plateau",
        location: "Ko Tachai, Island #11, North, Similan Islands",
        types: ["Pinnacle"],
        description: "Submerged reef with strong currents and pelagics",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 12,
        depthMax: 40,
        difficulty: "Advanced"
      },
      // Site 30
      {
        name: "Koh Tachai Reef",
        location: "Ko Tachai, Island #11, North, Similan Islands",
        types: ["Reef"],
        description: "More protected area with boulder formations",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 5,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      
      // Surin Islands sites
      // Site 31
      {
        name: "Ao Mai Ngam",
        location: "Ko Surin Nuea, Island #1, North, Surin Islands",
        types: ["Bay"],
        description: "Protected bay with gentle slope and coral garden",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 3,
        depthMax: 20,
        difficulty: "Beginner"
      },
      // Site 32
      {
        name: "Ao Chong Kad",
        location: "Ko Surin Nuea, Island #1, North, Surin Islands",
        types: ["Channel"],
        description: "Channel with reef and rubble featuring good macro life",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      // Site 33
      {
        name: "Ao Mae Yai",
        location: "Ko Surin Nuea, Island #1, North, Surin Islands",
        types: ["Bay"],
        description: "Big Bay with gentle sloping reef and good coral coverage",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 3,
        depthMax: 15,
        difficulty: "Beginner"
      },
      // Site 34
      {
        name: "Ao Jaak",
        location: "Ko Surin Nuea, Island #1, North, Surin Islands",
        types: ["Bay"],
        description: "Beautiful bay of pristine coral reefs",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 3,
        depthMax: 15,
        difficulty: "Beginner"
      },
      // Site 35
      {
        name: "Ao Sai Daeng",
        location: "Ko Surin Nuea, Island #1, North, Surin Islands",
        types: ["Reef"],
        description: "Pristine coral reefs and shallow water",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 3,
        depthMax: 10,
        difficulty: "Beginner"
      },
      // Site 36
      {
        name: "Ao Sai Ean",
        location: "Ko Surin Nuea, Island #1, North, Surin Islands",
        types: ["Reef"],
        description: "Popular spot for snorkelling",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 3,
        depthMax: 10,
        difficulty: "Beginner"
      },
      // Site 37
      {
        name: "Ao Pakkad",
        location: "Ko Surin Tai, Island #2, South, Surin Islands",
        types: ["Reef"],
        description: "Simple and colorful reef, good for beginners and snorkelers",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 5,
        depthMax: 20,
        difficulty: "Beginner"
      },
      // Site 38
      {
        name: "Ao Tao (Turtle Bay)",
        location: "Ko Surin Tai, Island #2, South, Surin Islands",
        types: ["Bay"],
        description: "Turtle Bay with shallow coral formations popular for snorkeling",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 3,
        depthMax: 15,
        difficulty: "Beginner"
      },
      // Site 39
      {
        name: "Ao Suthep",
        location: "Ko Surin Tai, Island #2, South, Surin Islands",
        types: ["Reef"],
        description: "Named after park ranger features small bommies and hard corals",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      // Site 40
      {
        name: "Torinla Pinnacle",
        location: "Ko Khai (Torinla Islet), Island #3, South, Surin Islands",
        types: ["Pinnacle"],
        description: "Submerged granite pinnacle with pelagic species",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 12,
        depthMax: 40,
        difficulty: "Advanced"
      },
      // Site 41
      {
        name: "Koh Klang",
        location: "Ko Klang (Mankom Islet), Island #4, South, Surin Islands",
        types: ["Reef"],
        description: "Islet with surrounding reef system",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 5,
        depthMax: 25,
        difficulty: "Intermediate"
      },
      // Site 42
      {
        name: "Koh Chi",
        location: "Koh Chi (Stock Islet), Island #5, North, Surin Islands",
        types: ["Point"],
        description: "Southern point with currents and pelagic sightings",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 8,
        depthMax: 30,
        difficulty: "Intermediate"
      },
      // Site 43 - Richelieu Rock in Extended Park
      {
        name: "Richelieu Rock",
        location: "Extended Park",
        types: ["Pinnacle"],
        description: "Legendary horseshoe-shaped pinnacle with rich marine life",
        imageUrl: "/src/assets/images/dive-sites/placeholder.png",
        depthMin: 5,
        depthMax: 35,
        difficulty: "Intermediate"
      }
    ];

    for (const site of initialDiveSites) {
      // Create the full dive site directly instead of creating then updating
      const diveSite: DiveSite = {
        id: this.diveSiteCurrentId++,
        name: site.name,
        location: site.location,
        types: site.types,
        description: site.description,
        imageUrl: site.imageUrl,
        rating: 1500,
        wins: 0,
        losses: 0,
        depthMin: site.depthMin,
        depthMax: site.depthMax,
        difficulty: site.difficulty,
        createdAt: new Date()
      };
      
      // Add to the collection
      this.diveSites.set(diveSite.id, diveSite);
      this.rankChanges.set(diveSite.id, 0); // Initialize rank change
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
      "Similan Islands - South": "The southern islands (#1-3) feature more protected reefs and better conditions for beginners, with shallow coral gardens and diverse marine life.",
      
      "Similan Islands - Central": "The central islands (#4-7) offer a mix of dive conditions suitable for all levels, with boulder formations and rich coral gardens.",
      
      "Similan Islands - North": "The northern islands (#8-11) have the archipelago's most dramatic underwater topography, with massive boulders, swim-throughs, and the best chance to see larger pelagic species.",
      
      "Surin Islands - North": "The northern Surin Islands have excellent shallow reefs with diverse coral species and abundant reef fish, ideal for beginners and underwater photographers.",
      
      "Surin Islands - South": "The southern Surin Islands feature more varied underwater landscapes including pinnacles, offering opportunities to see larger marine life."
    };
    
    // First pass: organize sites by section based on Island_Main classification from CSV
    for (const site of diveSites) {
      // Determine which section this site belongs to based on the CSV classification
      let sectionKey: string;
      
      if (site.location.includes("Similan Islands")) {
        if (site.location.includes("South")) {
          sectionKey = "Similan Islands - South";
        } else if (site.location.includes("Central")) {
          sectionKey = "Similan Islands - Central";
        } else if (site.location.includes("North")) {
          sectionKey = "Similan Islands - North";
        } else {
          // Default if no specific section is mentioned
          sectionKey = "Similan Islands - Central";
        }
      } else if (site.location.includes("Surin Islands")) {
        if (site.location.includes("North")) {
          sectionKey = "Surin Islands - North";
        } else if (site.location.includes("South")) {
          sectionKey = "Surin Islands - South";
        } else {
          // Default if no specific section is mentioned
          sectionKey = "Surin Islands - North";
        }
      } else if (site.location.includes("Extended Park")) {
        sectionKey = "Richelieu Rock";
      } else {
        // Default case for any other sites
        sectionKey = "Other";
      }
      
      // Ensure the section exists in our map
      if (!sitesBySection.has(sectionKey)) {
        sitesBySection.set(sectionKey, []);
      }
      
      // Add the site to this section
      sitesBySection.get(sectionKey)!.push(site);
    }
    
    // Second pass: structure the data into the final format with main regions and subregions
    const mainGroups: RegionDiveSites[] = [];
    
    // 1. Similan Islands with subregions
    const similarSubregions: RegionDiveSites[] = [];
    
    if (sitesBySection.has("Similan Islands - South")) {
      similarSubregions.push({
        region: "South",
        description: subRegionDescriptions["Similan Islands - South"],
        diveSites: sitesBySection.get("Similan Islands - South")!.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
    
    if (sitesBySection.has("Similan Islands - Central")) {
      similarSubregions.push({
        region: "Central",
        description: subRegionDescriptions["Similan Islands - Central"],
        diveSites: sitesBySection.get("Similan Islands - Central")!.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
    
    if (sitesBySection.has("Similan Islands - North")) {
      similarSubregions.push({
        region: "North",
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
    
    // Need at least 2 dive sites to create a matchup
    if (allDiveSites.length < 2) {
      throw new Error("Not enough dive sites to create a matchup");
    }
    
    // Pick two random dive sites
    const diveSiteA = allDiveSites[Math.floor(Math.random() * allDiveSites.length)];
    
    // Pick a different dive site for B
    let diveSiteB: DiveSite;
    do {
      diveSiteB = allDiveSites[Math.floor(Math.random() * allDiveSites.length)];
    } while (diveSiteB.id === diveSiteA.id);
    
    return { diveSiteA, diveSiteB };
  }

  // Vote methods
  async createVote(insertVote: InsertVote): Promise<Vote> {
    const id = this.voteCurrentId++;
    
    // Create the vote object
    const vote: Vote = {
      ...insertVote,
      id,
      createdAt: new Date()
    };
    
    // Store the vote
    this.votes.set(id, vote);
    
    // Update win/loss records and ratings
    const winner = await this.getDiveSite(insertVote.winnerId);
    const loser = await this.getDiveSite(insertVote.loserId);
    
    if (winner && loser) {
      // Calculate ELO rating change
      const ratingChange = calculateEloChange(winner.rating, loser.rating);
      
      // Update winner stats
      await this.updateDiveSite(winner.id, {
        wins: winner.wins + 1,
        rating: winner.rating + ratingChange
      });
      
      // Update loser stats
      await this.updateDiveSite(loser.id, {
        losses: loser.losses + 1,
        rating: loser.rating - ratingChange
      });
      
      // Update ranks after vote
      this.updateRankings();
    }
    
    return vote;
  }
  
  async getVotes(limit = 20): Promise<Vote[]> {
    const allVotes = Array.from(this.votes.values());
    
    // Sort votes by creation date (newest first)
    return allVotes
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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
          pointsChanged: calculateEloChange(winner.rating - vote.ratingChange, loser.rating + vote.ratingChange),
          timestamp: vote.createdAt.toISOString()
        });
      }
    }
    
    return activities;
  }
  
  private updateRankings() {
    // Get previous rankings
    const prevRankedSites = Array.from(this.diveSites.values())
      .sort((a, b) => b.rating - a.rating);
    
    // Get current rankings
    const currRankedSites = Array.from(this.diveSites.values())
      .sort((a, b) => b.rating - a.rating);
    
    // Build maps of previous and current positions
    const prevPositions = new Map<number, number>();
    prevRankedSites.forEach((site, index) => {
      prevPositions.set(site.id, index + 1);
    });
    
    // Calculate change in positions
    currRankedSites.forEach((site, index) => {
      const currentPosition = index + 1;
      const previousPosition = prevPositions.get(site.id) || currentPosition;
      const change = previousPosition - currentPosition;
      this.rankChanges.set(site.id, change);
    });
    
    // Update the lastUpdated timestamp
    this.lastUpdated = new Date().toISOString();
  }
}

export const storage = new MemStorage();