#!/bin/bash

# Deployment script for DiveRank
echo "Starting deployment build process..."

# Check required environment variables
if [ -z "$JWT_SECRET" ]; then
    echo "ERROR: JWT_SECRET environment variable is required for production deployment"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is required"
    exit 1
fi

echo "Environment variables check passed ✓"

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Build the application
echo "Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist/public" ]; then
    echo "ERROR: Build failed - dist/public directory not found"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "ERROR: Build failed - dist/index.js not found"
    exit 1
fi

echo "Build completed successfully ✓"
echo "Starting production server..."

# Start the server
NODE_ENV=production node dist/index.js