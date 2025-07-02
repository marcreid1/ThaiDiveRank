# DiveRank - Diving Site Ranking System

## Overview

DiveRank is a full-stack web application that uses the ELO rating system to rank diving sites through community voting. Users can participate in head-to-head comparisons of dive sites, with ratings dynamically updated based on voting outcomes. The platform features a modern React frontend with a Node.js/Express backend and PostgreSQL database.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for fast development and optimized builds
- **Authentication**: JWT-based client-side auth with localStorage persistence

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcrypt password hashing
- **Middleware**: Rate limiting, security headers, CORS, structured logging
- **Architecture Pattern**: Modular storage layer with interface segregation

### Database Schema
- **Database**: PostgreSQL with Neon serverless hosting
- **Tables**:
  - `users` - User accounts with UUID primary keys
  - `dive_sites` - Dive site information with ELO ratings
  - `votes` - Vote records linking users, winners, and losers
- **Key Features**: ELO rating calculations, vote tracking, ranking history

## Key Components

### Authentication System
- JWT-based authentication with localStorage storage
- Centralized auth helpers in `/lib/auth.ts`
- Protected routes with automatic token validation
- Auth state management through TanStack Query
- Sign-up/sign-in forms with validation

### ELO Rating System
- Mathematical ranking system adapted from chess
- Dynamic rating updates based on vote outcomes
- Expected score calculations for fair point distribution
- Real-time ranking updates with historical tracking

### Voting Mechanism
- Head-to-head dive site comparisons
- Champion continuation system for engaging user experience
- Vote persistence with user tracking
- Real-time activity feed

### Data Storage Layer
- Modular storage architecture with interface segregation
- Separate storage classes: UserStorage, DiveSiteStorage, VoteStorage, MatchupStorage
- Database transactions for atomic operations
- Optimized queries with Drizzle ORM

## Data Flow

1. **User Authentication**: Users sign up/in → JWT token stored → Server validates token on requests
2. **Voting Process**: User votes → ELO calculation → Database update → Ranking recalculation
3. **Matchup Generation**: System selects dive sites → Considers champion preferences → Returns comparison pair
4. **Real-time Updates**: Vote submitted → Query invalidation → UI updates with new data
5. **Ranking Display**: Database aggregation → ELO-based sorting → Ranked list presentation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM
- **jsonwebtoken**: JWT token handling
- **bcryptjs**: Password hashing and verification
- **express-rate-limit**: API rate limiting
- **winston**: Structured logging system

### UI Dependencies
- **@radix-ui/***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router
- **react-hook-form**: Form handling with validation
- **@hookform/resolvers** + **zod**: Schema validation

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **@replit/vite-plugin-***: Replit-specific tooling

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- Express server with nodemon-like behavior using tsx
- Environment variables for database and JWT configuration
- Hot reloading for both frontend and backend

### Production Build
- Vite builds optimized client bundle to `dist/public`
- esbuild compiles server code to `dist/index.js`
- Static file serving through Express
- Environment-based configuration (NODE_ENV)

### Database Management
- Drizzle migrations in `/migrations` directory
- Schema definitions in `/shared/schema.ts`
- Push-based deployments with `drizzle-kit push`

## Changelog

```
Changelog:
- July 02, 2025. Initial setup
- July 02, 2025. Added account deactivation/reactivation system:
  * Users can now deactivate accounts (preserves voting history)
  * Accounts auto-reactivate on successful sign-in
  * Updated Privacy Policy and Terms of Service
  * Dashboard UI includes both deactivation and deletion options
- July 02, 2025. Fixed critical voting logic issues:
  * Resolved duplicate matchup bug causing impossible vote counts (Fantasy Reef: 46→41 votes)
  * Enhanced matchup generation to prevent duplicate head-to-head comparisons
  * Cleaned up 35 duplicate votes from database
  * Fixed About page and "View all rankings" buttons that logged out users by replacing anchor tags with Link components
- July 02, 2025. Added Total Votes column to rankings:
  * Shows how many times each dive site has been voted on (wins + losses)
  * Provides insight into voting activity reliability for each site
  * Updated both main Rankings page and homepage rankings table
- July 02, 2025. Enhanced About page with ELO explanation:
  * Added section explaining why sites with fewer votes can rank higher
  * Clarifies quality vs quantity principle of ELO rating system
- July 02, 2025. Implemented comprehensive duplicate prevention system:
  * MAJOR: Complete elimination of duplicate matchups across user's entire voting history
  * User-specific voting history tracking to ensure true unique matchups
  * Enhanced matchup generation with bidirectional duplicate checks
  * Graceful completion handling when users finish all 903 possible matchups
  * Added unique matchups counter (X/903) with progress bar on dashboard
  * Champion system now respects user's voting history for opponent selection
  * Automatic champion retirement when no unvoted opponents available
  * Performance optimization with efficient database queries and in-memory caching
  * Anonymous users continue using legacy global duplicate prevention
  * Authenticated users get guaranteed unique matchups throughout their journey
- July 02, 2025. Implemented comprehensive security questions management:
  * Added mandatory SecuritySetupDialog that appears after user signup
  * Created SecurityQuestionsDialog for viewing/editing existing security questions
  * Added "View Security Questions" button in Dashboard Account Management section
  * Implemented GET/POST/PUT endpoints for security questions CRUD operations
  * Security answers properly hidden for security (not displayed in plain text)
  * Fixed JSON parsing issues with improved error handling in API responses
  * Both new and existing users can manage their security questions securely
- July 02, 2025. Implemented comprehensive code refactoring for improved maintainability:
  * Created BaseStorage class to eliminate duplicate error handling patterns
  * Extracted rate limiting configuration into centralized config/rateLimits.ts
  * Added responseHelpers.ts for consistent authentication response patterns
  * Created validation/schemas.ts to centralize form validation logic
  * Built useDashboardActions hook to reduce Dashboard component complexity
  * Added constants.ts file to eliminate magic numbers throughout codebase
  * Created queryHelpers.ts for reusable database query patterns
  * All changes maintain existing functionality while improving code organization
- July 02, 2025. Fixed critical security vulnerabilities:
  * Removed hardcoded JWT secret fallbacks - production now requires proper environment configuration
  * Standardized bcrypt salt rounds to 12 across all password and security question hashing
  * Centralized security constants to prevent inconsistent hashing strengths
  * Added secure JWT secret validation with proper production vs development handling
  * Enhanced security error handling without exposing internal implementation details
  * All fixes maintain backward compatibility with existing user accounts
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```