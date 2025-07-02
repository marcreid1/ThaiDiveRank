import { z } from "zod";
import { insertUserSchema } from "@shared/schema";

// Password validation with strong requirements
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    "Password must contain at least one lowercase letter, one uppercase letter, and one number");

// User signup validation schema
export const signupSchema = insertUserSchema.omit({ hashedPassword: true }).extend({
  password: passwordSchema
});

// User signin validation schema
export const signinSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

// Security questions validation
export const securityQuestionsSchema = z.object({
  question1: z.string().min(1, "Question 1 is required"),
  answer1: z.string().min(1, "Answer 1 is required"),
  question2: z.string().min(1, "Question 2 is required"),
  answer2: z.string().min(1, "Answer 2 is required"),
  question3: z.string().min(1, "Question 3 is required"),
  answer3: z.string().min(1, "Answer 3 is required"),
});

// Password reset request validation
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format")
});

// Password reset validation (with security answers)
export const passwordResetSchema = z.object({
  email: z.string().email("Invalid email format"),
  newPassword: passwordSchema,
  answers: z.array(z.string().min(1, "Answer is required")).length(3, "All three security answers are required")
});

// Vote validation schema extension
export const voteSchema = z.object({
  winnerId: z.number().int().positive("Winner ID must be a positive integer"),
  loserId: z.number().int().positive("Loser ID must be a positive integer")
}).refine(data => data.winnerId !== data.loserId, {
  message: "Winner and loser must be different dive sites"
});