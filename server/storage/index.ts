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

  async deleteUserAccountAndVotes(userId: string): Promise<boolean> {
    return this.userStorage.deleteUserAccountAndVotes(userId);
  }

  async updateSecurityQuestions(userId: string, securityData: {
    question1: string;
    answer1: string;
    question2: string;
    answer2: string;
    question3: string;
    answer3: string;
  }): Promise<boolean> {
    return this.userStorage.updateSecurityQuestions(userId, securityData);
  }

  async getUserSecurityQuestions(email: string): Promise<{
    questions: [string, string, string] | null;
    userId: string | null;
  }> {
    return this.userStorage.getUserSecurityQuestions(email);
  }

  async resetPassword(userId: string, newHashedPassword: string): Promise<boolean> {
    return this.userStorage.resetPassword(userId, newHashedPassword);
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
  async getRandomMatchup(winnerId?: number, winnerSide?: 'A' | 'B', userId?: string): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    return this.matchupStorage.getRandomMatchup(winnerId, winnerSide, userId);
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

  async getUserVotedPairs(userId: string): Promise<Set<string>> {
    return this.voteStorage.getUserVotedPairs(userId);
  }

  async getRecentActivity(limit?: number): Promise<VoteActivity[]> {
    return this.voteStorage.getRecentActivity(limit);
  }

  async resetUserVotes(userId: string): Promise<boolean> {
    return this.voteStorage.resetUserVotes(userId);
  }
}

export const storage = new DatabaseStorage();
export * from "./interfaces";