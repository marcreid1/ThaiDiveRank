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
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      securityLogger.unauthorizedAccess(
        req.ip || 'unknown',
        req.originalUrl,
        req.get('User-Agent')
      );
      return res.status(401).json({ message: "Access token required" });
    }
    
    // Extract token from "Bearer TOKEN"
    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }
    
    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    
    // Attach user info to request
    req.userId = decoded.userId;
    req.user = { userId: decoded.userId, email: decoded.email };
    
    next();
  } catch (error) {
    securityLogger.unauthorizedAccess(
      req.ip || 'unknown',
      req.originalUrl,
      req.get('User-Agent')
    );
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid access token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Access token expired" });
    } else {
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
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
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