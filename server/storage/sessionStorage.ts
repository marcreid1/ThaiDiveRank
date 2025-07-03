import { BaseStorage } from './base.js';
import { db } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq, gt, sql } from 'drizzle-orm';

export interface ActiveUser {
  id: string;
  email: string;
  username: string;
  lastActivity: Date;
  currentPage?: string;
  isOnline: boolean;
}

export interface SessionActivity {
  userId: string;
  lastActivity: Date;
  currentPage?: string;
  userAgent?: string;
  ipAddress?: string;
}

export class SessionStorage extends BaseStorage {
  private activeSessions = new Map<string, SessionActivity>();
  private readonly ONLINE_THRESHOLD_MINUTES = 5;

  async updateUserActivity(userId: string, currentPage?: string, userAgent?: string, ipAddress?: string): Promise<void> {
    try {
      this.logOperation('updateUserActivity', { userId, currentPage });
      
      this.activeSessions.set(userId, {
        userId,
        lastActivity: new Date(),
        currentPage,
        userAgent,
        ipAddress
      });

      // Clean up old sessions periodically
      this.cleanupOldSessions();
    } catch (error) {
      this.handleStorageError('updateUserActivity', error);
    }
  }

  async getActiveUsers(): Promise<ActiveUser[]> {
    try {
      this.logOperation('getActiveUsers');
      
      // Clean up old sessions first
      this.cleanupOldSessions();
      
      if (this.activeSessions.size === 0) {
        return [];
      }

      // Get user details for active sessions
      const activeUserIds = Array.from(this.activeSessions.keys());
      const cutoffTime = new Date(Date.now() - this.ONLINE_THRESHOLD_MINUTES * 60 * 1000);
      
      const activeUsers = await db
        .select({
          id: users.id,
          email: users.email,
          isActive: users.isActive
        })
        .from(users)
        .where(
          sql`${users.id} = ANY(${activeUserIds}) AND ${users.isActive} = true`
        );

      return activeUsers.map(user => {
        const session = this.activeSessions.get(user.id);
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          lastActivity: session?.lastActivity || new Date(),
          currentPage: session?.currentPage,
          isOnline: session ? session.lastActivity > cutoffTime : false
        };
      }).filter(user => user.isOnline);
    } catch (error) {
      this.handleStorageError('getActiveUsers', error);
    }
  }

  async getUserCount(): Promise<{ total: number; online: number; recentlyActive: number }> {
    try {
      this.logOperation('getUserCount');
      
      // Clean up old sessions
      this.cleanupOldSessions();
      
      const cutoffTime = new Date(Date.now() - this.ONLINE_THRESHOLD_MINUTES * 60 * 1000);
      const recentCutoffTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes for "recently active"
      
      // Get total user count
      const totalUsersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, true));
      
      const totalUsers = totalUsersResult[0]?.count || 0;
      
      // Count online and recently active users
      let onlineCount = 0;
      let recentlyActiveCount = 0;
      
      for (const session of this.activeSessions.values()) {
        if (session.lastActivity > cutoffTime) {
          onlineCount++;
        }
        if (session.lastActivity > recentCutoffTime) {
          recentlyActiveCount++;
        }
      }
      
      return {
        total: totalUsers,
        online: onlineCount,
        recentlyActive: recentlyActiveCount
      };
    } catch (error) {
      this.handleStorageError('getUserCount', error);
    }
  }

  async getSessionActivity(): Promise<SessionActivity[]> {
    try {
      this.logOperation('getSessionActivity');
      
      this.cleanupOldSessions();
      
      return Array.from(this.activeSessions.values())
        .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    } catch (error) {
      this.handleStorageError('getSessionActivity', error);
    }
  }

  private cleanupOldSessions(): void {
    const cutoffTime = new Date(Date.now() - this.ONLINE_THRESHOLD_MINUTES * 60 * 1000);
    
    for (const [userId, session] of this.activeSessions.entries()) {
      if (session.lastActivity < cutoffTime) {
        this.activeSessions.delete(userId);
      }
    }
  }

  async removeUserSession(userId: string): Promise<void> {
    try {
      this.logOperation('removeUserSession', { userId });
      this.activeSessions.delete(userId);
    } catch (error) {
      this.handleStorageError('removeUserSession', error);
    }
  }
}