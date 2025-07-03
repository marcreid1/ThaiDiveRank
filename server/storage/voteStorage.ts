import { votes, diveSites, users, type Vote, type InsertVote, type VoteActivity } from "@shared/schema";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import { calculateEloChange } from "../utils/elo";
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
      
      // Efficient duplicate check: look for any vote by this user on this pair
      const duplicateCheck = await tx
        .select({ winnerId: votes.winnerId, loserId: votes.loserId })
        .from(votes)
        .where(eq(votes.userId, insertVote.userId));

      // Check if this specific pair has been voted on by this user
      for (const vote of duplicateCheck) {
        const [existingId1, existingId2] = [vote.winnerId, vote.loserId].sort((a, b) => a - b);
        if (existingId1 === id1 && existingId2 === id2) {
          throw new Error("You have already voted on this matchup");
        }
      }

      // Get current ratings for ELO calculation
      const [winner] = await tx.select().from(diveSites).where(eq(diveSites.id, insertVote.winnerId));
      const [loser] = await tx.select().from(diveSites).where(eq(diveSites.id, insertVote.loserId));

      if (!winner || !loser) {
        throw new Error("Invalid dive site IDs");
      }

      console.log(`[STORAGE] Winner: ${winner.name} (Rating: ${winner.rating})`);
      console.log(`[STORAGE] Loser: ${loser.name} (Rating: ${loser.rating})`);
    
      // Calculate ELO change
      const eloChange = calculateEloChange(winner.rating, loser.rating);
      console.log(`[STORAGE] Calculated ELO change: ${eloChange} points`);

      const insertData = {
        winnerId: insertVote.winnerId,
        loserId: insertVote.loserId,
        pointsChanged: eloChange,
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

      // Update winner rating (increase)
      const newWinnerRating = winner.rating + eloChange;
      await tx
        .update(diveSites)
        .set({ 
          rating: newWinnerRating,
          wins: winner.wins + 1
        })
        .where(eq(diveSites.id, insertVote.winnerId));

      // Update loser rating (decrease)  
      const newLoserRating = loser.rating - eloChange;
      await tx
        .update(diveSites)
        .set({ 
          rating: newLoserRating,
          losses: loser.losses + 1
        })
        .where(eq(diveSites.id, insertVote.loserId));

      console.log(`[STORAGE] Updated ratings - Winner: ${newWinnerRating}, Loser: ${newLoserRating}`);
      
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
      const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, vote.userId));
      
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
      await db.transaction(async (tx) => {
        // Delete all votes for the specified user
        await tx.delete(votes).where(eq(votes.userId, userId));
        
        // Recalculate all ELO ratings and win/loss counts from remaining votes
        await this.recalculateAllEloRatings(tx);
      });
      
      console.log(`[VOTE_RESET] User votes deleted and ELO ratings recalculated: ${userId}`);
      return true;
    } catch (error) {
      console.error("Error resetting user votes:", error);
      return false;
    }
  }

  private async recalculateAllEloRatings(tx: any): Promise<void> {
    // Reset all dive sites to default values
    await tx.update(diveSites).set({
      rating: 1500,
      wins: 0,
      losses: 0
    });

    // Get all remaining votes ordered by timestamp
    const allVotes = await tx
      .select()
      .from(votes)
      .orderBy(votes.timestamp);

    // Replay all votes to recalculate ELO ratings
    for (const vote of allVotes) {
      // Get current ratings
      const [winner] = await tx.select().from(diveSites).where(eq(diveSites.id, vote.winnerId));
      const [loser] = await tx.select().from(diveSites).where(eq(diveSites.id, vote.loserId));

      if (winner && loser) {
        // Calculate ELO change using the same algorithm
        const eloChange = calculateEloChange(winner.rating, loser.rating);

        // Update winner
        await tx.update(diveSites)
          .set({
            rating: winner.rating + eloChange,
            wins: winner.wins + 1
          })
          .where(eq(diveSites.id, vote.winnerId));

        // Update loser
        await tx.update(diveSites)
          .set({
            rating: loser.rating - eloChange,
            losses: loser.losses + 1
          })
          .where(eq(diveSites.id, vote.loserId));
      }
    }
  }
}