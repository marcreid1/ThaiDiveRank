import bcrypt from "bcryptjs";
import { SECURITY_CONSTANTS } from "../constants";

export async function hashSecurityAnswer(answer: string): Promise<string> {
  // Normalize the answer (lowercase, trim whitespace)
  const normalizedAnswer = answer.toLowerCase().trim();
  return await bcrypt.hash(normalizedAnswer, SECURITY_CONSTANTS.BCRYPT_SECURITY_ROUNDS);
}

export async function verifySecurityAnswer(answer: string, hashedAnswer: string): Promise<boolean> {
  // Normalize the answer the same way
  const normalizedAnswer = answer.toLowerCase().trim();
  return await bcrypt.compare(normalizedAnswer, hashedAnswer);
}

export function validateSecurityAnswers(answers: string[]): boolean {
  return answers.every(answer => 
    answer && 
    answer.trim().length >= 2 && 
    answer.trim().length <= 100
  );
}