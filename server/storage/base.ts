import { db } from "../db";

export abstract class BaseStorage {
  protected async executeTransaction<T>(operation: (tx: any) => Promise<T>): Promise<T> {
    try {
      return await db.transaction(operation);
    } catch (error) {
      console.error(`Transaction failed in ${this.constructor.name}:`, error);
      throw error;
    }
  }

  protected handleStorageError(operation: string, error: unknown): never {
    const className = this.constructor.name;
    console.error(`${className} ${operation} error:`, error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`${operation} failed in ${className}`);
  }

  protected logOperation(operation: string, details?: any): void {
    const className = this.constructor.name;
    console.log(`[${className}] ${operation}`, details ? details : '');
  }
}