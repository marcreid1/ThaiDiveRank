import { z } from 'zod';
import { SECURITY_CONSTANTS } from '../constants';

// Input sanitization helpers
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Enhanced validation schemas with security considerations
export const securePasswordSchema = z.string()
  .min(SECURITY_CONSTANTS.MIN_PASSWORD_LENGTH, `Password must be at least ${SECURITY_CONSTANTS.MIN_PASSWORD_LENGTH} characters`)
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

export const secureEmailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email must be less than 254 characters')
  .transform(sanitizeEmail);

export const secureStringSchema = z.string()
  .max(1000, 'Input too long')
  .transform(sanitizeString);

// Security answer validation
export const securityAnswerSchema = z.string()
  .min(2, 'Answer must be at least 2 characters')
  .max(100, 'Answer must be less than 100 characters')
  .transform(sanitizeString);

// Rate limiting helpers
export interface SecurityContext {
  ip: string;
  userAgent?: string;
  userId?: string;
}

export function logSecurityEvent(
  event: string, 
  context: SecurityContext, 
  details?: any
): void {
  console.log(`[SECURITY] ${event}`, {
    ip: context.ip,
    userAgent: context.userAgent?.substring(0, 100),
    userId: context.userId,
    timestamp: new Date().toISOString(),
    details
  });
}

// Input validation middleware factory
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logSecurityEvent('VALIDATION_FAILED', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.userId
        }, error.errors);
        
        return res.status(400).json({
          message: 'Invalid input data',
          errors: error.errors
        });
      }
      next(error);
    }
  };
}