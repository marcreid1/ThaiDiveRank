import type { Request, Response, NextFunction } from 'express';
import { securityLogger } from '../logger';

// Extend Request interface to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    securityLogger.unauthorizedAccess(
      req.ip || 'unknown',
      req.originalUrl,
      req.get('User-Agent')
    );
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Add userId to request for easy access
  req.userId = req.session.userId;
  next();
};

// Middleware to ensure users can only access their own resources
export const requireSelfAccess = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestedUserId = parseInt(req.params[userIdParam]);
    
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (requestedUserId !== req.session.userId) {
      securityLogger.unauthorizedAccess(
        req.ip || 'unknown',
        req.originalUrl,
        req.get('User-Agent')
      );
      return res.status(403).json({ message: "Access denied: You can only access your own data" });
    }
    
    req.userId = req.session.userId;
    next();
  };
};

// Optional auth - adds user info if logged in but doesn't require it
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.userId) {
    req.userId = req.session.userId;
  }
  next();
};