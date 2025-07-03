# DiveRank Deployment Guide

## Current Issue
The signup functionality works in development but fails in production with "Internal Server Error" because the production build assets are missing.

## Root Cause
Your deployed application is missing the `dist/public` directory that contains the built frontend assets. This causes the server to fail when trying to serve static files in production mode.

## Solution

### For Replit Deployments:

1. **Add Build Step to Deployment**
   Your deployment must run the build command before starting the server:
   ```bash
   npm run build
   npm start
   ```

2. **Environment Variables**
   Ensure these are set in your deployment secrets:
   - `JWT_SECRET` (already added ✓)
   - `DATABASE_URL` (should be available ✓)
   - `NODE_ENV=production`

3. **Deployment Configuration**
   Make sure your Replit deployment is configured to:
   - Install dependencies: `npm ci`
   - Build the application: `npm run build`
   - Start the server: `npm start`

### Manual Build Process:
If you need to build manually:
```bash
# Install dependencies
npm ci

# Build the application
npm run build

# Start in production mode
NODE_ENV=production npm start
```

### Verification:
After deployment, check that these directories exist:
- `dist/public/` (contains built frontend assets)
- `dist/index.js` (compiled server code)

## Error Handling
The server now includes better error handling that will show clear messages if the build is missing instead of generic "Internal Server Error".

## Build Output
A successful build creates:
- `dist/public/index.html` - Main HTML file
- `dist/public/assets/` - CSS, JS, and other assets
- `dist/index.js` - Compiled server code

The build process typically takes 1-3 minutes due to the number of dependencies.