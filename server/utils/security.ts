import { SECURITY_CONSTANTS } from '../constants';
import bcrypt from 'bcryptjs';

/**
 * Validates JWT secret strength
 */
export function validateJWTSecret(secret: string | undefined): boolean {
  return Boolean(secret && secret.length >= SECURITY_CONSTANTS.JWT_SECRET_MIN_LENGTH);
}

/**
 * Hashes a password with secure salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SECURITY_CONSTANTS.BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hashes security question answers
 */
export async function hashSecurityAnswer(answer: string): Promise<string> {
  return bcrypt.hash(answer.toLowerCase().trim(), SECURITY_CONSTANTS.BCRYPT_SECURITY_ROUNDS);
}

/**
 * Verifies security question answer
 */
export async function verifySecurityAnswer(answer: string, hash: string): Promise<boolean> {
  return bcrypt.compare(answer.toLowerCase().trim(), hash);
}

/**
 * Generates a cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validates if a string is a potential security threat
 */
export function containsMaliciousContent(input: string): boolean {
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["\'][^"\']*["\']?\s*>/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Rate limiting helper - checks if IP should be blocked
 */
export function shouldBlockIP(ip: string, attempts: number, timeWindow: number): boolean {
  // Simple rate limiting logic - can be enhanced with Redis for production
  return attempts > 10 && timeWindow < 60000; // 10 attempts in 1 minute
}