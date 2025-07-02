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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```