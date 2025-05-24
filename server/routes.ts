import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculateEloChange } from "./utils/elo";
import { insertVoteSchema, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import { createRateLimiter } from "./middleware/logging";
import { requireAuth, optionalAuth } from "./middleware/auth";
import { securityLogger, requestAnalytics } from "./logger";
import { getAnalyticsData, getSecuritySummary } from "./analytics";

// Use the session interface from express-session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Enhanced rate limiting with logging
  const authLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 authentication attempts per windowMs
    message: "Too many authentication attempts, please try again later.",
    name: "auth"
  });

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

  // Check authentication status
  app.get("/api/auth/me", readLimit, async (req, res) => {
    try {
      if (req.session?.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          res.json({ user: { id: user.id, username: user.username } });
        } else {
          res.status(401).json({ message: "User not found" });
        }
      } else {
        res.status(401).json({ message: "Not authenticated" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Sign out
  app.post("/api/auth/signout", readLimit, (req, res) => {
    req.session.userId = undefined;
    res.json({ success: true });
  });
  
  // Get a random matchup
  app.get("/api/matchup", readLimit, async (req, res) => {
    try {
      const winnerId = req.query.winnerId ? parseInt(req.query.winnerId as string) : undefined;
      const winnerSide = req.query.winnerSide as 'A' | 'B' | undefined;
      
      const matchup = await storage.getRandomMatchup(winnerId, winnerSide);
      res.json(matchup);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get matchup" 
      });
    }
  });
  
  // Get rankings
  app.get("/api/rankings", readLimit, async (req, res) => {
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
  app.get("/api/activities", readLimit, async (req, res) => {
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
  app.get("/api/dive-sites", readLimit, async (req, res) => {
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
  app.get("/api/dive-sites-by-region", readLimit, async (req, res) => {
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
  app.get("/api/dive-sites/:id", readLimit, async (req, res) => {
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
  

  
  // Skip current matchup
  app.post("/api/skip", readLimit, async (req, res) => {
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

  // User signup
  app.post("/api/auth/signup", authLimit, async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Simple validation without Drizzle schema
      if (!username || username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }
      
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create new user
      const user = await storage.createUser({ username, email, password });
      
      // Don't return password in response
      const { password: _, ...userResponse } = user;
      res.json({ success: true, user: userResponse });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create account" 
      });
    }
  });

  // User signin
  app.post("/api/auth/signin", authLimit, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      try {
        insertUserSchema.parse({ username, password });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: "Invalid credentials" });
        }
        throw error;
      }
      
      // Authenticate user with secure password checking
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        // Log failed login attempt
        securityLogger.failedLogin(
          req.ip || 'unknown',
          username,
          req.get('User-Agent')
        );
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Log successful login
      securityLogger.successfulLogin(
        req.ip || 'unknown',
        username,
        user.id,
        req.get('User-Agent')
      );
      
      // Store user ID in session
      req.session.userId = user.id;
      console.log("Session set for user:", user.id, "session:", req.session);
      
      // Don't return password in response
      const { password: _, ...userResponse } = user;
      res.json({ success: true, user: userResponse });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to sign in" 
      });
    }
  });

  // User logout
  app.post("/api/auth/logout", readLimit, async (req, res) => {
    try {
      req.session.userId = undefined;
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to logout" 
      });
    }
  });

  // User profile endpoint - users can only access their own data
  app.get("/api/user/profile", readLimit, requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!, req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return password
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get user profile" 
      });
    }
  });

  // User's votes endpoint - users can only access their own votes
  app.get("/api/user/votes", readLimit, requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const userVotes = await storage.getUserVotes(req.userId!, req.userId!, limit);
      res.json(userVotes);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get user votes" 
      });
    }
  });

  // Analytics endpoints (for monitoring)
  app.get("/api/analytics/security", readLimit, async (req, res) => {
    try {
      // Note: In production, you'd want proper admin authentication here
      const summary = getSecuritySummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get security analytics" 
      });
    }
  });

  app.get("/api/analytics/logs", readLimit, async (req, res) => {
    try {
      // Note: In production, you'd want proper admin authentication here
      const data = getAnalyticsData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get log analytics" 
      });
    }
  });



  // Create a vote with authentication
  app.post("/api/vote", voteLimit, requireAuth, async (req, res) => {
    try {
      const { winnerId, loserId } = req.body;
      
      // Validate input
      try {
        insertVoteSchema.parse({ winnerId, loserId, userId: req.userId });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
        }
        throw error;
      }

      // Get dive sites for the vote
      const winner = await storage.getDiveSite(winnerId);
      const loser = await storage.getDiveSite(loserId);
      
      if (!winner || !loser) {
        return res.status(404).json({ message: "Dive site not found" });
      }

      // Calculate ELO change
      const pointsChanged = calculateEloChange(winner.rating, loser.rating);

      // Log the vote for analytics
      requestAnalytics.trackVote(req, winnerId, loserId, pointsChanged);
      
      // Create vote with authenticated user ID
      console.log("Creating vote with userId:", req.userId);
      const vote = await storage.createVote({
        winnerId,
        loserId,
        pointsChanged,
        userId: req.userId,
      }, req.userId!);
      console.log("Vote created:", vote);

      // Note: Ratings are now updated within the createVote method using transactions

      res.json(vote);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create vote" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
