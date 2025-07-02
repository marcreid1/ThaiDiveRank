import { users, votes, diveSites, type User, type InsertUser } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { IUserStorage } from "./interfaces";
import { hashSecurityAnswer } from "../utils/security";
import { calculateEloChange } from "../utils/elo";

export class UserStorage implements IUserStorage {
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async deactivateUser(id: string): Promise<boolean> {
    try {
      const result = await db.update(users).set({ isActive: false }).where(eq(users.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deactivating user:", error);
      return false;
    }
  }

  async reactivateUser(id: string): Promise<boolean> {
    try {
      const result = await db.update(users).set({ isActive: true }).where(eq(users.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error reactivating user:", error);
      return false;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.deleteUserAccountAndVotes(id);
  }

  async deleteUserAccountAndVotes(userId: string): Promise<boolean> {
    try {
      await db.transaction(async (tx) => {
        // First delete all votes associated with the user
        await tx.delete(votes).where(eq(votes.userId, userId));
        
        // Then delete the user account
        await tx.delete(users).where(eq(users.id, userId));
        
        // Recalculate all ELO ratings and win/loss counts from remaining votes
        await this.recalculateAllEloRatings(tx);
      });

      console.log(`[ACCOUNT_DELETION] User account and votes deleted successfully, ELO ratings recalculated: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting user account and votes:', error);
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

  async updateSecurityQuestions(userId: string, securityData: {
    question1: string;
    answer1: string;
    question2: string;
    answer2: string;
    question3: string;
    answer3: string;
  }): Promise<boolean> {
    try {
      const hashedAnswer1 = await hashSecurityAnswer(securityData.answer1);
      const hashedAnswer2 = await hashSecurityAnswer(securityData.answer2);
      const hashedAnswer3 = await hashSecurityAnswer(securityData.answer3);

      const result = await db.update(users).set({
        securityQuestion1: securityData.question1,
        securityAnswer1: hashedAnswer1,
        securityQuestion2: securityData.question2,
        securityAnswer2: hashedAnswer2,
        securityQuestion3: securityData.question3,
        securityAnswer3: hashedAnswer3,
      }).where(eq(users.id, userId));

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error updating security questions:", error);
      return false;
    }
  }

  async getUserSecurityQuestions(email: string): Promise<{
    questions: [string, string, string] | null;
    userId: string | null;
  }> {
    try {
      const [user] = await db.select({
        id: users.id,
        securityQuestion1: users.securityQuestion1,
        securityQuestion2: users.securityQuestion2,
        securityQuestion3: users.securityQuestion3,
      }).from(users).where(eq(users.email, email));

      if (!user || !user.securityQuestion1 || !user.securityQuestion2 || !user.securityQuestion3) {
        return { questions: null, userId: null };
      }

      return {
        questions: [user.securityQuestion1, user.securityQuestion2, user.securityQuestion3],
        userId: user.id
      };
    } catch (error) {
      console.error("Error getting security questions:", error);
      return { questions: null, userId: null };
    }
  }

  async resetPassword(userId: string, newHashedPassword: string): Promise<boolean> {
    try {
      const result = await db.update(users).set({
        hashedPassword: newHashedPassword
      }).where(eq(users.id, userId));

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error resetting password:", error);
      return false;
    }
  }
}