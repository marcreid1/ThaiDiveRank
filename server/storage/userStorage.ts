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

  async deleteUser(id: string): Promise<boolean> {
    try {
      // First, anonymize the user's votes by setting userId to null
      await db.update(votes).set({ userId: null }).where(eq(votes.userId, id));
      
      // Then delete the user account
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
}