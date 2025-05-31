import { votes, diveSites, users, type Vote, type InsertVote, type VoteActivity } from "@shared/schema";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import { calculateEloChange } from "../utils/elo";
import { IVoteStorage } from "./interfaces";

export class VoteStorage implements IVoteStorage {
  async createVote(insertVote: InsertVote): Promise<Vote> {
    console.log(`[STORAGE] createVote called with data:`, insertVote);
    console.log(`[STORAGE] User ID from insertVote: ${insertVote.userId}`);
    
    // Get current ratings for ELO calculation
    const [winner] = await db.select().from(diveSites).where(eq(diveSites.id, insertVote.winnerId));
    const [loser] = await db.select().from(diveSites).where(eq(diveSites.id, insertVote.loserId));

    if (!winner || !loser) {
      throw new Error("Invalid dive site IDs");
    }

    console.log(`[STORAGE] Winner: ${winner.name} (Rating: ${winner.rating})`);
    console.log(`[STORAGE] Loser: ${loser.name} (Rating: ${loser.rating})`);

    // Use database transaction for atomic operations
    return await db.transaction(async (tx) => {
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
}