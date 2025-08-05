# DataSwap Deployment Guide

## Vercel Deployment

Your DataSwap application is configured for deployment on Vercel with the following setup:

### Frontend (Static Build)
- Uses Vite to build the React frontend
- Outputs to `dist/` directory
- Configured for static hosting

### Backend (Serverless Functions)
- Express server wrapped as Vercel serverless function
- All `/api/*` routes handled by the serverless function
- Automatic scaling and CDN distribution

### Deployment Steps

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository: `https://github.com/NnamdiCode/Datadextoken`
   - Vercel will automatically detect the configuration
   - Click "Deploy"

3. **Environment Variables (Important!):**
   In your Vercel dashboard, add these environment variables:
   - `NODE_ENV=production`
   - `IRYS_PRIVATE_KEY` (if you have one for production)
   - Any other environment variables your app needs

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