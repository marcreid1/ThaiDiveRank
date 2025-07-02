import { DiveSite, InsertDiveSite, Vote, InsertVote, DiveSiteRanking, VoteActivity, User, InsertUser } from "@shared/schema";

export interface RegionDiveSites {
  region: string;
  description: string;
  diveSites: DiveSite[];
  subregions?: RegionDiveSites[];
}

export interface IUserStorage {
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  deactivateUser(id: string): Promise<boolean>;
  reactivateUser(id: string): Promise<boolean>;
  deleteUser(id: string): Promise<boolean>;
}

export interface IDiveSiteStorage {
  getAllDiveSites(): Promise<DiveSite[]>;
  getDiveSite(id: number): Promise<DiveSite | undefined>;
  createDiveSite(diveSite: InsertDiveSite): Promise<DiveSite>;
  updateDiveSite(id: number, diveSite: Partial<DiveSite>): Promise<DiveSite | undefined>;
  getDiveSiteRankings(): Promise<{ rankings: DiveSiteRanking[], lastUpdated: string }>;
  getDiveSitesByRegion(): Promise<RegionDiveSites[]>;
}

export interface IMatchupStorage {
  getRandomMatchup(winnerId?: number, winnerSide?: 'A' | 'B', userId?: string): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }>;
}

export interface IVoteStorage {
  createVote(vote: InsertVote): Promise<Vote>;
  getVotes(limit?: number): Promise<Vote[]>;
  getUserVotes(userId: string): Promise<Vote[]>;
  getUserUniqueMatchups(userId: string): Promise<number>;
  getUserVotedPairs(userId: string): Promise<Set<string>>;
  getRecentActivity(limit?: number): Promise<VoteActivity[]>;
  resetUserVotes(userId: string): Promise<boolean>;
}

export interface IStorage extends IUserStorage, IDiveSiteStorage, IMatchupStorage, IVoteStorage {
  getUserUniqueMatchups(userId: string): Promise<number>;
  getUserVotedPairs(userId: string): Promise<Set<string>>;
  resetUserVotes(userId: string): Promise<boolean>;
}