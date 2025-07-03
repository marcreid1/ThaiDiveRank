import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoteSchema, insertUserSchema } from "@shared/schema";
import { ZodError, z } from "zod";
import { createRateLimiter, createUserBasedRateLimiter } from "./middleware/logging";
import { rateLimiters } from "./config/rateLimits";
import { requestAnalytics } from "./logger";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyJWT, optionalAuth } from "./middleware/auth";
import { SECURITY_CONSTANTS } from "./constants";

export async function registerRoutes(app: Express): Promise<Server> {
  // User-based rate limiting for authenticated voting
  const userVoteLimit = createUserBasedRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each user to 10 votes per minute
    message: "Too many votes, please slow down.",
    name: "vote"
  });

  // User-based rate limiting for security operations
  const userSecurityLimit = createUserBasedRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each user to 3 security operations per 15 minutes
    message: "Too many security requests, please try again later.",
    name: "security"
  });

  // User-based rate limiting for general authenticated actions
  const userActionLimit = createUserBasedRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // generous limit for user actions
    message: "Too many actions, please slow down.",
    name: "userActions"
  });

  // User signup
  app.post("/api/signup", rateLimiters.auth, async (req, res) => {
    try {
      // Create signup schema that accepts password instead of hashedPassword
      const signupSchema = insertUserSchema.omit({ hashedPassword: true }).extend({
        email: z.string()
          .email("Invalid email format")
          .max(254, "Email too long")
          .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format")
          .refine(email => !email.includes("'") && !email.includes('"') && !email.includes('--') && !email.includes(';'), {
            message: "Invalid email format"
          }),
        password: z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number")
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
      const hashedPassword = await bcrypt.hash(userData.password, SECURITY_CONSTANTS.BCRYPT_SALT_ROUNDS);
      
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

  // JWT generation helper function
  const generateJWT = (user: { id: string; email: string }) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable not set');
    }
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
  app.post("/api/signin", rateLimiters.auth, async (req, res) => {
    try {
      // Create signin schema that accepts password instead of hashedPassword
      const signinSchema = z.object({
        email: z.string()
          .email("Invalid email format")
          .max(254, "Email too long")
          .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format")
          .refine(email => !email.includes("'") && !email.includes('"') && !email.includes('--') && !email.includes(';'), {
            message: "Invalid email format"
          }),
        password: z.string().min(1, "Password is required")
      });
      
      // Validate input with Zod
      const { email, password } = signinSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          message: "User does not have an account" 
        });
      }
      
      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: "Invalid email or password" 
        });
      }

      // If user is deactivated, reactivate them on successful login
      if (!user.isActive) {
        await storage.reactivateUser(user.id);
        console.log(`[ACCOUNT_REACTIVATION] User account reactivated: ${user.email} (ID: ${user.id})`);
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

  // Forgot password - Get security questions
  app.post("/api/auth/forgot-password", rateLimiters.auth, async (req, res) => {
    try {
      const schema = z.object({
        email: z.string()
          .email("Invalid email format")
          .max(254, "Email too long")
          .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format")
          .refine(email => !email.includes("'") && !email.includes('"') && !email.includes('--') && !email.includes(';'), {
            message: "Invalid email format"
          })
      });
      
      const { email } = schema.parse(req.body);
      
      const result = await storage.getUserSecurityQuestions(email);
      
      if (!result.questions) {
        return res.status(404).json({ 
          message: "No security questions found for this email. Contact support for assistance." 
        });
      }
      
      res.json({
        message: "Security questions retrieved",
        questions: result.questions,
        userId: result.userId
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid email format",
          errors: error.errors 
        });
      } else {
        console.error("Forgot password error:", error);
        res.status(500).json({ 
          message: "Server error" 
        });
      }
    }
  });

  // Verify security answers and reset password
  app.post("/api/auth/reset-password", rateLimiters.auth, async (req, res) => {
    try {
      const schema = z.object({
        userId: z.string().uuid("Invalid user ID format"),
        answers: z.array(z.string().min(1).max(100)).length(3),
        newPassword: z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number")
      });
      
      const { userId, answers, newPassword } = schema.parse(req.body);
      
      // Get user to verify security answers
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify at least 2 out of 3 security answers
      const { verifySecurityAnswer } = await import("./utils/security");
      let correctAnswers = 0;
      
      if (user.securityAnswer1 && await verifySecurityAnswer(answers[0], user.securityAnswer1)) {
        correctAnswers++;
      }
      if (user.securityAnswer2 && await verifySecurityAnswer(answers[1], user.securityAnswer2)) {
        correctAnswers++;
      }
      if (user.securityAnswer3 && await verifySecurityAnswer(answers[2], user.securityAnswer3)) {
        correctAnswers++;
      }
      
      if (correctAnswers < 2) {
        return res.status(400).json({ 
          message: "Security answers incorrect. At least 2 out of 3 must be correct." 
        });
      }
      
      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, SECURITY_CONSTANTS.BCRYPT_SALT_ROUNDS);
      const success = await storage.resetPassword(userId, hashedPassword);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Failed to reset password" 
        });
      }
      
      res.json({
        message: "Password reset successful. You can now sign in with your new password."
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid input data",
          errors: error.errors 
        });
      } else {
        console.error("Reset password error:", error);
        res.status(500).json({ 
          message: "Server error" 
        });
      }
    }
  });

  // Get security questions (for authenticated users)
  app.get("/api/auth/security-questions", verifyJWT, userSecurityLimit, async (req, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user) {
        return res.status(404).json({ 
          message: "User not found" 
        });
      }

      if (!user.securityQuestion1 || !user.securityQuestion2 || !user.securityQuestion3) {
        return res.status(404).json({ 
          message: "No security questions found for this user" 
        });
      }

      res.json({
        questions: [user.securityQuestion1, user.securityQuestion2, user.securityQuestion3],
        answers: ["[Hidden]", "[Hidden]", "[Hidden]"] // Don't expose hashed answers
      });
      
    } catch (error) {
      console.error("Get security questions error:", error);
      res.status(500).json({ 
        message: "Server error" 
      });
    }
  });

  // Create security questions (initial setup)
  app.post("/api/auth/security-questions", verifyJWT, userSecurityLimit, async (req, res) => {
    try {
      const schema = z.object({
        question1: z.string().min(1),
        answer1: z.string().min(2).max(100),
        question2: z.string().min(1),
        answer2: z.string().min(2).max(100),
        question3: z.string().min(1),
        answer3: z.string().min(2).max(100),
      });
      
      const securityData = schema.parse(req.body);
      
      const success = await storage.updateSecurityQuestions(req.userId!, securityData);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Failed to save security questions" 
        });
      }
      
      res.json({
        message: "Security questions saved successfully"
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid input data",
          errors: error.errors 
        });
      } else {
        console.error("Save security questions error:", error);
        res.status(500).json({ 
          message: "Server error" 
        });
      }
    }
  });

  // Update security questions (for existing users)
  app.put("/api/auth/security-questions", verifyJWT, userSecurityLimit, async (req, res) => {
    try {
      const schema = z.object({
        question1: z.string().min(1),
        answer1: z.string().min(2).max(100),
        question2: z.string().min(1),
        answer2: z.string().min(2).max(100),
        question3: z.string().min(1),
        answer3: z.string().min(2).max(100),
      });
      
      const securityData = schema.parse(req.body);
      
      const success = await storage.updateSecurityQuestions(req.userId!, securityData);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Failed to update security questions" 
        });
      }
      
      res.json({
        message: "Security questions updated successfully"
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid input data",
          errors: error.errors 
        });
      } else {
        console.error("Update security questions error:", error);
        res.status(500).json({ 
          message: "Server error" 
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

  // Deactivate user account (requires authentication)
  app.post("/api/account/deactivate", verifyJWT, userActionLimit, async (req, res) => {
    try {
      const userId = req.userId!;
      
      // Verify user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Deactivate the user account
      const success = await storage.deactivateUser(userId);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Failed to deactivate account" 
        });
      }
      
      // Log account deactivation for security
      console.log(`[ACCOUNT_DEACTIVATION] User account deactivated: ${user.email} (ID: ${userId})`);
      
      res.json({
        message: "Account deactivated successfully"
      });
      
    } catch (error) {
      console.error("Account deactivation error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to deactivate account" 
      });
    }
  });

  // Delete user account (requires authentication)
  app.delete("/api/account", verifyJWT, userActionLimit, async (req, res) => {
    try {
      const userId = req.userId!;
      
      // Verify user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete the user account
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Failed to delete account" 
        });
      }
      
      // Log account deletion for security
      console.log(`[ACCOUNT_DELETION] User account deleted successfully: ${user.email} (ID: ${userId})`);
      
      res.json({
        message: "Account deleted successfully"
      });
      
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete account" 
      });
    }
  });

  // Reset all votes for a user (requires authentication)
  app.delete("/api/votes/reset", verifyJWT, userActionLimit, async (req, res) => {
    try {
      const userId = req.userId!;
      
      // Verify user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get count of votes before deletion for logging
      const userVotes = await storage.getUserVotes(userId);
      const voteCount = userVotes.length;
      
      // Delete all votes for this user
      const success = await storage.resetUserVotes(userId);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Failed to reset votes" 
        });
      }
      
      // Log vote reset for security
      console.log(`[VOTE_RESET] User reset all votes: ${user.email} (ID: ${userId}) - ${voteCount} votes deleted`);
      
      res.json({
        message: "All votes reset successfully",
        deletedCount: voteCount
      });
      
    } catch (error) {
      console.error("Vote reset error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to reset votes" 
      });
    }
  });

  // Vote on dive sites (requires authentication) - now with user-based rate limiting
  app.post("/api/vote", verifyJWT, userVoteLimit, async (req, res) => {
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
  app.get("/api/my-votes", rateLimiters.read, verifyJWT, async (req, res) => {
    try {
      const userVotes = await storage.getUserVotes(req.userId!);
      const uniqueMatchups = await storage.getUserUniqueMatchups(req.userId!);
      res.json({
        message: "User votes retrieved successfully",
        votes: userVotes,
        uniqueMatchups: uniqueMatchups,
        totalPossibleMatchups: 903 // C(43,2) = 43 * 42 / 2
      });
    } catch (error) {
      console.error("User votes fetch error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch user votes" 
      });
    }
  });

  // Get dive site rankings
  app.get("/api/rankings", rateLimiters.read, async (req, res) => {
    try {
      const rankings = await storage.getDiveSiteRankings();
      res.json(rankings);
    } catch (error) {
      console.error("Rankings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch rankings" });
    }
  });

  // Get all dive sites
  app.get("/api/dive-sites", rateLimiters.read, async (req, res) => {
    try {
      const diveSites = await storage.getAllDiveSites();
      res.json(diveSites);
    } catch (error) {
      console.error("Dive sites fetch error:", error);
      res.status(500).json({ message: "Failed to fetch dive sites" });
    }
  });

  // Get dive sites grouped by region
  app.get("/api/dive-sites-by-region", rateLimiters.read, async (req, res) => {
    try {
      const diveSitesByRegion = await storage.getDiveSitesByRegion();
      res.json(diveSitesByRegion);
    } catch (error) {
      console.error("Dive sites by region fetch error:", error);
      res.status(500).json({ message: "Failed to fetch dive sites by region" });
    }
  });

  // Get random matchup for voting
  app.get("/api/matchup", rateLimiters.read, optionalAuth, async (req, res) => {
    try {
      const winnerId = req.query.winnerId ? Number(req.query.winnerId) : undefined;
      const winnerSide = req.query.winnerSide as 'A' | 'B' | undefined;
      const userId = req.userId; // Will be undefined for anonymous users
      
      const matchup = await storage.getRandomMatchup(winnerId, winnerSide, userId);
      res.json(matchup);
    } catch (error) {
      console.error("Matchup fetch error:", error);
      
      // Handle completion scenario gracefully
      if (error instanceof Error && error.message === "COMPLETED_ALL_MATCHUPS") {
        res.json({ 
          completed: true, 
          message: "Congratulations! You've voted on all possible dive site matchups!",
          totalMatchups: 903
        });
        return;
      }
      
      res.status(500).json({ message: "Failed to fetch matchup" });
    }
  });

  // Get recent activity
  app.get("/api/activities", rateLimiters.read, async (req, res) => {
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