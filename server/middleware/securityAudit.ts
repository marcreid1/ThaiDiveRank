import type { Request, Response, NextFunction } from 'express';
import { securityLogger } from '../logger';
import { containsMaliciousContent } from '../utils/security';

interface SecurityEvent {
  type: 'SUSPICIOUS_INPUT' | 'RAPID_REQUESTS' | 'INVALID_TOKEN' | 'BRUTE_FORCE' | 'XSS_ATTEMPT';
  ip: string;
  userAgent?: string;
  endpoint: string;
  userId?: string;
  details?: any;
}

// In-memory tracking for suspicious activity (use Redis in production)
const requestTracker = new Map<string, { count: number; lastRequest: number }>();
const suspiciousIPs = new Set<string>();

/**
 * Logs security events for monitoring and analysis
 */
function logSecurityEvent(event: SecurityEvent): void {
  securityLogger.suspiciousActivity(
    event.ip,
    event.endpoint,
    event.userAgent,
    JSON.stringify({
      type: event.type,
      userId: event.userId,
      details: event.details
    })
  );
  
  console.log(`[SECURITY_AUDIT] ${event.type}`, {
    ip: event.ip,
    endpoint: event.endpoint,
    userId: event.userId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Detects and logs suspicious input patterns
 */
export const inputSecurityAudit = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check request body for malicious content
    if (req.body && typeof req.body === 'object') {
      const bodyString = JSON.stringify(req.body);
      
      if (containsMaliciousContent(bodyString)) {
        logSecurityEvent({
          type: 'XSS_ATTEMPT',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          userId: req.userId,
          details: { suspiciousInput: bodyString.substring(0, 200) }
        });
        
        // Don't block the request but log it for monitoring
      }
    }
    
    // Check query parameters
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    if (queryString && containsMaliciousContent(queryString)) {
      logSecurityEvent({
        type: 'XSS_ATTEMPT',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        userId: req.userId,
        details: { suspiciousQuery: queryString.substring(0, 200) }
      });
    }
    
    next();
  } catch (error) {
    console.error('[SECURITY_AUDIT] Error in input security audit:', error);
    next();
  }
};

/**
 * Monitors for rapid request patterns that might indicate attacks
 */
export const rateLimitAudit = (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 50; // requests per minute
    
    const tracker = requestTracker.get(ip) || { count: 0, lastRequest: now };
    
    // Reset count if outside time window
    if (now - tracker.lastRequest > windowMs) {
      tracker.count = 1;
      tracker.lastRequest = now;
    } else {
      tracker.count++;
    }
    
    requestTracker.set(ip, tracker);
    
    // Log if suspicious activity detected
    if (tracker.count > maxRequests) {
      if (!suspiciousIPs.has(ip)) {
        suspiciousIPs.add(ip);
        logSecurityEvent({
          type: 'RAPID_REQUESTS',
          ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          userId: req.userId,
          details: { requestCount: tracker.count, timeWindow: windowMs }
        });
        
        // Auto-cleanup after 10 minutes
        setTimeout(() => suspiciousIPs.delete(ip), 600000);
      }
    }
    
    next();
  } catch (error) {
    console.error('[SECURITY_AUDIT] Error in rate limit audit:', error);
    next();
  }
};

/**
 * Comprehensive security audit middleware combining all checks
 */
export const securityAuditMiddleware = [
  inputSecurityAudit,
  rateLimitAudit
];

/**
 * Clean up old tracking data periodically
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 300000; // 5 minutes
  
  for (const [ip, tracker] of requestTracker.entries()) {
    if (now - tracker.lastRequest > maxAge) {
      requestTracker.delete(ip);
    }
  }
}, 60000); // Run cleanup every minute