/**
 * Calculates the Elo rating change for a matchup
 * 
 * @param winnerRating Current rating of the winner
 * @param loserRating Current rating of the loser
 * @param kFactor K-factor determines the maximum possible adjustment per game (default: 32)
 * @returns The points to be added to winner and subtracted from loser
 */
export function calculateEloChange(
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
