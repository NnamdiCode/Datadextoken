# DataSwap Deployment Guide

## 🚀 Vercel Deployment (Recommended)

### 1. Prepare Your Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial DataSwap deployment"

# Create main branch
git branch -M main

# Add your GitHub remote
git remote add origin https://github.com/yourusername/dataswap.git

# Push to GitHub
git push -u origin main
```

### 2. Database Setup

**Option A: Neon (Recommended)**
1. Go to [neon.tech](https://neon.tech) and create account
2. Create new project named "dataswap"
3. Copy the connection string
4. Database tables will be created automatically

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com) and create project
2. Get PostgreSQL connection string from Settings > Database
3. Use the connection string in your environment variables

**Option C: Railway/PlanetScale**
1. Create PostgreSQL database on your preferred platform
2. Get connection string
3. Set as DATABASE_URL environment variable

### 3. Vercel Configuration

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `vite build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

3. **Environment Variables**:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=random_secret_string_here
   IRYS_PRIVATE_KEY=your_irys_key (optional)
   NODE_ENV=production
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at your-app.vercel.app

### 4. Post-Deployment Setup

1. **Database Migration**:
   - Tables are created automatically via Drizzle
   - No manual migration needed

2. **Test Functionality**:
   - Visit your deployed URL
   - Connect wallet (MetaMask recommended)
   - Try uploading a small test file
   - Verify database persistence

## 🏗 Alternative Deployment Options

### Netlify

```bash
# Build command
npm run build

# Publish directory
dist/public

# Environment variables (same as Vercel)
DATABASE_URL=your_postgresql_url
SESSION_SECRET=your_session_secret
```

### Railway

1. Connect GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy automatically

### Self-Hosted (VPS)

```bash
# On your server
git clone https://github.com/yourusername/dataswap.git
cd dataswap
npm install
npm run build

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migration
npm run db:push

# Start production server
npm start
```

## 🔧 Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Random string for sessions | `your-random-secret-here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `IRYS_PRIVATE_KEY` | Irys blockchain private key | Mock mode |
| `NODE_ENV` | Environment mode | `development` |

## 🚨 Security Checklist

- [ ] Use strong, unique `SESSION_SECRET`
- [ ] Keep `IRYS_PRIVATE_KEY` secure and private
- [ ] Use environment variables for all secrets
- [ ] Enable SSL/HTTPS in production
- [ ] Keep dependencies updated
- [ ] Review database access permissions

## 📊 Monitoring & Analytics

### Recommended Tools

1. **Vercel Analytics**: Built-in performance monitoring
2. **Sentry**: Error tracking and performance monitoring
3. **LogRocket**: User session recordings
4. **Vercel Functions**: Serverless function monitoring

### Database Monitoring

1. **Neon**: Built-in metrics and query analysis
2. **DataDog**: Advanced database monitoring
3. **New Relic**: Full-stack application monitoring

## 🛠 Troubleshooting

### Common Issues

**Build Fails**:
- Check Node.js version (18+ required)
- Verify all dependencies are installed
- Check TypeScript errors

**Database Connection Issues**:
- Verify DATABASE_URL format
- Check database server accessibility
- Ensure database exists

**Runtime Errors**:
- Check environment variables are set
- Verify database schema is up to date
- Check server logs for detailed errors

### Debug Commands

```bash
# Check build locally
npm run build

# Test database connection
npm run db:push

# Check TypeScript errors
npm run check

# View detailed logs
vercel logs your-app-url
```

## 📈 Performance Optimization

### Frontend Optimization

- Static assets are automatically optimized by Vite
- Images are optimized via Vercel Image Optimization
- Code splitting is handled automatically

### Backend Optimization

- Database queries are optimized with proper indexing
- Connection pooling is handled by Drizzle
- API responses are cached where appropriate

### Database Optimization

- Use appropriate indexes on frequently queried columns
- Monitor query performance with database analytics
- Consider read replicas for high-traffic applications

## 🔄 CI/CD Pipeline

### Automatic Deployment

Vercel automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Deployment triggers automatically
```

### Preview Deployments

Every pull request gets its own preview URL for testing.

### Production Safeguards

- Environment variables are isolated between environments
- Database migrations run automatically
- Rollback capability available through Vercel dashboard