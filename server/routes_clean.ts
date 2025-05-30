import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoteSchema } from "@shared/schema";
import { ZodError } from "zod";
import { createRateLimiter } from "./middleware/logging";
import { requestAnalytics } from "./logger";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiting for voting
  const voteLimit = createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 votes per minute
    message: "Too many votes, please slow down.",
    name: "vote"
  });

  const readLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // generous limit for read operations
    message: "Too many requests, please try again later.",
    name: "read"
  });

  // Vote on dive sites
  app.post("/api/vote", voteLimit, async (req, res) => {
    try {
      const voteData = insertVoteSchema.parse(req.body);
      
      requestAnalytics.recordVote(req.ip || 'unknown');
      const vote = await storage.createVote(voteData);
      
      res.json(vote);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid vote data",
          errors: error.errors 
        });
      } else {
        console.error("Vote creation error:", error);
        res.status(500).json({ 
          message: error instanceof Error ? error.message : "Failed to create vote" 
        });
      }
    }
  });

  // Get dive site rankings
  app.get("/api/rankings", readLimit, async (req, res) => {
    try {
      const rankings = await storage.getDiveSiteRankings();
      res.json(rankings);
    } catch (error) {
      console.error("Rankings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch rankings" });
    }
  });

  // Get all dive sites
  app.get("/api/dive-sites", readLimit, async (req, res) => {
    try {
      const diveSites = await storage.getAllDiveSites();
      res.json(diveSites);
    } catch (error) {
      console.error("Dive sites fetch error:", error);
      res.status(500).json({ message: "Failed to fetch dive sites" });
    }
  });

  // Get dive sites grouped by region
  app.get("/api/dive-sites-by-region", readLimit, async (req, res) => {
    try {
      const diveSitesByRegion = await storage.getDiveSitesByRegion();
      res.json(diveSitesByRegion);
    } catch (error) {
      console.error("Dive sites by region fetch error:", error);
      res.status(500).json({ message: "Failed to fetch dive sites by region" });
    }
  });

  // Get random matchup for voting
  app.get("/api/matchup", readLimit, async (req, res) => {
    try {
      const winnerId = req.query.winnerId ? Number(req.query.winnerId) : undefined;
      const winnerSide = req.query.winnerSide as 'A' | 'B' | undefined;
      
      const matchup = await storage.getRandomMatchup(winnerId, winnerSide);
      res.json(matchup);
    } catch (error) {
      console.error("Matchup fetch error:", error);
      res.status(500).json({ message: "Failed to fetch matchup" });
    }
  });

  // Get recent activity
  app.get("/api/activities", readLimit, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error) {
      console.error("Activities fetch error:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}