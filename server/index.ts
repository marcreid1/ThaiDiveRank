import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { httpLogger, securityMonitor, spikeDetection, errorLogger } from "./middleware/logging";
import { securityAuditMiddleware } from "./middleware/securityAudit";
import { appLogger } from "./logger";

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

// Comprehensive security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Vite HMR in development
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Replit preview domains in development
    if (process.env.NODE_ENV === 'development' && origin.includes('.replit.dev')) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Security and logging middleware
app.use(securityMonitor);
app.use(spikeDetection);
app.use(...securityAuditMiddleware);
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
