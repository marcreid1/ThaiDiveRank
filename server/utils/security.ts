import bcrypt from 'bcryptjs';
import { SECURITY_CONSTANTS } from '../constants';

export async function verifySecurityAnswer(providedAnswer: string, hashedAnswer: string): Promise<boolean> {
  try {
    return await bcrypt.compare(providedAnswer, hashedAnswer);
  } catch (error) {
    console.error('Error verifying security answer:', error);
    return false;
  }
}

export async function hashSecurityAnswer(answer: string): Promise<string> {
  try {
    return await bcrypt.hash(answer, SECURITY_CONSTANTS.BCRYPT_SALT_ROUNDS);
  } catch (error) {
    console.error('Error hashing security answer:', error);
    throw new Error('Failed to hash security answer');
  }
}