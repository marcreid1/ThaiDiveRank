// Script to recalculate ELO ratings from scratch based on cleaned vote data
import { db } from './server/db';
import { diveSites, votes } from './shared/schema';
import { calculateEloChange } from './server/utils/elo';
import { eq } from 'drizzle-orm';

async function recalculateEloRatings() {
  console.log('Starting ELO recalculation...');
  
  // Reset all dive sites to starting rating of 1500
  await db.update(diveSites).set({ rating: 1500 });
  console.log('Reset all dive site ratings to 1500');
  
  // Get all votes in chronological order
  const allVotes = await db
    .select()
    .from(votes)
    .orderBy(votes.timestamp);
  
  console.log(`Processing ${allVotes.length} votes...`);
  
  // Process each vote to update ELO ratings
  for (const vote of allVotes) {
    // Get current ratings for winner and loser
    const winner = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.id, vote.winnerId))
      .limit(1);
    
    const loser = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.id, vote.loserId))
      .limit(1);
    
    if (winner.length === 0 || loser.length === 0) {
      console.log(`Skipping vote ${vote.id}: missing dive site`);
      continue;
    }
    
    const winnerRating = winner[0].rating;
    const loserRating = loser[0].rating;
    
    // Calculate ELO change
    const pointsChanged = calculateEloChange(winnerRating, loserRating);
    
    // Update ratings
    await db
      .update(diveSites)
      .set({ 
        rating: winnerRating + pointsChanged,
        wins: winner[0].wins + 1
      })
      .where(eq(diveSites.id, vote.winnerId));
    
    await db
      .update(diveSites)
      .set({ 
        rating: loserRating - pointsChanged,
        losses: loser[0].losses + 1
      })
      .where(eq(diveSites.id, vote.loserId));
    
    // Update the points_changed in the vote record to match the recalculated value
    await db
      .update(votes)
      .set({ pointsChanged })
      .where(eq(votes.id, vote.id));
  }
  
  console.log('ELO recalculation completed!');
  
  // Show final rankings
  const finalRankings = await db
    .select()
    .from(diveSites)
    .orderBy(diveSites.rating);
  
  console.log('\nFinal Rankings:');
  finalRankings.reverse().forEach((site, index) => {
    console.log(`${index + 1}. ${site.name}: ${site.rating} (${site.wins}W/${site.losses}L)`);
  });
  
  process.exit(0);
}

recalculateEloRatings().catch(console.error);