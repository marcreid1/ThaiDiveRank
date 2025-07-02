import { votes, diveSites, users, type Vote, type InsertVote, type VoteActivity } from "@shared/schema";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import { eloService } from "../services/eloService";
import { IVoteStorage } from "./interfaces";

// Extended vote type that includes userId for storage operations
interface InsertVoteWithUser extends InsertVote {
  userId: string;
}

export class VoteStorage implements IVoteStorage {
  async createVote(insertVote: any): Promise<Vote> {
    console.log(`[STORAGE] createVote called with data:`, insertVote);
    console.log(`[STORAGE] User ID from insertVote: ${insertVote.userId}`);
    
    // Use database transaction for atomic operations including duplicate check
    return await db.transaction(async (tx) => {
      // Check for existing vote on this exact pair by this user (prevents race conditions)
      const [id1, id2] = [insertVote.winnerId, insertVote.loserId].sort((a, b) => a - b);
      
      // Optimized duplicate check using direct pair lookup
      const pairKey = `${id1}-${id2}`;
      const hasDuplicate = await eloService.hasUserVotedOnMatchup(insertVote.userId, id1, id2);
      
      if (hasDuplicate) {
        throw new Error("You have already voted on this matchup");
      }

      // Get current ratings for ELO calculation
      const [winner] = await tx.select().from(diveSites).where(eq(diveSites.id, insertVote.winnerId));
      const [loser] = await tx.select().from(diveSites).where(eq(diveSites.id, insertVote.loserId));

      if (!winner || !loser) {
        throw new Error("Invalid dive site IDs");
      }

      console.log(`[STORAGE] Winner: ${winner.name} (Rating: ${winner.rating})`);
      console.log(`[STORAGE] Loser: ${loser.name} (Rating: ${loser.rating})`);
    
      // Calculate ELO change using service
      const eloUpdate = eloService.calculateEloUpdate(winner.rating, loser.rating);
      console.log(`[STORAGE] Calculated ELO change: ${eloUpdate.pointsChanged} points`);

      const insertData = {
        winnerId: insertVote.winnerId,
        loserId: insertVote.loserId,
        pointsChanged: eloUpdate.pointsChanged,
        userId: insertVote.userId,
      };
      
      console.log(`[STORAGE] Full SQL INSERT data:`, insertData);
      console.log(`[STORAGE] Executing INSERT INTO votes...`);

      // Create vote and update ratings atomically
      const [vote] = await tx
        .insert(votes)
        .values(insertData)
        .returning();

      console.log(`[STORAGE] Successfully inserted vote with ID ${vote.id}`);
      console.log(`[STORAGE] Inserted vote userId: ${vote.userId}`);

      // Apply ELO rating updates using service
      await eloService.applyEloUpdate(tx, insertVote.winnerId, insertVote.loserId, eloUpdate);

      console.log(`[STORAGE] Updated ratings - Winner: ${eloUpdate.winnerNewRating}, Loser: ${eloUpdate.loserNewRating}`);
      
      return vote;
    });
  }

  async getVotes(limit = 20): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .orderBy(desc(votes.timestamp))
      .limit(limit);
  }

  async getUserVotes(userId: string): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.userId, userId))
      .orderBy(desc(votes.timestamp));
  }

  async getUserUniqueMatchups(userId: string): Promise<number> {
    const votedPairs = await this.getUserVotedPairs(userId);
    return votedPairs.size;
  }

  async getUserVotedPairs(userId: string): Promise<Set<string>> {
    const userVotes = await db
      .select({ winnerId: votes.winnerId, loserId: votes.loserId })
      .from(votes)
      .where(eq(votes.userId, userId));

    // Create unique matchup pairs (normalize to avoid A-B vs B-A duplicates)
    const uniqueMatchups = new Set<string>();
    userVotes.forEach(vote => {
      // Sort IDs to create consistent pair representation
      const [id1, id2] = [vote.winnerId, vote.loserId].sort((a, b) => a - b);
      uniqueMatchups.add(`${id1}-${id2}`);
    });

    return uniqueMatchups;
  }

  async getRecentActivity(limit = 10): Promise<VoteActivity[]> {
    const recentVotes = await db
      .select({
        id: votes.id,
        winnerId: votes.winnerId,
        loserId: votes.loserId,
        pointsChanged: votes.pointsChanged,
        createdAt: votes.timestamp,
        userId: votes.userId,
      })
      .from(votes)
      .orderBy(desc(votes.timestamp))
      .limit(limit);

    // Get dive site names and user information for each vote
    const activities: VoteActivity[] = [];
    
    for (const vote of recentVotes) {
      const [winner] = await db.select({ name: diveSites.name }).from(diveSites).where(eq(diveSites.id, vote.winnerId));
      const [loser] = await db.select({ name: diveSites.name }).from(diveSites).where(eq(diveSites.id, vote.loserId));
      const [user] = await db.select({ email: users.email }).from(users).where(sql`${users.id} = ${vote.userId}`);
      
      if (winner && loser && user) {
        // Extract username from email (part before @)
        const username = user.email.split('@')[0];
        
        activities.push({
          id: vote.id,
          winnerName: winner.name,
          loserName: loser.name,
          pointsChanged: vote.pointsChanged,
          timestamp: vote.createdAt.toISOString(),
          username: username,
        });
      }
    }

    return activities;
  }

  async resetUserVotes(userId: string): Promise<boolean> {
    try {
      // Delete all votes for the specified user
      await db.delete(votes).where(eq(votes.userId, userId));
      return true;
    } catch (error) {
      console.error("Error resetting user votes:", error);
      return false;
    }
  }
}