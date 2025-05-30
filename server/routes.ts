import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoteSchema, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import { createRateLimiter } from "./middleware/logging";
import { requestAnalytics } from "./logger";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

  const authLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit signup attempts
    message: "Too many signup attempts, please try again later.",
    name: "auth"
  });

  // User signup
  app.post("/api/signup", authLimit, async (req, res) => {
    try {
      // Validate input with Zod
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ 
          message: "User with this email already exists" 
        });
      }
      
      // Hash the password using bcrypt
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.hashedPassword, saltRounds);
      
      // Store user in database
      const user = await storage.createUser({
        email: userData.email,
        hashedPassword
      });
      
      // Generate JWT token using middleware function
      const token = generateJWT({ id: user.id, email: user.email });
      
      // Return success response with token
      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt
        }
      });
      
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid input data",
          errors: error.errors 
        });
      } else {
        console.error("Signup error:", error);
        res.status(500).json({ 
          message: error instanceof Error ? error.message : "Failed to create user" 
        });
      }
    }
  });

  // JWT generation middleware function
  const generateJWT = (user: { id: string; email: string }) => {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      jwtSecret,
      { 
        expiresIn: '7d' 
      }
    );
  };

  // User signin
  app.post("/api/signin", authLimit, async (req, res) => {
    try {
      // Validate input with Zod
      const { email, hashedPassword: password } = insertUserSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          message: "Invalid email or password" 
        });
      }
      
      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: "Invalid email or password" 
        });
      }
      
      // Generate JWT token using middleware function
      const token = generateJWT({ id: user.id, email: user.email });
      
      // Return success response with token
      res.json({
        message: "Sign in successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt
        }
      });
      
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid input data",
          errors: error.errors 
        });
      } else {
        console.error("Signin error:", error);
        res.status(500).json({ 
          message: error instanceof Error ? error.message : "Failed to sign in" 
        });
      }
    }
  });

  // Vote on dive sites
  app.post("/api/vote", voteLimit, async (req, res) => {
    try {
      const voteData = insertVoteSchema.parse(req.body);
      
      requestAnalytics.trackVote(req, voteData.winnerId, voteData.loserId, 32);
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