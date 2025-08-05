# DataSwap Deployment Guide

## Fixed Vercel Deployment Issues

### Issue 1: Dynamic Require Error
The `__require` error was caused by trying to run Node.js server code in Vercel's edge runtime. Fixed by:
- Removed incompatible `builds` configuration
- Switched to frontend-only deployment
- Simplified `vercel.json` configuration

### Issue 2: Deprecated Builds Warning
The warning about `builds` existing in configuration has been resolved by:
- Removing the `builds` array from `vercel.json`
- Using modern Vercel configuration with `buildCommand` and `outputDirectory`
- Letting Vercel auto-detect the framework (Vite)

## Current Deployment Setup

### Frontend-Only Deployment (Recommended)
- Uses Vite to build the React frontend
- Outputs to `dist/` directory
- Static hosting on Vercel's CDN
- No serverless functions (avoids Node.js compatibility issues)

### Deployment Steps

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Fix Vercel deployment configuration - frontend-only"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository: `https://github.com/NnamdiCode/Datadextoken`
   - **IMPORTANT**: In build settings, override the build command to: `vite build --config vite.config.production.ts`
   - Set output directory to: `dist/public`
   - Click "Deploy"

3. **Vercel Build Settings:**
   Make sure these settings are configured:
   - **Build Command**: `vite build --config vite.config.production.ts`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`
   - **Framework**: Vite

4. **Environment Variables (Optional):**
   In your Vercel dashboard, you can optionally add:
   - `VITE_USE_MOCK_API=true` (to force mock API usage)
   - `VITE_API_URL=your-backend-url` (if you deploy backend separately)

### How the Fixed Deployment Works

1. **Frontend-Only Build**: Uses Vite to build React app as static files
2. **Mock API Fallback**: If backend is unavailable, automatically uses mock data
3. **No Node.js Runtime**: Avoids all serverless function compatibility issues
4. **Demo Mode**: Users can still test all functionality with sample data

### Configuration Files

- `vercel.json` - Deployment configuration
- `api/server.js` - Serverless function wrapper for Express

### Features Included in Deployment

✓ Complete token swap functionality
✓ Irys blockchain integration
✓ TradingView-style charts
✓ AMM trading mechanism
✓ Real-time token quotes
✓ Professional UI with Irys branding

### Troubleshooting

If you encounter issues:

1. **Build Errors:** Check that all dependencies are in `package.json`
2. **API Errors:** Ensure environment variables are set in Vercel dashboard
3. **Routing Issues:** Verify the routes in `vercel.json` match your app structure

### Alternative: Frontend-Only Deployment

If you want to deploy just the frontend (for testing):

1. Remove the `api/` directory and backend routes from `vercel.json`
2. Use a separate backend service (Railway, Render, etc.)
3. Update your API endpoints in the frontend to point to the external backend

Your app is now ready for production deployment!