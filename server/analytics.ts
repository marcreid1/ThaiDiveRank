import fs from 'fs';
import path from 'path';
import { appLogger } from './logger';

const LOGS_DIR = './logs';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  type?: string;
  ip?: string;
  username?: string;
  endpoint?: string;
  userAgent?: string;
  userId?: number;
  [key: string]: any;
}

export interface AnalyticsData {
  failedLogins: LogEntry[];
  successfulLogins: LogEntry[];
  rateLimitExceeded: LogEntry[];
  suspiciousActivity: LogEntry[];
  recentVotes: LogEntry[];
  requestSpikes: LogEntry[];
  topIPs: { ip: string; count: number }[];
  hourlyStats: { hour: string; requests: number; errors: number }[];
}

// Read and parse log files
function readLogFile(filename: string, maxLines: number = 1000): LogEntry[] {
  try {
    const filePath = path.join(LOGS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').slice(-maxLines);
    
    return lines
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          // Handle non-JSON log lines
          return {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: line,
          };
        }
      })
      .filter(entry => entry.timestamp);
  } catch (error) {
    appLogger.error('Error reading log file', error as Error, { filename });
    return [];
  }
}

// Get today's log filename
function getTodayLogFile(type: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${type}-${today}.log`;
}

// Get analytics data
export function getAnalyticsData(): AnalyticsData {
  const securityLogs = readLogFile(getTodayLogFile('security'));
  const appLogs = readLogFile(getTodayLogFile('app'));
  const accessLogs = readLogFile(getTodayLogFile('access'));

  // Filter different types of events
  const failedLogins = securityLogs.filter(log => log.type === 'FAILED_LOGIN');
  const successfulLogins = securityLogs.filter(log => log.type === 'SUCCESSFUL_LOGIN');
  const rateLimitExceeded = securityLogs.filter(log => log.type === 'RATE_LIMIT_EXCEEDED');
  const suspiciousActivity = securityLogs.filter(log => log.type === 'SUSPICIOUS_ACTIVITY');
  const recentVotes = appLogs.filter(log => log.type === 'VOTE_CAST');
  const requestSpikes = securityLogs.filter(log => 
    log.activity === 'Request spike detected' || log.message?.includes('Request spike')
  );

  // Calculate top IPs
  const ipCounts = new Map<string, number>();
  [...securityLogs, ...accessLogs].forEach(log => {
    if (log.ip && log.ip !== 'unknown') {
      ipCounts.set(log.ip, (ipCounts.get(log.ip) || 0) + 1);
    }
  });

  const topIPs = Array.from(ipCounts.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate hourly stats
  const hourlyMap = new Map<string, { requests: number; errors: number }>();
  accessLogs.forEach(log => {
    const hour = new Date(log.timestamp).getHours().toString().padStart(2, '0');
    const current = hourlyMap.get(hour) || { requests: 0, errors: 0 };
    current.requests++;
    if (log.statusCode && log.statusCode >= 400) {
      current.errors++;
    }
    hourlyMap.set(hour, current);
  });

  const hourlyStats = Array.from(hourlyMap.entries())
    .map(([hour, stats]) => ({ hour: `${hour}:00`, ...stats }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  return {
    failedLogins: failedLogins.slice(-50), // Last 50 failed logins
    successfulLogins: successfulLogins.slice(-50),
    rateLimitExceeded: rateLimitExceeded.slice(-50),
    suspiciousActivity: suspiciousActivity.slice(-50),
    recentVotes: recentVotes.slice(-100), // Last 100 votes
    requestSpikes,
    topIPs,
    hourlyStats,
  };
}

// Get security summary
export function getSecuritySummary() {
  const data = getAnalyticsData();
  
  return {
    totalFailedLogins: data.failedLogins.length,
    totalSuccessfulLogins: data.successfulLogins.length,
    totalRateLimitHits: data.rateLimitExceeded.length,
    totalSuspiciousActivity: data.suspiciousActivity.length,
    totalVotes: data.recentVotes.length,
    totalRequestSpikes: data.requestSpikes.length,
    uniqueIPs: data.topIPs.length,
    lastUpdated: new Date().toISOString(),
  };
}