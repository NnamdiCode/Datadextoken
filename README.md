# DataSwap - Decentralized Data Exchange

A decentralized data exchange platform built on the Irys blockchain that allows users to tokenize their data and trade it through an automated market maker (AMM).

## 🚀 Live Demo

- **Frontend Demo**: [datadex-three.vercel.app](https://datadex-three.vercel.app/)
- **GitHub Repository**: [Your GitHub URL here]

## ✨ Features

- **Data Tokenization**: Upload data to Irys blockchain and receive ERC-20 tokens
- **Automated Trading**: Uniswap-like AMM with x*y=k constant product formula
- **Real Blockchain Integration**: All transactions recorded on Irys VM
- **Wallet Integration**: MetaMask, Coinbase Wallet, and Web3 wallet support
- **Professional Trading Charts**: TradingView-style charts with real-time data
- **Liquidity Pools**: Create and manage AMM liquidity pools
- **Transaction History**: Full Irys blockchain transaction tracking

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Blockchain**: Irys VM for smart contracts and data storage
- **UI**: shadcn/ui + Tailwind CSS with glass morphism design
- **Charts**: Chart.js with react-chartjs-2

## 📦 Deployment

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon, Supabase, or local)
- Irys API key (optional for development)

### Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Irys (Optional - uses mock mode without this)
IRYS_PRIVATE_KEY=your_irys_private_key

# Session Secret (for authentication)
SESSION_SECRET=your_random_session_secret
```

### Local Development

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Vercel Deployment

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/dataswap.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Set environment variables in Vercel dashboard:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `IRYS_PRIVATE_KEY`: Your Irys private key (optional)
     - `SESSION_SECRET`: Random secret for sessions
   - Deploy automatically triggers on git push

3. **Database Setup**:
   - Create a PostgreSQL database (recommend [Neon](https://neon.tech))
   - Add the connection string to Vercel environment variables
   - Database tables are created automatically via Drizzle

## 🏗 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and API client
├── server/                # Express backend
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage layer
│   ├── db.ts            # Database connection
│   └── services/        # External service integrations
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database and API schemas
└── contracts/           # Smart contracts (Solidity)
```

## 🔧 API Endpoints

- `GET /api/tokens` - Get all data tokens
- `POST /api/upload` - Upload data and create token
- `POST /api/trade` - Execute token swap
- `GET /api/trades` - Get trade history
- `GET /api/irys/balance` - Get wallet IRYS balance
- `POST /api/liquidity/add` - Add liquidity to pool

## 🎯 Smart Contracts

Deployed on Irys VM (Chain ID: 1270):
- **DataRegistry**: Token creation and metadata management
- **DataAMM**: Automated market maker for trading
- **DataMarketplace**: Overall trading ecosystem orchestration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Built on [Irys](https://irys.xyz/) for permanent data storage
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Trading charts powered by [Chart.js](https://www.chartjs.org/)