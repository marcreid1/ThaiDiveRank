import { createRateLimiter } from "../middleware/logging";

export const rateLimitConfigs = {
  vote: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each user to 10 votes per minute
    message: "Too many votes, please slow down.",
    name: "vote",
    useUserBasedLimiting: true // Per-user limits for authenticated voting
  },
  
  read: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // generous limit for read operations
    message: "Too many requests, please try again later.",
    name: "read",
    useUserBasedLimiting: false // IP-based for public read operations
  },
  
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // security limit for auth operations per IP
    message: "Too many signup attempts, please try again later.",
    name: "auth",
    useUserBasedLimiting: false // IP-based to prevent distributed attacks
  },
  
  security: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // strict limit for security operations per user
    message: "Too many security requests, please try again later.",
    name: "security",
    useUserBasedLimiting: true // Per-user limits for authenticated security operations
  },

  // New user-specific rate limiters for authenticated actions
  userActions: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // generous limit for general user actions
    message: "Too many actions, please slow down.",
    name: "userActions",
    useUserBasedLimiting: true
  }
} as const;

export const rateLimiters = {
  vote: createRateLimiter(rateLimitConfigs.vote),
  read: createRateLimiter(rateLimitConfigs.read),
  auth: createRateLimiter(rateLimitConfigs.auth),
  security: createRateLimiter(rateLimitConfigs.security),
  userActions: createRateLimiter(rateLimitConfigs.userActions),
};