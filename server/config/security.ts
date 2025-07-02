import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { securityLogger, appLogger } from '../logger';

// Enhanced Security Headers with Helmet.js
export const securityHeaders = helmet({
  // Content Security Policy - Relaxed for development
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Vite dev
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      childSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  // Prevent clickjacking - Allow for development
  frameguard: { action: 'sameorigin' },
  // Prevent MIME sniffing
  noSniff: true,
  // XSS Protection
  xssFilter: true,
  // Referrer Policy
  referrerPolicy: { policy: 'same-origin' },
  // HTTP Strict Transport Security - Disabled for development
  hsts: false,
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  // IE No Open
  ieNoOpen: true,
  // Permission Policy
  permittedCrossDomainPolicies: false
});

// Enhanced CORS Configuration - Permissive for development
export const corsConfig = cors({
  origin: true, // Allow all origins for development
  // origin: (origin, callback) => {
  //   // Allow requests with no origin (mobile apps, etc.)
  //   if (!origin) return callback(null, true);
  //   
  //   // For development, allow all origins
  //   callback(null, true);
  // },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-ID'],
  maxAge: 86400 // 24 hours
});

// Malicious Pattern Detection
const MALICIOUS_PATTERNS = [
  // SQL Injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  // XSS patterns
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/i,
  /on\w+\s*=/i,
  // Path traversal
  /\.\.\//g,
  /\.\.\\/g,
  // Command injection
  /[;&|`$()]/g,
  // NoSQL injection
  /\$where|\$ne|\$gt|\$lt|\$or|\$and/i
];

const SUSPICIOUS_PATTERNS = [
  // Multiple encoding attempts
  /%[0-9a-f]{2}/gi,
  // Base64 patterns
  /^[A-Za-z0-9+/]*={0,2}$/,
  // Long strings (potential buffer overflow)
  /.{1000,}/,
  // Multiple special characters
  /[<>'"&;(){}[\]\\\/]{5,}/
];

// Input Monitoring Middleware
export const inputMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestData = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    body: req.body,
    query: req.query,
    params: req.params
  };

  // Convert all input to strings for pattern matching
  const inputStrings = [
    JSON.stringify(req.body || {}),
    JSON.stringify(req.query || {}),
    JSON.stringify(req.params || {}),
    req.url,
    req.get('User-Agent') || ''
  ];

  const allInput = inputStrings.join(' ');
  
  // Check for malicious patterns
  const maliciousMatches = MALICIOUS_PATTERNS.filter(pattern => pattern.test(allInput));
  if (maliciousMatches.length > 0) {
    securityLogger.suspiciousActivity(
      requestData.ip || 'unknown',
      `MALICIOUS_INPUT: ${maliciousMatches.map(p => p.toString()).join(', ')}`,
      requestData.userAgent
    );
    
    return res.status(400).json({ 
      error: 'Invalid request format',
      code: 'INVALID_INPUT'
    });
  }

  // Check for suspicious patterns
  const suspiciousMatches = SUSPICIOUS_PATTERNS.filter(pattern => pattern.test(allInput));
  if (suspiciousMatches.length > 0) {
    securityLogger.suspiciousActivity(
      requestData.ip || 'unknown',
      `SUSPICIOUS_INPUT: ${suspiciousMatches.map(p => p.toString()).join(', ')}`,
      requestData.userAgent
    );
  }

  // Monitor request duration
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) { // Requests taking longer than 5 seconds
      appLogger.error(`Slow request detected: ${requestData.method} ${requestData.url} took ${duration}ms`, 
        new Error('SLOW_REQUEST'), 
        { duration, statusCode: res.statusCode, ip: requestData.ip }
      );
    }
  });

  next();
};

// Advanced Rate Limiting with IP Tracking
interface IPTrackingData {
  requests: number;
  firstRequest: number;
  lastRequest: number;
  failures: number;
  suspiciousActivity: boolean;
}

const ipTracker = new Map<string, IPTrackingData>();
const TRACKING_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 1000;
const MAX_FAILURES_PER_HOUR = 50;

export const advancedRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Clean up old entries
  for (const [trackedIp, data] of ipTracker.entries()) {
    if (now - data.firstRequest > TRACKING_WINDOW) {
      ipTracker.delete(trackedIp);
    }
  }

  // Get or create IP tracking data
  let ipData = ipTracker.get(ip);
  if (!ipData) {
    ipData = {
      requests: 0,
      firstRequest: now,
      lastRequest: now,
      failures: 0,
      suspiciousActivity: false
    };
    ipTracker.set(ip, ipData);
  }

  // Update tracking data
  ipData.requests++;
  ipData.lastRequest = now;

  // Check for rate limiting
  if (ipData.requests > MAX_REQUESTS_PER_HOUR) {
    securityLogger.rateLimitExceeded(ip, req.url, req.get('User-Agent'));

    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(TRACKING_WINDOW / 1000),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Track failures on response
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      ipData!.failures++;
      
      if (ipData!.failures > MAX_FAILURES_PER_HOUR) {
        ipData!.suspiciousActivity = true;
        securityLogger.suspiciousActivity(ip, `HIGH_FAILURE_RATE: ${ipData!.failures} failures`, req.get('User-Agent'));
      }
    }
    
    return originalSend.call(this, data);
  };

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_HOUR);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_HOUR - ipData.requests));
  res.setHeader('X-RateLimit-Reset', new Date(ipData.firstRequest + TRACKING_WINDOW).toISOString());

  next();
};

// Get security analytics
export function getSecurityAnalytics() {
  const analytics = {
    activeIPs: ipTracker.size,
    suspiciousIPs: Array.from(ipTracker.entries())
      .filter(([_, data]) => data.suspiciousActivity)
      .map(([ip, data]) => ({ ip, ...data })),
    topIPs: Array.from(ipTracker.entries())
      .sort(([_, a], [__, b]) => b.requests - a.requests)
      .slice(0, 10)
      .map(([ip, data]) => ({ ip, requests: data.requests, failures: data.failures })),
    totalRequests: Array.from(ipTracker.values()).reduce((sum, data) => sum + data.requests, 0),
    totalFailures: Array.from(ipTracker.values()).reduce((sum, data) => sum + data.failures, 0)
  };

  return analytics;
}