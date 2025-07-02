import { eq, or, and } from "drizzle-orm";
import { db } from "../db";
import { votes, diveSites, users } from "@shared/schema";

export class DatabaseQueryHelpers {
  // Get votes by user with efficient pagination
  static async getUserVotes(userId: string, limit: number = 20) {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.userId, userId))
      .orderBy(votes.timestamp)
      .limit(limit);
  }

  // Get user's voted pairs as Set for O(1) lookup
  static async getUserVotedPairs(userId: string): Promise<Set<string>> {
    const userVotes = await db
      .select({ winnerId: votes.winnerId, loserId: votes.loserId })
      .from(votes)
      .where(eq(votes.userId, userId));

    const votedPairs = new Set<string>();
    for (const vote of userVotes) {
      // Create bidirectional pair keys for efficient lookup
      const [id1, id2] = [vote.winnerId, vote.loserId].sort((a, b) => a - b);
      votedPairs.add(`${id1}-${id2}`);
    }
    
    return votedPairs;
  }

  // Get dive sites with their vote statistics
  static async getDiveSitesWithStats() {
    return await db
      .select()
      .from(diveSites)
      .orderBy(diveSites.rating);
  }

  // Check if a specific matchup has been voted on by user
  static async hasUserVotedOnPair(userId: string, siteId1: number, siteId2: number): Promise<boolean> {
    const existingVote = await db
      .select({ id: votes.id })
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          or(
            and(eq(votes.winnerId, siteId1), eq(votes.loserId, siteId2)),
            and(eq(votes.winnerId, siteId2), eq(votes.loserId, siteId1))
          )
        )
      )
      .limit(1);

    return existingVote.length > 0;
  }

  // Get all votes for a matchup pair (both directions)
  static async getMatchupVotes(siteId1: number, siteId2: number) {
    return await db
      .select()
      .from(votes)
      .where(
        or(
          and(eq(votes.winnerId, siteId1), eq(votes.loserId, siteId2)),
          and(eq(votes.winnerId, siteId2), eq(votes.loserId, siteId1))
        )
      );
  }

  // Get sites that haven't faced a specific champion
  static async getUnfacedOpponents(championId: number, allSites: any[]) {
    // Get all votes involving the champion
    const championVotes = await db
      .select({
        winnerId: votes.winnerId,
        loserId: votes.loserId
      })
      .from(votes)
      .where(
        or(
          eq(votes.winnerId, championId),
          eq(votes.loserId, championId)
        )
      );

    // Extract opponent IDs
    const facedOpponentIds = new Set<number>();
    championVotes.forEach(vote => {
      if (vote.winnerId === championId) {
        facedOpponentIds.add(vote.loserId);
      } else {
        facedOpponentIds.add(vote.winnerId);
      }
    });

    // Return unfaced opponents (excluding the champion itself)
    return allSites.filter(site => 
      site.id !== championId && !facedOpponentIds.has(site.id)
    );
  }

  // Count unique matchups for a user
  static async countUserUniqueMatchups(userId: string): Promise<number> {
    const userVotes = await db
      .select({ winnerId: votes.winnerId, loserId: votes.loserId })
      .from(votes)
      .where(eq(votes.userId, userId));

    const uniquePairs = new Set<string>();
    userVotes.forEach(vote => {
      const [id1, id2] = [vote.winnerId, vote.loserId].sort((a, b) => a - b);
      uniquePairs.add(`${id1}-${id2}`);
    });

    return uniquePairs.size;
  }
}