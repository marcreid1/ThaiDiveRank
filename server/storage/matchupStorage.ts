import { diveSites, votes, type DiveSite } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
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

    // Fallback: Random matchup
    const shuffled = [...allSites].sort(() => Math.random() - 0.5);
    return {
      diveSiteA: shuffled[0],
      diveSiteB: shuffled[1],
    };
  }

  // Helper method to find opponents a champion hasn't faced
  private async getUnfacedOpponents(championId: number, allSites: DiveSite[]): Promise<DiveSite[]> {
    // Get all votes where this site was the winner
    const championWins = await db
      .select({ loserId: votes.loserId })
      .from(votes)
      .where(eq(votes.winnerId, championId));
    
    // Extract IDs of sites this champion has already beaten
    const facedOpponentIds = new Set(championWins.map((vote: any) => vote.loserId));
    
    // Return sites this champion hasn't faced yet (excluding itself)
    return allSites.filter(site => 
      site.id !== championId && !facedOpponentIds.has(site.id)
    );
  }
}