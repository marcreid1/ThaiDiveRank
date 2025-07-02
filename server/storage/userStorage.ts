import { users, votes, type User, type InsertUser } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { IUserStorage } from "./interfaces";

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
    try {
      // For complete deletion, remove all the user's voting history
      await db.delete(votes).where(eq(votes.userId, id));
      
      // Then delete the user account
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
}