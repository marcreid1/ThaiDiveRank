import bcrypt from "bcryptjs";

/**
 * Hash a security answer for storage
 */
export async function hashSecurityAnswer(answer: string): Promise<string> {
  const normalizedAnswer = answer.toLowerCase().trim();
  return await bcrypt.hash(normalizedAnswer, 10);
}

/**
 * Verify a security answer against the stored hash
 */
export async function verifySecurityAnswer(answer: string, hashedAnswer: string): Promise<boolean> {
  const normalizedAnswer = answer.toLowerCase().trim();
  return await bcrypt.compare(normalizedAnswer, hashedAnswer);
}