import { createRateLimiter } from "../middleware/logging";

export const rateLimitConfigs = {
  vote: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 votes per minute
    message: "Too many votes, please slow down.",
    name: "vote"
  },
  
  read: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // generous limit for read operations
    message: "Too many requests, please try again later.",
    name: "read"
  },
  
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // security limit for auth operations
    message: "Too many signup attempts, please try again later.",
    name: "auth"
  },
  
  security: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // strict limit for security operations
    message: "Too many security requests, please try again later.",
    name: "security"
  }
} as const;

export const rateLimiters = {
  vote: createRateLimiter(rateLimitConfigs.vote),
  read: createRateLimiter(rateLimitConfigs.read),
  auth: createRateLimiter(rateLimitConfigs.auth),
  security: createRateLimiter(rateLimitConfigs.security),
};