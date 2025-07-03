import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { httpLogger, securityMonitor, spikeDetection, errorLogger } from "./middleware/logging";
import { appLogger } from "./logger";
import { randomBytes } from "crypto";

// Ensure JWT_SECRET is set for authentication
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error("JWT_SECRET environment variable is required for secure authentication in production");
    console.error("Please add JWT_SECRET to your deployment secrets");
    
    // Instead of immediately exiting, give a grace period for logging
    setTimeout(() => {
      console.error("Shutting down due to missing JWT_SECRET");
      process.exit(1);
    }, 5000);
    
    // Provide a temporary fallback to prevent immediate crash
    const randomSecret = randomBytes(32).toString('base64');
    console.warn("Using temporary JWT_SECRET for graceful startup - this is not secure for production");
    process.env.JWT_SECRET = randomSecret;
  } else {
    // Development fallback with a dynamically generated secure random key
    const randomSecret = randomBytes(32).toString('base64');
    console.warn("JWT_SECRET not found in environment, using dynamically generated development fallback");
    process.env.JWT_SECRET = randomSecret;
  }
}

const app = express();

// Trust proxy for accurate IP addresses (fixes rate limiting issues)
app.set('trust proxy', true);

// Security headers middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  
  next();
});

// CORS configuration
app.use((req, res, next) => {
  const origin = req.get('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000'
  ];
  
  // Add Replit production domains
  if (process.env.NODE_ENV === 'production' && process.env.REPLIT_DOMAINS) {
    const replitDomains = process.env.REPLIT_DOMAINS.split(',');
    allowedOrigins.push(...replitDomains.map(domain => `https://${domain.trim()}`));
  }
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Security and logging middleware
app.use(securityMonitor);
app.use(spikeDetection);
app.use(httpLogger);

// Request size limits (protect against DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only log response data in development, and exclude sensitive endpoints
      if (process.env.NODE_ENV === 'development' && 
          !path.includes('/auth/') && 
          !path.includes('/signin') && 
          !path.includes('/signup') && 
          capturedJsonResponse) {
        const responseLog = JSON.stringify(capturedJsonResponse);
        if (responseLog.length > 200) {
          logLine += ` :: ${responseLog.slice(0, 200)}...`;
        } else {
          logLine += ` :: ${responseLog}`;
        }
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // Use the enhanced error logger
    app.use(errorLogger);

    // Global error handler to prevent crashes
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      appLogger.error('Uncaught Exception', error);
      // Don't exit immediately in production, give time for logging
      if (process.env.NODE_ENV === 'production') {
        setTimeout(() => process.exit(1), 1000);
      } else {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      appLogger.error('Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)));
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      appLogger.info(`Server started on port ${port}`, { 
        environment: app.get("env"),
        nodeVersion: process.version,
        host: "0.0.0.0"
      });
    });

    // Handle server errors gracefully
    server.on('error', (error) => {
      console.error('Server error:', error);
      appLogger.error('Server error', error);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    appLogger.error('Failed to start server', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
})();
