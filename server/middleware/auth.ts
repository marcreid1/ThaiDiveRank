import type { Request, Response, NextFunction } from 'express';
import { securityLogger } from '../logger';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: { userId: string; email: string };
    }
  }
}

// JWT verification middleware
export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      securityLogger.unauthorizedAccess(
        req.ip || 'unknown',
        req.originalUrl,
        req.get('User-Agent')
      );
      console.log(`[AUTH] No Authorization header found for ${req.originalUrl}`);
      return res.status(401).json({ message: "Access token required" });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      securityLogger.unauthorizedAccess(
        req.ip || 'unknown',
        req.originalUrl,
        req.get('User-Agent')
      );
      console.log(`[AUTH] Authorization header malformed: ${authHeader.substring(0, 20)}...`);
      return res.status(401).json({ message: "Access token required" });
    }
    
    // Extract token from "Bearer TOKEN"
    const token = authHeader.substring(7);
    
    if (!token || token.length === 0) {
      console.log(`[AUTH] Empty token extracted from header`);
      return res.status(401).json({ message: "Access token required" });
    }
    
    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AUTH] JWT_SECRET environment variable not set');
      return res.status(500).json({ message: "Server configuration error" });
    }
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    
    // Validate decoded payload
    if (!decoded.userId || !decoded.email) {
      console.log(`[AUTH] Invalid token payload - missing userId or email`);
      return res.status(401).json({ message: "Invalid token payload" });
    }
    
    // Attach user info to request
    req.userId = decoded.userId;
    req.user = { userId: decoded.userId, email: decoded.email };
    
    console.log(`[AUTH] Successfully authenticated user: ${decoded.userId}`);
    next();
  } catch (error) {
    securityLogger.unauthorizedAccess(
      req.ip || 'unknown',
      req.originalUrl,
      req.get('User-Agent')
    );
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.log(`[AUTH] JWT verification failed: ${error.message}`);
      return res.status(401).json({ message: "Invalid access token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      console.log(`[AUTH] JWT token expired: ${error.message}`);
      return res.status(401).json({ message: "Access token expired" });
    } else {
      console.log(`[AUTH] Unexpected error during token verification:`, error);
      return res.status(401).json({ message: "Token verification failed" });
    }
  }
};

// Alias for backward compatibility
export const requireAuth = verifyJWT;

// Middleware to ensure users can only access their own resources
export const requireSelfAccess = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // First verify JWT
    verifyJWT(req, res, (err) => {
      if (err) return;
      
      const requestedUserId = req.params[userIdParam];
      
      if (requestedUserId !== req.userId) {
        securityLogger.unauthorizedAccess(
          req.ip || 'unknown',
          req.originalUrl,
          req.get('User-Agent')
        );
        return res.status(403).json({ message: "Access denied: You can only access your own data" });
      }
      
      next();
    });
  };
};

// Optional auth - adds user info if JWT is present but doesn't require it
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          // Silently fail for optional auth when JWT_SECRET not configured
          next();
          return;
        }
        const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
        
        req.userId = decoded.userId;
        req.user = { userId: decoded.userId, email: decoded.email };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};