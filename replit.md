# DataSwap - Decentralized Data Exchange

## Overview

DataSwap is a decentralized data exchange platform built on the Irys blockchain that allows users to tokenize their data and trade it through an automated market maker (AMM). The platform combines blockchain technology with data monetization, enabling users to upload data to Irys, receive ERC-20 tokens representing ownership, and trade these tokens on an integrated DEX.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system featuring glass morphism effects
- **Navigation**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Animations**: Framer Motion for smooth UI transitions
- **Charts**: Chart.js with react-chartjs-2 for trading visualizations

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Storage**: In-memory storage (MemStorage) for efficient data handling
- **Blockchain Integration**: Irys blockchain for permanent data storage
- **File Handling**: Multer for multipart file uploads (data files + token images)
- **API Design**: RESTful API with structured error handling

### Blockchain Integration
- **Primary Blockchain**: Irys network for permanent data storage
- **Token Management**: 0.005 IRYS testnet tokens base fee for token creation
- **Smart Contracts**: Deployed on Irys VM (Chain ID: 1270) with Solidity 0.8.19
- **Contract Types**: 
  - DataRegistry: Manages data token creation and metadata
  - DataAMM: Automated market maker for token trading with dynamic pricing
  - DataMarketplace: Orchestrates the overall trading ecosystem
- **Wallet Integration**: MetaMask and other Web3 wallets via ethers.js
- **Test Networks**: Irys testnet (Chain ID: 1270) for development testing

## Key Components

### Data Upload & Tokenization
- Users upload files through a multi-step wizard interface
- Files are stored permanently on Irys blockchain with metadata tagging
- Optional token images can be uploaded alongside data files
- Each upload generates a unique token representing data ownership
- Metadata includes file information, creator details, and Irys transaction IDs
- Base fee of 0.005 IRYS testnet tokens charged for every token created
- Token ID is the token name, contract address is actual Irys blockchain address

### Trading System (Uniswap-like AMM)
- Automated Market Maker using x*y=k constant product formula
- Real-time price charts with dynamic token price data
- Searchable token marketplace with filtering capabilities
- Only last 100 tokens shown in selection dropdown, others searchable
- Users can search and exchange any tokens with their own tokens
- Liquidity pools with 0.3% trading fee (like Uniswap)
- Slippage protection and transaction fee estimation
- Smart contract deployed on Irys VM for decentralized trading
- Pool reserves automatically updated after each trade

### Wallet Management
- Web3 wallet connection with account management
- Transaction signing for blockchain interactions
- Balance tracking for native and data tokens
- Wallet dropdown shows user's created tokens
- Network switching and chain validation
- All smart contract transactions on Irys VM and Irys devnet

### User Interface
- Glass morphism design with gradient backgrounds
- Responsive layout supporting mobile and desktop
- Real-time updates using React Query
- Toast notifications for user feedback
- Loading states and error handling
- Transaction history page with Irys blockchain integration
- Liquidity pool management interface
- Real-time AMM pool statistics and analytics

## Data Flow

1. **Upload Process**: User selects file + optional image → File validation → Irys upload with metadata → Token creation → In-memory storage
2. **Trading Process**: User initiates swap → AMM calculates exchange rate using x*y=k → Smart contract execution on Irys VM → Pool reserves updated → Trade recording
3. **Liquidity Management**: User adds/removes liquidity → Pool reserves adjusted → Liquidity tokens minted/burned → Fee collection
4. **Price Discovery**: Market activity updates → Real-time AMM price calculation → Dynamic chart data → UI refresh
5. **Transaction Tracking**: All transactions recorded on Irys blockchain → Real-time transaction history → Block explorer integration
6. **Search & Discovery**: Real-time token search → Filterable marketplace → Price tracking → Trading analytics

## External Dependencies

### Blockchain Services
- **Irys Network**: Permanent data storage with guaranteed availability
- **Ethereum/Polygon**: Smart contract deployment and execution
- **Infura**: RPC provider for blockchain connectivity

### Development Tools
- **Hardhat**: Smart contract development, testing, and deployment
- **Drizzle Kit**: Database schema management and migrations
- **Vite**: Fast development server and optimized production builds

### UI/UX Libraries
- **Radix UI**: Accessible, unstyled component primitives
- **Lucide React**: Consistent icon system
- **Framer Motion**: Animation library for smooth interactions

## Deployment Strategy

### Development Environment
- Local development with Hardhat network for smart contracts
- Vite dev server for frontend hot reloading
- PostgreSQL database (can be local or Neon)
- Environment variables for API keys and private keys

### Production Deployment
- Frontend: Static build deployed to CDN/hosting service
- Backend: Express server deployed to cloud platform
- Database: Neon Database for serverless PostgreSQL
- Smart Contracts: Deployed to target blockchain networks
- Domain: Custom domain with SSL certificate

### Environment Configuration
- Development: Local blockchain, test tokens, mock data
- Staging: Testnet deployment for integration testing
- Production: Mainnet deployment with real value transactions

The application follows a modular architecture with clear separation between frontend, backend, and blockchain components. The use of TypeScript throughout ensures type safety, while the combination of modern React patterns and established blockchain tools provides a robust foundation for decentralized data trading.

## Recent Changes
- **January 19, 2025**: Implemented automatic swap calculations using real-time exchange rates
- **January 19, 2025**: Removed duplicate wallet logos, keeping only top-right corner display
- **January 19, 2025**: Fixed token ID registration to avoid duplication in upload process
- **January 19, 2025**: Set total supply to 1 billion tokens with market cap calculations
- **January 19, 2025**: Enhanced token displays with market cap information across all pages