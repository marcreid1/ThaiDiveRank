import { UserStorage } from "./userStorage";
import { DiveSiteStorage } from "./diveSiteStorage";
import { MatchupStorage } from "./matchupStorage";
import { VoteStorage } from "./voteStorage";
import { IStorage } from "./interfaces";
import { 
  DiveSite, 
  InsertDiveSite, 
  Vote, 
  InsertVote, 
  DiveSiteRanking, 
  VoteActivity, 
  User, 
  InsertUser 
} from "@shared/schema";
import { RegionDiveSites } from "./interfaces";

export class DatabaseStorage implements IStorage {
  private userStorage: UserStorage;
  private diveSiteStorage: DiveSiteStorage;
  private matchupStorage: MatchupStorage;
  private voteStorage: VoteStorage;

  constructor() {
    this.userStorage = new UserStorage();
    this.diveSiteStorage = new DiveSiteStorage();
    this.matchupStorage = new MatchupStorage();
    this.voteStorage = new VoteStorage();
  }

  // User methods
  async createUser(user: InsertUser): Promise<User> {
    return this.userStorage.createUser(user);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.userStorage.getUserByEmail(email);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.userStorage.getUserById(id);
  }

  async deactivateUser(id: string): Promise<boolean> {
    return this.userStorage.deactivateUser(id);
  }

  async reactivateUser(id: string): Promise<boolean> {
    return this.userStorage.reactivateUser(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userStorage.deleteUser(id);
  }

  // Dive site methods
  async getAllDiveSites(): Promise<DiveSite[]> {
    return this.diveSiteStorage.getAllDiveSites();
  }

  async getDiveSite(id: number): Promise<DiveSite | undefined> {
    return this.diveSiteStorage.getDiveSite(id);
  }

  async createDiveSite(diveSite: InsertDiveSite): Promise<DiveSite> {
    return this.diveSiteStorage.createDiveSite(diveSite);
  }

  async updateDiveSite(id: number, diveSite: Partial<DiveSite>): Promise<DiveSite | undefined> {
    return this.diveSiteStorage.updateDiveSite(id, diveSite);
  }

  async getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }> {
    return this.diveSiteStorage.getDiveSiteRankings();
  }

  async getDiveSitesByRegion(): Promise<RegionDiveSites[]> {
    return this.diveSiteStorage.getDiveSitesByRegion();
  }

  // Matchup methods
  async getRandomMatchup(winnerId?: number, winnerSide?: 'A' | 'B'): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    return this.matchupStorage.getRandomMatchup(winnerId, winnerSide);
  }

  // Vote methods
  async createVote(vote: InsertVote): Promise<Vote> {
    return this.voteStorage.createVote(vote);
  }

  async getVotes(limit?: number): Promise<Vote[]> {
    return this.voteStorage.getVotes(limit);
  }

  async getUserVotes(userId: string): Promise<Vote[]> {
    return this.voteStorage.getUserVotes(userId);
  }

  async getUserUniqueMatchups(userId: string): Promise<number> {
    return this.voteStorage.getUserUniqueMatchups(userId);
  }

  async getRecentActivity(limit?: number): Promise<VoteActivity[]> {
    return this.voteStorage.getRecentActivity(limit);
  }
}

export const storage = new DatabaseStorage();
export * from "./interfaces";