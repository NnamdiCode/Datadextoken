# DataSwap - Decentralized Data Exchange

🚀 **A revolutionary platform for tokenizing and trading data on the Irys blockchain**

![DataSwap Banner](https://via.placeholder.com/800x200/0B1426/40E0D0?text=DataSwap+-+Decentralized+Data+Exchange)

## 🌟 Features

### 🔐 **Blockchain Integration**
- **Irys Network**: Permanent data storage with guaranteed availability
- **Smart Contracts**: Deployed on Irys VM (Chain ID: 1270) with Solidity 0.8.19
- **Web3 Wallet**: MetaMask and multi-wallet support

### 💎 **Data Tokenization**
- Upload any file type and receive ERC-20 tokens representing ownership
- 1 billion token supply for each data asset
- Dynamic pricing based on file size, category, and market demand
- Immutable storage on Irys blockchain with permanent links

### 📊 **Professional Trading**
- **Uniswap-style AMM**: Automated market maker with x*y=k formula
- **TradingView Charts**: Professional 600px trading interface
- **Real-time Data**: Live price feeds and volume analysis
- **Liquidity Pools**: Add/remove liquidity with 0.3% trading fees

### 🎨 **Modern UI/UX**
- Glass morphism design with gradient backgrounds
- Responsive layout for desktop and mobile
- Real-time updates and smooth animations
- Irys turquoise and white color scheme

## 🛠️ Technology Stack

### Frontend
- **React + TypeScript**: Modern component architecture
- **Vite**: Fast development and optimized builds
- **Tailwind CSS**: Utility-first styling with shadcn/ui components
- **Chart.js**: Professional trading visualizations
- **Framer Motion**: Smooth animations and transitions

### Backend
- **Node.js + Express**: RESTful API server
- **TypeScript**: Type-safe server development
- **In-memory Storage**: Fast and efficient data handling
- **Multer**: File upload processing

### Blockchain
- **Irys Network**: Permanent data storage layer
- **Ethers.js**: Web3 blockchain interactions
- **Hardhat**: Smart contract development and deployment
- **0.005 IRYS**: Base fee for token creation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- IRYS testnet tokens for transactions

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/dataswap.git
cd dataswap

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your configuration to .env

# Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL=your_database_url
VITE_IRYS_NETWORK=devnet
VITE_IRYS_RPC_URL=https://devnet.irys.xyz
VITE_CONTRACT_ADDRESS=your_contract_address
```

## 📋 Usage Guide

### 1. **Connect Wallet**
- Click "Connect Wallet" in the top-right corner
- Select MetaMask or your preferred wallet
- Switch to Irys Devnet (Chain ID: 1270)

### 2. **Upload & Tokenize Data**
- Navigate to Upload page
- Select your data file and optional token image
- Choose data category and set pricing
- Pay 0.005 IRYS base fee for token creation
- Receive 1 billion tokens representing your data

### 3. **Trade Data Tokens**
- Go to Trade page to access the AMM
- Select token pairs for swapping
- View TradingView-style charts with real data
- Execute trades with automatic price calculation

### 4. **Manage Liquidity**
- Visit Liquidity page to add/remove pool liquidity
- Earn 0.3% trading fees from token swaps
- Monitor pool statistics and your positions

## 🔗 Live Links

- **Frontend**: [https://dataswap.vercel.app](https://dataswap.vercel.app)
- **Irys Explorer**: [https://explorer.irys.xyz](https://explorer.irys.xyz)
- **Contract Address**: `0x...` (deployed on Irys VM)

## 📊 Smart Contracts

### DataRegistry
- Manages data token creation and metadata
- Stores file information and creator details
- Links to permanent Irys storage

### DataAMM
- Implements x*y=k constant product formula
- Handles token swapping with slippage protection
- Manages liquidity pools and fee collection

### DataMarketplace
- Orchestrates the overall trading ecosystem
- Coordinates between registry and AMM contracts
- Handles complex multi-token operations

## 🛡️ Security Features

- **Decentralized Storage**: Files stored permanently on Irys blockchain
- **Smart Contract Auditing**: Solidity 0.8.19 with security best practices
- **Wallet Integration**: Secure transaction signing with MetaMask
- **Slippage Protection**: Automatic trade validation and price impact warnings

## 🔧 Development

### Build for Production
```bash
npm run build
```

### Deploy Smart Contracts
```bash
npx hardhat run deploy/deploy.js --network irys-mainnet
```

### Run Tests
```bash
npm test
```

## 📈 Roadmap

- [ ] **Q1 2025**: Mainnet deployment with real IRYS transactions
- [ ] **Q2 2025**: Advanced analytics and portfolio tracking
- [ ] **Q3 2025**: Cross-chain bridge integration
- [ ] **Q4 2025**: DAO governance and community features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- **Documentation**: [docs.dataswap.io](https://docs.dataswap.io)
- **Discord**: [Join our community](https://discord.gg/dataswap)
- **Twitter**: [@DataSwapDEX](https://twitter.com/DataSwapDEX)
- **Email**: support@dataswap.io

---

**Built with ❤️ for the decentralized future of data ownership and trading**