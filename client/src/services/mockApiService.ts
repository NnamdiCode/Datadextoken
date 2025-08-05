// Mock API service for frontend-only deployment
// This provides sample data when the backend is not available

interface DataToken {
  id: number;
  tokenAddress: string;
  name: string;
  symbol: string;
  description: string;
  category: string;
  creatorAddress: string;
  fileSize: number;
  currentPrice: number;
  volume24h: number;
  priceChange24h: number;
  totalSupply: string;
  imageUrl?: string;
  createdAt: string;
}

interface Trade {
  id: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amountIn: string;
  amountOut: string;
  traderAddress: string;
  transactionHash: string;
  pricePerToken: number;
  executedAt: string;
}

class MockApiService {
  private mockTokens: DataToken[] = [
    {
      id: 1,
      tokenAddress: "0x1234567890123456789012345678901234567890",
      name: "Weather Data Pack",
      symbol: "WTHR",
      description: "Global weather data for ML training",
      category: "research",
      creatorAddress: "0xabc123def456789012345678901234567890abcd",
      fileSize: 1024000,
      currentPrice: 0.008,
      volume24h: 1500,
      priceChange24h: 5.2,
      totalSupply: "1000000000",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      tokenAddress: "0x2345678901234567890123456789012345678901",
      name: "Financial Dataset",
      symbol: "FINX",
      description: "Stock market data for analysis",
      category: "finance",
      creatorAddress: "0xdef456abc789012345678901234567890defab",
      fileSize: 2048000,
      currentPrice: 0.012,
      volume24h: 2300,
      priceChange24h: -2.1,
      totalSupply: "1000000000",
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      tokenAddress: "0x3456789012345678901234567890123456789012",
      name: "Medical Research Data",
      symbol: "MEDR",
      description: "Anonymized medical research dataset",
      category: "healthcare",
      creatorAddress: "0x123456789abcdef0123456789abcdef012345678",
      fileSize: 5120000,
      currentPrice: 0.025,
      volume24h: 890,
      priceChange24h: 8.7,
      totalSupply: "1000000000",
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      tokenAddress: "0x4567890123456789012345678901234567890123",
      name: "AI Training Dataset",
      symbol: "AITD",
      description: "Machine learning training data for computer vision",
      category: "technology",
      creatorAddress: "0x456789abcdef0123456789abcdef01234567890",
      fileSize: 8192000,
      currentPrice: 0.045,
      volume24h: 1200,
      priceChange24h: 12.5,
      totalSupply: "1000000000",
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      tokenAddress: "0x5678901234567890123456789012345678901234",
      name: "Climate Data Archive",
      symbol: "CLIM",
      description: "Historical climate and environmental measurements",
      category: "research",
      creatorAddress: "0x789abcdef0123456789abcdef012345678901",
      fileSize: 3072000,
      currentPrice: 0.018,
      volume24h: 780,
      priceChange24h: -1.8,
      totalSupply: "1000000000",
      createdAt: new Date().toISOString()
    }
  ];

  private mockTrades: Trade[] = [];

  async getTokens(): Promise<{ tokens: DataToken[] }> {
    return { tokens: this.mockTokens };
  }

  async getTrades(): Promise<{ trades: Trade[] }> {
    return { trades: this.mockTrades };
  }

  async getTradeQuote(fromToken: string, toToken: string, amountIn: string): Promise<any> {
    const baseRate = 1.0 + (Math.random() - 0.5) * 0.2; // ±10% rate variation
    const amountOut = (parseFloat(amountIn) * baseRate).toFixed(6);
    
    return {
      quote: {
        fromToken,
        toToken,
        amountIn,
        amountOut,
        exchangeRate: baseRate.toFixed(6),
        priceImpact: (Math.random() * 2).toFixed(3),
        fee: (parseFloat(amountIn) * 0.003).toFixed(6),
        minAmountOut: (parseFloat(amountOut) * 0.995).toFixed(6),
        poolReserveA: (Math.random() * 1000000 + 100000).toFixed(0),
        poolReserveB: (Math.random() * 1000000 + 100000).toFixed(0),
        poolAddress: `${fromToken}-${toToken}`
      }
    };
  }

  async executeTrade(tradeData: any): Promise<any> {
    const mockTrade: Trade = {
      id: this.mockTrades.length + 1,
      fromTokenAddress: tradeData.fromToken,
      toTokenAddress: tradeData.toToken,
      amountIn: tradeData.amountIn,
      amountOut: tradeData.amountOut,
      traderAddress: tradeData.traderAddress,
      transactionHash: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      pricePerToken: parseFloat(tradeData.amountOut) / parseFloat(tradeData.amountIn),
      executedAt: new Date().toISOString()
    };

    this.mockTrades.unshift(mockTrade);

    return {
      success: true,
      trade: mockTrade,
      transactionHash: mockTrade.transactionHash,
      explorerUrl: `https://explorer.irys.xyz/tx/${mockTrade.transactionHash}`,
      message: "Trade executed successfully (Demo Mode)"
    };
  }

  async uploadData(formData: FormData): Promise<any> {
    const name = formData.get('name') as string;
    const symbol = formData.get('symbol') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const creatorAddress = formData.get('creatorAddress') as string;

    const mockToken: DataToken = {
      id: this.mockTokens.length + 1,
      tokenAddress: `0xmock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name,
      symbol,
      description,
      category,
      creatorAddress,
      fileSize: Math.floor(Math.random() * 5000000) + 100000,
      currentPrice: 0.005 + Math.random() * 0.02,
      volume24h: 0,
      priceChange24h: 0,
      totalSupply: "1000000000",
      createdAt: new Date().toISOString()
    };

    this.mockTokens.unshift(mockToken);

    return {
      success: true,
      token: mockToken,
      message: "Data uploaded successfully (Demo Mode)"
    };
  }

  async getIrysBalance(): Promise<{ balance: string }> {
    return { balance: (Math.random() * 10 + 1).toFixed(4) };
  }

  async getTokensByCreator(address: string): Promise<{ tokens: DataToken[] }> {
    const userTokens = this.mockTokens.filter(token => 
      token.creatorAddress.toLowerCase() === address.toLowerCase()
    );
    return { tokens: userTokens };
  }
}

export const mockApiService = new MockApiService();