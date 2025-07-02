import { Response } from "express";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";

interface UserResponse {
  id: string;
  email: string;
  createdAt: Date;
}

export function generateJWT(payload: { id: string; email: string }): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export function sendAuthSuccess(res: Response, user: UserResponse, message: string = "Success"): void {
  const token = generateJWT({ id: user.id, email: user.email });
  
  res.status(200).json({
    message,
    token,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt
    }
  });
}

export function sendCreatedAuthSuccess(res: Response, user: UserResponse, message: string = "User created successfully"): void {
  const token = generateJWT({ id: user.id, email: user.email });
  
  res.status(201).json({
    message,
    token,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt
    }
  });
}

export function handleValidationError(res: Response, error: ZodError): void {
  res.status(400).json({ 
    message: "Invalid input data",
    errors: error.errors 
  });
}

export function handleAuthError(res: Response, error: unknown): void {
  if (error instanceof ZodError) {
    handleValidationError(res, error);
    return;
  }
  
  if (error instanceof Error) {
    // Handle database constraint violations
    if (error.message.includes('duplicate key value violates unique constraint') || 
        error.message.includes('email')) {
      res.status(409).json({ 
        message: "User already exists" 
      });
      return;
    }
    
    console.error("Authentication error:", error);
    res.status(500).json({ 
      message: error.message || "Authentication failed" 
    });
  } else {
    console.error("Unknown authentication error:", error);
    res.status(500).json({ 
      message: "Authentication failed" 
    });
  }
}

export function sendNotFoundError(res: Response, resource: string = "Resource"): void {
  res.status(404).json({ 
    message: `${resource} not found` 
  });
}

export function sendConflictError(res: Response, message: string): void {
  res.status(409).json({ message });
}

export function sendServerError(res: Response, error: unknown, operation: string = "Operation"): void {
  console.error(`${operation} error:`, error);
  
  const message = error instanceof Error ? error.message : `${operation} failed`;
  res.status(500).json({ message });
}