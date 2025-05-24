import morgan from 'morgan';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { securityLogger, appLogger, requestAnalytics } from '../logger';

// Custom Morgan format for structured logging
export const httpLogger = morgan((tokens, req, res) => {
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
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { message: options.message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req: Request, res: Response) => {
      // Log rate limit exceeded
      securityLogger.rateLimitExceeded(
        req.ip || 'unknown',
        req.originalUrl,
        req.get('User-Agent')
      );

      res.status(429).json({ message: options.message });
    },
    onLimitReached: (req: Request) => {
      securityLogger.suspiciousActivity(
        req.ip || 'unknown',
        'Rate limit threshold reached',
        {
          endpoint: req.originalUrl,
          limitName: options.name,
          userAgent: req.get('User-Agent')
        }
      );
    }
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

  // Log unauthorized access attempts to protected routes
  if (req.originalUrl.startsWith('/api/') && req.originalUrl !== '/api/auth/me' && 
      req.originalUrl !== '/api/auth/signin' && req.originalUrl !== '/api/auth/signup') {
    if (!req.session?.userId && req.method !== 'GET') {
      securityLogger.unauthorizedAccess(ip, req.originalUrl, userAgent);
    }
  }

  next();
};

// Request spike detection
const requestCounts = new Map<string, { count: number; timestamp: number }>();
const SPIKE_THRESHOLD = 50; // requests per minute
const SPIKE_WINDOW = 60 * 1000; // 1 minute

export const spikeDetection = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
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

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  appLogger.error('Unhandled error', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.session?.userId
  });

  if (!res.headersSent) {
    res.status(500).json({ message: 'Internal server error' });
  }

  next(err);
};