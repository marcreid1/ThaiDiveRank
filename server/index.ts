import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { httpLogger, securityMonitor, spikeDetection, errorLogger } from "./middleware/logging";
import { appLogger } from "./logger";
import { securityHeaders, corsConfig, inputMonitor, advancedRateLimit } from "./config/security";

// Ensure JWT_SECRET is set for authentication
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error("JWT_SECRET environment variable is required for secure authentication in production");
    process.exit(1);
  } else {
    // Development fallback with a secure random key
    console.warn("JWT_SECRET not found in environment, using secure development fallback");
    process.env.JWT_SECRET = "EIuonJQMa283RWswFbqrsOXbbTQSsf785Slrpw9foYI=";
  }
}

const app = express();

// Trust proxy for accurate IP addresses (fixes rate limiting issues)
app.set('trust proxy', true);

// Enhanced CORS Configuration
app.use(corsConfig);

// Advanced Security Monitoring (keeping rate limiting and input monitoring)
app.use(inputMonitor);
app.use(advancedRateLimit);

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
  const server = await registerRoutes(app);

  // Use the enhanced error logger
  app.use(errorLogger);

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
      nodeVersion: process.version 
    });
  });
})();
