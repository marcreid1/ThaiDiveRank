import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema with proper timestamps and validation
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Dive Sites schema
export const diveSites = pgTable("dive_sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  types: text("types").array().notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  rating: real("rating").notNull().default(1500),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  depthMin: integer("depth_min").default(0),
  depthMax: integer("depth_max").default(0),
  difficulty: text("difficulty").default("Intermediate"),
  previousRank: integer("previous_rank").default(0),
  currentRank: integer("current_rank").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDiveSiteSchema = createInsertSchema(diveSites).omit({
  id: true,
  rating: true,
  wins: true,
  losses: true,
  depthMin: true,
  depthMax: true,
  difficulty: true,
  createdAt: true,
});

export type InsertDiveSite = z.infer<typeof insertDiveSiteSchema>;
export type DiveSite = typeof diveSites.$inferSelect;

// User sessions to track authentication across requests
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Votes schema with proper foreign key constraints and session tracking
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  winnerId: integer("winner_id").notNull().references(() => diveSites.id),
  loserId: integer("loser_id").notNull().references(() => diveSites.id),
  pointsChanged: integer("points_changed").notNull(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  timestamp: true,
}).extend({
  userId: z.number().optional(),
  sessionId: z.string().optional(),
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

// Additional types for the API responses
export interface DiveSiteRanking extends DiveSite {
  rankChange: number;
}

export interface VoteActivity {
  id: number;
  winnerName: string;
  loserName: string;
  pointsChanged: number;
  timestamp: string;
  username: string;
}
