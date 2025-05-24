import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { httpLogger, securityMonitor, spikeDetection, errorLogger } from "./middleware/logging";
import { appLogger } from "./logger";

// Extend Express session interface
declare module 'express-session' {
  interface Session {
    userId?: number;
  }
}

const app = express();

// Trust proxy for accurate IP addresses (fixes rate limiting issues)
app.set('trust proxy', true);

// Security and logging middleware
app.use(securityMonitor);
app.use(spikeDetection);
app.use(httpLogger);

// Add body parsing with debugging
app.use((req, res, next) => {
  console.log(`📥 Incoming ${req.method} ${req.path}`);
  if (req.path === '/api/auth/signup') {
    console.log('🔥 SIGNUP REQUEST DETECTED');
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to check body parsing
app.use((req, res, next) => {
  if (req.path === '/api/auth/signup' && req.method === 'POST') {
    console.log('🧪 BODY AFTER PARSING:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Set up session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'dive-site-voting-secret-key',
  resave: false,
  saveUninitialized: true,
  name: 'dive-session',
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
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
