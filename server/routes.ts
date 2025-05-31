import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoteSchema, insertUserSchema } from "@shared/schema";
import { ZodError, z } from "zod";
import { createRateLimiter } from "./middleware/logging";
import { requestAnalytics } from "./logger";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyJWT } from "./middleware/auth";

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
    max: 5, // restored to original security limit
    message: "Too many signup attempts, please try again later.",
    name: "auth"
  });

  // User signup
  app.post("/api/signup", authLimit, async (req, res) => {
    try {
      // Create signup schema that accepts password instead of hashedPassword
      const signupSchema = insertUserSchema.omit({ hashedPassword: true }).extend({
        password: z.string().min(6, "Password must be at least 6 characters")
      });
      
      // Validate input with Zod
      const userData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ 
          message: "User with this email already exists" 
        });
      }
      
      // Hash the password using bcrypt
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
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
      } else if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        // Handle database constraint violation for duplicate email
        res.status(409).json({ 
          message: "User already exists" 
        });
      } else if (error instanceof Error && error.message.includes('email')) {
        // Handle other email-related errors
        res.status(409).json({ 
          message: "User already exists" 
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
      // Create signin schema that accepts password instead of hashedPassword
      const signinSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1, "Password is required")
      });
      
      // Validate input with Zod
      const { email, password } = signinSchema.parse(req.body);
      
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

  // Protected route to test JWT middleware
  app.get("/api/profile", verifyJWT, async (req, res) => {
    try {
      // Get user from database using the verified userId
      const user = await storage.getUserById(req.userId!);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        message: "Profile retrieved successfully",
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error("Profile retrieval error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to retrieve profile" 
      });
    }
  });

  // Vote on dive sites (requires authentication)
  app.post("/api/vote", voteLimit, verifyJWT, async (req, res) => {
    try {
      const voteData = insertVoteSchema.parse(req.body);
      
      // Log authenticated user details
      console.log(`[VOTE] Authenticated user: ${req.user?.email} (ID: ${req.userId})`);
      console.log(`[VOTE] Request body:`, req.body);
      
      // Add the authenticated user's ID to the vote data
      const voteWithUser = {
        ...voteData,
        userId: req.userId! // userId is guaranteed to exist because of verifyJWT middleware
      };
      
      console.log(`[VOTE] Full vote data for insert:`, voteWithUser);
      
      requestAnalytics.trackVote(req, voteData.winnerId, voteData.loserId, 32);
      const vote = await storage.createVote(voteWithUser);
      
      console.log(`[VOTE] Successfully inserted vote with ID: ${vote.id}`);
      console.log(`[VOTE] Vote details: Winner=${vote.winnerId}, Loser=${vote.loserId}, Points=${vote.pointsChanged}, User=${vote.userId}`);
      
      res.json({ 
        message: "Vote recorded successfully",
        vote 
      });
    } catch (error) {
      console.log(`[VOTE] Error occurred for user ${req.userId}:`, error);
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

  // Get user's votes (requires authentication)
  app.get("/api/my-votes", readLimit, verifyJWT, async (req, res) => {
    try {
      const userVotes = await storage.getUserVotes(req.userId!);
      res.json({
        message: "User votes retrieved successfully",
        votes: userVotes
      });
    } catch (error) {
      console.error("User votes fetch error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch user votes" 
      });
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