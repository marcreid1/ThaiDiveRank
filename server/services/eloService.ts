import { votes, diveSites, type Vote } from "@shared/schema";
import { db } from "../db";
import { eq, and, or } from "drizzle-orm";

export interface DiveSiteStats {
  id: number;
  rating: number;
  wins: number;
  losses: number;
  totalVotes: number;
}

export interface EloUpdateResult {
  winnerNewRating: number;
  loserNewRating: number;
  pointsChanged: number;
}

export class EloService {
  /**
   * Calculate ELO rating change for a matchup
   */
  private calculateEloChange(
    winnerRating: number,
    loserRating: number,
    kFactor: number = 32
  ): number {
    // Calculate the expected score (probability of winning)
    const expectedScore = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    
    // Calculate the rating change (rounded to integer)
    const change = Math.round(kFactor * (1 - expectedScore));
    
    return change;
  }

  /**
   * Calculate current stats for all dive sites based on votes
   */
  async calculateDiveSiteStats(): Promise<Map<number, DiveSiteStats>> {
    const statsMap = new Map<number, DiveSiteStats>();
    
    // Get all dive sites with current ratings
    const allSites = await db.select().from(diveSites);
    
    // Initialize stats for all sites
    for (const site of allSites) {
      statsMap.set(site.id, {
        id: site.id,
        rating: site.rating,
        wins: 0,
        losses: 0,
        totalVotes: 0
      });
    }
    
    // Get all votes and calculate win/loss counts
    const allVotes = await db.select().from(votes);
    
    for (const vote of allVotes) {
      const winnerStats = statsMap.get(vote.winnerId);
      const loserStats = statsMap.get(vote.loserId);
      
      if (winnerStats) {
        winnerStats.wins++;
        winnerStats.totalVotes++;
      }
      
      if (loserStats) {
        loserStats.losses++;
        loserStats.totalVotes++;
      }
    }
    
    return statsMap;
  }

  /**
   * Calculate ELO change for a matchup and return update data
   */
  calculateEloUpdate(winnerRating: number, loserRating: number): EloUpdateResult {
    const pointsChanged = this.calculateEloChange(winnerRating, loserRating);
    
    return {
      winnerNewRating: winnerRating + pointsChanged,
      loserNewRating: loserRating - pointsChanged,
      pointsChanged
    };
  }

  /**
   * Apply ELO update to database within transaction
   */
  async applyEloUpdate(
    tx: any,
    winnerId: number,
    loserId: number,
    update: EloUpdateResult
  ): Promise<void> {
    // Update winner rating
    await tx
      .update(diveSites)
      .set({ rating: update.winnerNewRating })
      .where(eq(diveSites.id, winnerId));

    // Update loser rating
    await tx
      .update(diveSites)
      .set({ rating: update.loserNewRating })
      .where(eq(diveSites.id, loserId));
  }

  /**
   * Recalculate all ELO ratings from scratch based on vote history
   */
  async recalculateAllRatings(): Promise<void> {
    await db.transaction(async (tx) => {
      // Reset all ratings to 1500
      await tx.update(diveSites).set({ rating: 1500 });

      // Get all votes in chronological order
      const allVotes = await tx
        .select()
        .from(votes)
        .orderBy(votes.timestamp);

      // Replay all votes to recalculate ratings
      for (const vote of allVotes) {
        const [winner] = await tx
          .select()
          .from(diveSites)
          .where(eq(diveSites.id, vote.winnerId));
          
        const [loser] = await tx
          .select()
          .from(diveSites)
          .where(eq(diveSites.id, vote.loserId));

        if (winner && loser) {
          const update = this.calculateEloUpdate(winner.rating, loser.rating);
          await this.applyEloUpdate(tx, vote.winnerId, vote.loserId, update);
        }
      }
    });
  }

  /**
   * Get stats for a specific dive site
   */
  async getDiveSiteStats(diveSiteId: number): Promise<DiveSiteStats | null> {
    const statsMap = await this.calculateDiveSiteStats();
    return statsMap.get(diveSiteId) || null;
  }

  /**
   * Get vote count for a specific user's voting history
   */
  async getUserVoteCount(userId: string): Promise<number> {
    const userVotes = await db
      .select()
      .from(votes)
      .where(eq(votes.userId, userId));
    
    return userVotes.length;
  }

  /**
   * Check if a user has voted on a specific matchup
   */
  async hasUserVotedOnMatchup(userId: string, siteAId: number, siteBId: number): Promise<boolean> {
    const [id1, id2] = [siteAId, siteBId].sort((a, b) => a - b);
    
    const existingVote = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          or(
            and(eq(votes.winnerId, id1), eq(votes.loserId, id2)),
            and(eq(votes.winnerId, id2), eq(votes.loserId, id1))
          )
        )
      )
      .limit(1);
    
    return existingVote.length > 0;
  }
}

// Export singleton instance
export const eloService = new EloService();