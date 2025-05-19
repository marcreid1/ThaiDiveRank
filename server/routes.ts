import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculateEloChange } from "./utils/elo";
import { insertVoteSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get a random matchup
  app.get("/api/matchup", async (req, res) => {
    try {
      // Check if we're requesting a specific winnerId to be included
      const winnerId = req.query.winnerId ? parseInt(req.query.winnerId as string) : undefined;
      
      const matchup = await storage.getRandomMatchup(winnerId);
      res.json(matchup);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get matchup" 
      });
    }
  });
  
  // Get rankings
  app.get("/api/rankings", async (req, res) => {
    try {
      const rankingsData = await storage.getDiveSiteRankings();
      res.json(rankingsData);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get rankings" 
      });
    }
  });
  
  // Get recent voting activity
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getRecentActivity(10);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get activities" 
      });
    }
  });
  
  // Get all dive sites
  app.get("/api/dive-sites", async (req, res) => {
    try {
      const diveSites = await storage.getAllDiveSites();
      res.json(diveSites);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get dive sites" 
      });
    }
  });
  
  // Get dive sites organized by region
  app.get("/api/dive-sites-by-region", async (req, res) => {
    try {
      const diveSitesByRegion = await storage.getDiveSitesByRegion();
      res.json(diveSitesByRegion);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get dive sites by region" 
      });
    }
  });
  
  // Get a specific dive site
  app.get("/api/dive-sites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const diveSite = await storage.getDiveSite(id);
      if (!diveSite) {
        return res.status(404).json({ message: "Dive site not found" });
      }
      
      res.json(diveSite);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get dive site" 
      });
    }
  });
  
  // Vote for a dive site
  app.post("/api/vote", async (req, res) => {
    try {
      const { winnerId, loserId } = req.body;
      
      // Validate the vote data
      try {
        insertVoteSchema.parse({ winnerId, loserId, pointsChanged: 0 });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
        }
        throw error;
      }
      
      // Get the dive sites
      const winner = await storage.getDiveSite(winnerId);
      const loser = await storage.getDiveSite(loserId);
      
      if (!winner || !loser) {
        return res.status(404).json({ message: "One or both dive sites not found" });
      }
      
      // Calculate ELO change
      const pointsChanged = calculateEloChange(winner.rating, loser.rating);
      
      // Create the vote
      const vote = await storage.createVote({
        winnerId,
        loserId,
        pointsChanged
      });
      
      res.json({ success: true, vote });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process vote" 
      });
    }
  });
  
  // Skip current matchup
  app.post("/api/skip", async (req, res) => {
    try {
      // No actual processing needed, just return success
      // The client will fetch a new matchup
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to skip matchup" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
