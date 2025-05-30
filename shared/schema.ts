import { pgTable, text, serial, integer, boolean, timestamp, real, json, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
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

// Votes schema (with user authentication)
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  winnerId: integer("winner_id").notNull().references(() => diveSites.id),
  loserId: integer("loser_id").notNull().references(() => diveSites.id),
  pointsChanged: integer("points_changed").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  timestamp: true,
});

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
}
