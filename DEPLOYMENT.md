# IrysDEX Deployment Guide

## GitHub Repository Setup

### 1. Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: IrysDEX - Decentralized Data Exchange Platform"
```

### 2. Connect to Your GitHub Repository
```bash
git remote add origin https://github.com/yourusername/irysdex.git
git branch -M main
git push -u origin main
```

### 3. Environment Variables for Production
Create a `.env.production` file with:
```
DATABASE_URL=your_production_database_url
VITE_IRYS_NETWORK=mainnet
VITE_IRYS_RPC_URL=https://rpc.irys.xyz
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
```

## Vercel Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

### 3. Configure Build Settings
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 4. Environment Variables in Vercel
Add these in your Vercel dashboard:
- `DATABASE_URL`
- `VITE_IRYS_NETWORK`
- `VITE_IRYS_RPC_URL`
- `VITE_CONTRACT_ADDRESS`

## Smart Contract Deployment

### 1. Deploy to Irys Mainnet
```bash
npx hardhat run deploy/deploy.js --network irys-mainnet
```

### 2. Verify Contracts
```bash
npx hardhat verify --network irys-mainnet CONTRACT_ADDRESS
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Smart contracts deployed to mainnet
- [ ] Database migrated to production
- [ ] Domain configured with SSL
- [ ] Error monitoring setup
- [ ] Performance monitoring enabled
- [ ] Security audit completed

## Live URLs
- Frontend: `https://yourdomain.com`
- API: `https://yourdomain.com/api`
- Irys Explorer: `https://explorer.irys.xyz`

## Support
For deployment issues, check the logs in Vercel dashboard and Irys network status.