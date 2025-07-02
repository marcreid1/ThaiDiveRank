import { diveSites, votes, type DiveSite } from "@shared/schema";
import { db } from "../db";
import { eq, or, sql } from "drizzle-orm";
import { IMatchupStorage } from "./interfaces";
import { eloService } from "../services/eloService";

export class MatchupStorage implements IMatchupStorage {
  async getRandomMatchup(winnerId?: number, winnerSide?: 'A' | 'B', userId?: string): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    const allSites = await db.select().from(diveSites).orderBy(diveSites.name);
    
    if (allSites.length < 2) {
      throw new Error("Not enough dive sites for matchup");
    }

    // If user is authenticated, ensure no duplicate matchups across their entire history
    if (userId) {
      return this.getUniqueMatchupForUser(allSites, userId, winnerId, winnerSide);
    }

    // Anonymous user - use legacy global duplicate prevention
    return this.getLegacyMatchup(allSites, winnerId, winnerSide);
  }

  // Helper method to find opponents a champion hasn't faced
  private async getUnfacedOpponents(championId: number, allSites: DiveSite[]): Promise<DiveSite[]> {
    // Get all votes where this site was the winner
    const championWins = await db
      .select({ loserId: votes.loserId })
      .from(votes)
      .where(eq(votes.winnerId, championId));
    
    // Get all votes where this site was the loser
    const championLosses = await db
      .select({ winnerId: votes.winnerId })
      .from(votes)
      .where(eq(votes.loserId, championId));
    
    // Extract IDs of all sites this champion has faced (won against or lost to)
    const facedOpponentIds = new Set<number>();
    championWins.forEach((vote: any) => facedOpponentIds.add(vote.loserId));
    championLosses.forEach((vote: any) => facedOpponentIds.add(vote.winnerId));
    
    // Return sites this champion hasn't faced yet (excluding itself)
    return allSites.filter(site => 
      site.id !== championId && !facedOpponentIds.has(site.id)
    );
  }

  // Helper method to get a random matchup that hasn't occurred before
  private async getRandomUniqueMatchup(allSites: DiveSite[]): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    // Get all existing matchup pairs (regardless of who won)
    const existingVotes = await db
      .select({ winnerId: votes.winnerId, loserId: votes.loserId })
      .from(votes);
    
    const existingPairs = new Set<string>();
    existingVotes.forEach((vote: any) => {
      // Create a normalized pair key (smaller ID first to avoid A-B vs B-A duplicates)
      const [id1, id2] = [vote.winnerId, vote.loserId].sort((a, b) => a - b);
      existingPairs.add(`${id1}-${id2}`);
    });

    // Find all possible unique pairs that haven't been voted on
    const availablePairs: { diveSiteA: DiveSite, diveSiteB: DiveSite }[] = [];
    for (let i = 0; i < allSites.length; i++) {
      for (let j = i + 1; j < allSites.length; j++) {
        const pairKey = `${allSites[i].id}-${allSites[j].id}`;
        if (!existingPairs.has(pairKey)) {
          availablePairs.push({
            diveSiteA: allSites[i],
            diveSiteB: allSites[j]
          });
        }
      }
    }

    // If we have unused pairs, return a random one
    if (availablePairs.length > 0) {
      const randomIndex = Math.floor(Math.random() * availablePairs.length);
      return availablePairs[randomIndex];
    }

    // Fallback: if all pairs have been used, return a random matchup anyway
    const shuffled = [...allSites].sort(() => Math.random() - 0.5);
    return {
      diveSiteA: shuffled[0],
      diveSiteB: shuffled[1],
    };
  }

  // Optimized user-specific matchup logic using cached statistics
  private async getUniqueMatchupForUser(
    allSites: DiveSite[], 
    userId: string, 
    winnerId?: number, 
    winnerSide?: 'A' | 'B'
  ): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    // Use efficient single query to get user vote count and check completion
    const userVoteCount = await eloService.getUserVoteCount(userId);
    const totalPossibleMatchups = (allSites.length * (allSites.length - 1)) / 2;
    
    if (userVoteCount >= totalPossibleMatchups) {
      throw new Error("COMPLETED_ALL_MATCHUPS");
    }

    // Get user's voted pairs using optimized query
    const userVotedPairs = await this.getUserVotedPairsOptimized(userId);

    // If we have a champion, try to find unvoted opponents
    if (winnerId) {
      const champion = allSites.find(site => site.id === winnerId);
      if (!champion) {
        throw new Error("Champion dive site not found");
      }

      const availableOpponents = allSites.filter(site => {
        if (site.id === winnerId) return false;
        
        // Check if this pair has been voted on by this user
        const [id1, id2] = [winnerId, site.id].sort((a, b) => a - b);
        const pairKey = `${id1}-${id2}`;
        return !userVotedPairs.has(pairKey);
      });

      if (availableOpponents.length > 0) {
        const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        
        // Maintain champion position based on winnerSide
        if (winnerSide === 'A') {
          return { diveSiteA: champion, diveSiteB: randomOpponent };
        } else {
          return { diveSiteA: randomOpponent, diveSiteB: champion };
        }
      }
      
      // Champion has no available opponents, break champion streak and find new pair
    }

    // Generate completely new matchup from unvoted pairs
    return this.getRandomUnvotedPairForUser(allSites, userVotedPairs);
  }

  // Optimized method to get user's voted pairs using a single efficient query
  private async getUserVotedPairsOptimized(userId: string): Promise<Set<string>> {
    const votedPairs = await db
      .select({
        pair: sql<string>`CASE 
          WHEN ${votes.winnerId} < ${votes.loserId} 
          THEN ${votes.winnerId} || '-' || ${votes.loserId}
          ELSE ${votes.loserId} || '-' || ${votes.winnerId}
        END`
      })
      .from(votes)
      .where(eq(votes.userId, userId));

    return new Set(votedPairs.map(row => row.pair));
  }

  private getRandomUnvotedPairForUser(allSites: DiveSite[], userVotedPairs: Set<string>): { diveSiteA: DiveSite, diveSiteB: DiveSite } {
    const availablePairs: { diveSiteA: DiveSite, diveSiteB: DiveSite }[] = [];
    
    // Generate all possible pairs that haven't been voted on by this user
    for (let i = 0; i < allSites.length; i++) {
      for (let j = i + 1; j < allSites.length; j++) {
        const site1 = allSites[i];
        const site2 = allSites[j];
        
        const [id1, id2] = [site1.id, site2.id].sort((a, b) => a - b);
        const pairKey = `${id1}-${id2}`;
        
        if (!userVotedPairs.has(pairKey)) {
          availablePairs.push({ diveSiteA: site1, diveSiteB: site2 });
        }
      }
    }

    if (availablePairs.length === 0) {
      throw new Error("COMPLETED_ALL_MATCHUPS");
    }

    // Return random unvoted pair
    const randomIndex = Math.floor(Math.random() * availablePairs.length);
    return availablePairs[randomIndex];
  }

  // Legacy matchup logic for anonymous users
  private async getLegacyMatchup(
    allSites: DiveSite[], 
    winnerId?: number, 
    winnerSide?: 'A' | 'B'
  ): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    // If we have a winner from previous round, try to find unfaced opponents
    if (winnerId) {
      const unfacedOpponents = await this.getUnfacedOpponents(winnerId, allSites);
      
      if (unfacedOpponents.length > 0) {
        // Champion vs unfaced opponent
        const champion = allSites.find(site => site.id === winnerId);
        if (!champion) {
          throw new Error("Champion not found");
        }
        
        const randomOpponent = unfacedOpponents[Math.floor(Math.random() * unfacedOpponents.length)];
        
        // Respect the side preference
        if (winnerSide === 'A') {
          return { diveSiteA: champion, diveSiteB: randomOpponent };
        } else {
          return { diveSiteA: randomOpponent, diveSiteB: champion };
        }
      }
    }

    // Fallback: Random matchup that avoids global duplicates
    return await this.getRandomUniqueMatchup(allSites);
  }
}