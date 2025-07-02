import { diveSites, votes, type DiveSite } from "@shared/schema";
import { db } from "../db";
import { eq, or } from "drizzle-orm";
import { IMatchupStorage } from "./interfaces";

export class MatchupStorage implements IMatchupStorage {
  async getRandomMatchup(winnerId?: number, winnerSide?: 'A' | 'B'): Promise<{ diveSiteA: DiveSite, diveSiteB: DiveSite }> {
    const allSites = await db.select().from(diveSites).orderBy(diveSites.name);
    
    if (allSites.length < 2) {
      throw new Error("Not enough dive sites for matchup");
    }

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

    // Fallback: Random matchup that avoids duplicates
    return await this.getRandomUniqueMatchup(allSites);
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
}