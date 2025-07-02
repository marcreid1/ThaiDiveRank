// ELO Rating System Constants
export const ELO_CONSTANTS = {
  DEFAULT_RATING: 1500,
  K_FACTOR: 32,
} as const;

// Security Constants
export const SECURITY_CONSTANTS = {
  BCRYPT_SALT_ROUNDS: 12,
  BCRYPT_SECURITY_ROUNDS: 12, // For security questions
  JWT_EXPIRES_IN: "24h", // Reduced from 7d for better security
  JWT_ISSUER: "diverank-app",
  JWT_AUDIENCE: "diverank-users",
  MIN_PASSWORD_LENGTH: 8,
  REQUIRED_SECURITY_QUESTIONS: 3,
  JWT_SECRET_MIN_LENGTH: 32,
} as const;

// Database Constants
export const DATABASE_CONSTRAINTS = {
  MAX_QUERY_LIMIT: 1000,
  DEFAULT_VOTES_LIMIT: 20,
  DEFAULT_ACTIVITY_LIMIT: 10,
} as const;

// Matchup Constants  
export const MATCHUP_CONSTANTS = {
  MIN_SITES_FOR_MATCHUP: 2,
  TOTAL_POSSIBLE_MATCHUPS: 903, // 43 * 42 / 2 for 43 dive sites
} as const;

// HTTP Status Codes (for consistency)
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,  
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;