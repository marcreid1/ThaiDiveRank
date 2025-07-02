import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Create logs directory if it doesn't exist
const logsDir = './logs';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for log levels
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Create console format
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Create file format
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Security logs transport
const securityLogTransport = new DailyRotateFile({
  filename: `${logsDir}/security-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
  level: 'warn'
});

// Application logs transport
const appLogTransport = new DailyRotateFile({
  filename: `${logsDir}/app-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
  level: 'info'
});

// Error logs transport
const errorLogTransport = new DailyRotateFile({
  filename: `${logsDir}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
  level: 'error'
});

// HTTP access logs transport
const httpLogTransport = new DailyRotateFile({
  filename: `${logsDir}/access-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
  level: 'http'
});

// Create winston logger
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    appLogTransport,
    errorLogTransport,
    securityLogTransport,
    httpLogTransport,
  ],
  exitOnError: false,
});

// Security logger - specifically for authentication and rate limiting events
export const securityLogger = {
  failedLogin: (ip: string, username: string, userAgent?: string) => {
    logger.warn('Failed login attempt', {
      type: 'FAILED_LOGIN',
      ip,
      username,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  successfulLogin: (ip: string, username: string, userId: number, userAgent?: string) => {
    logger.info('Successful login', {
      type: 'SUCCESSFUL_LOGIN',
      ip,
      username,
      userId,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  rateLimitExceeded: (ip: string, endpoint: string, userAgent?: string) => {
    logger.warn('Rate limit exceeded', {
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      endpoint,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  suspiciousActivity: (ip: string, activity: string, details: any) => {
    logger.warn('Suspicious activity detected', {
      type: 'SUSPICIOUS_ACTIVITY',
      ip,
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  },

  unauthorizedAccess: (ip: string, endpoint: string, userAgent?: string) => {
    logger.warn('Unauthorized access attempt', {
      type: 'UNAUTHORIZED_ACCESS',
      ip,
      endpoint,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }
};

// Application logger
export const appLogger = {
  info: (message: string, meta?: any) => {
    logger.info(message, { ...meta, timestamp: new Date().toISOString() });
  },

  error: (message: string, error?: Error, meta?: any) => {
    logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  warn: (message: string, meta?: any) => {
    logger.warn(message, { ...meta, timestamp: new Date().toISOString() });
  },

  debug: (message: string, meta?: any) => {
    logger.debug(message, { ...meta, timestamp: new Date().toISOString() });
  },

  http: (message: string, meta?: any) => {
    logger.http(message, { ...meta, timestamp: new Date().toISOString() });
  },

  security: (message: string, meta?: any) => {
    logger.warn(message, { 
      type: 'SECURITY_EVENT',
      ...meta, 
      timestamp: new Date().toISOString() 
    });
  }
};

// Request analytics
export const requestAnalytics = {
  trackRequest: (req: any, res: any, responseTime: number) => {
    const logData = {
      type: 'HTTP_REQUEST',
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime,
      contentLength: res.get('Content-Length'),
      userId: req.session?.userId,
      timestamp: new Date().toISOString()
    };

    // Log different levels based on status code
    if (res.statusCode >= 500) {
      logger.error('Server error response', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error response', logData);
    } else {
      logger.http('HTTP request', logData);
    }
  },

  trackVote: (req: any, winnerId: number, loserId: number, pointsChanged: number) => {
    logger.info('Vote cast', {
      type: 'VOTE_CAST',
      ip: req.ip || req.connection.remoteAddress,
      userId: req.session?.userId,
      winnerId,
      loserId,
      pointsChanged,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
};

export default logger;