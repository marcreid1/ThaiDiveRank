import morgan from 'morgan';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { securityLogger, appLogger, requestAnalytics } from '../logger';

// Custom Morgan format for structured logging
export const httpLogger = morgan((tokens: any, req: any, res: any) => {
  const logData = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    responseTime: tokens['response-time'](req, res),
    ip: req.ip,
    userAgent: tokens['user-agent'](req, res),
    userId: (req as any).session?.userId
  };

  // Track the request in our analytics
  requestAnalytics.trackRequest(req, res, parseFloat(tokens['response-time'](req, res) || '0'));

  return JSON.stringify(logData);
}, {
  stream: {
    write: (message: string) => {
      try {
        const logData = JSON.parse(message);
        appLogger.http('HTTP Request', logData);
      } catch (e) {
        appLogger.http(message.trim());
      }
    }
  }
});

// Enhanced rate limiter with logging
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  name: string;
  useUserBasedLimiting?: boolean;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { message: options.message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    // Use user-based rate limiting for authenticated endpoints, IP-based for others
    keyGenerator: (req: Request): string => {
      // For authenticated endpoints, use user-based rate limiting
      if (options.useUserBasedLimiting && (req as any).userId) {
        return `user:${(req as any).userId}:${options.name}`;
      }
      
      // For unauthenticated endpoints, use IP-based rate limiting
      const forwardedFor = req.get('X-Forwarded-For');
      const realIp = req.get('X-Real-IP');
      const ip = req.ip || req.connection.remoteAddress;
      
      // Use the most reliable IP source available
      const clientIp = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : ip) || 'unknown';
      
      // Combine IP with User-Agent for more accurate rate limiting
      const userAgent = req.get('User-Agent') || 'unknown';
      return `ip:${clientIp}:${userAgent.substring(0, 50)}:${options.name}`;
    },
    handler: (req: Request, res: Response) => {
      // Log rate limit exceeded
      securityLogger.rateLimitExceeded(
        req.ip || 'unknown',
        req.originalUrl,
        req.get('User-Agent')
      );

      res.status(429).json({ message: options.message });
    },
    // Note: onLimitReached callback removed due to version compatibility
  });
}

// Security monitoring middleware
export const securityMonitor = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /\bor\b.*\b1\b.*=.*\b1\b/i,  // SQL injection
  ];

  const url = req.originalUrl || req.url;
  const body = JSON.stringify(req.body);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body)) {
      securityLogger.suspiciousActivity(ip, 'Suspicious request pattern', {
        pattern: pattern.toString(),
        url,
        method: req.method,
        userAgent
      });
      break;
    }
  }

  // Log unauthorized access attempts to protected routes (only for truly protected endpoints)
  // Exclude authentication endpoints and public endpoints from unauthorized access checks
  const protectedRoutes = ['/api/votes'];
  const authRoutes = ['/api/auth/signup', '/api/auth/signin', '/api/auth/logout', '/api/auth/me'];
  const publicRoutes = ['/api/rankings', '/api/matchup', '/api/dive-sites', '/api/recent-activity'];
  
  const isProtectedRoute = protectedRoutes.some(route => req.originalUrl.startsWith(route));
  const isAuthRoute = authRoutes.some(route => req.originalUrl.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => req.originalUrl.startsWith(route));
  
  if (isProtectedRoute && !isAuthRoute && !isPublicRoute && req.method !== 'GET') {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      securityLogger.unauthorizedAccess(ip, req.originalUrl, userAgent);
    }
  }

  next();
};

// Request spike detection
const requestCounts = new Map<string, { count: number; timestamp: number }>();
const SPIKE_THRESHOLD = process.env.NODE_ENV === 'production' ? 150 : 500; // Higher threshold for development
const SPIKE_WINDOW = 60 * 1000; // 1 minute

export const spikeDetection = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  
  // Skip spike detection for localhost in development
  if (process.env.NODE_ENV === 'development' && (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost')) {
    return next();
  }
  
  const now = Date.now();
  const existing = requestCounts.get(ip);

  if (!existing || now - existing.timestamp > SPIKE_WINDOW) {
    requestCounts.set(ip, { count: 1, timestamp: now });
  } else {
    existing.count++;
    if (existing.count > SPIKE_THRESHOLD) {
      securityLogger.suspiciousActivity(ip, 'Request spike detected', {
        requestCount: existing.count,
        timeWindow: SPIKE_WINDOW / 1000,
        userAgent: req.get('User-Agent')
      });
    }
  }

  // Cleanup old entries every 10 minutes
  if (Math.random() < 0.01) {
    for (const [key, value] of requestCounts.entries()) {
      if (now - value.timestamp > 10 * 60 * 1000) {
        requestCounts.delete(key);
      }
    }
  }

  next();
};

// User-based rate limiting middleware for authenticated routes
export function createUserBasedRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  name: string;
}) {
  const limiter = createRateLimiter({
    ...options,
    useUserBasedLimiting: true
  });

  return (req: Request, res: Response, next: NextFunction) => {
    // Apply rate limiting only after authentication has set userId
    limiter(req, res, next);
  };
}

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  appLogger.error('Unhandled error', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).userId // Use JWT-based userId instead of session
  });

  if (!res.headersSent) {
    res.status(500).json({ message: 'Internal server error' });
  }

  next(err);
};