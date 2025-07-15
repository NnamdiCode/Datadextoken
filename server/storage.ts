import { type DataToken, type InsertDataToken, type Trade, type InsertTrade, type LiquidityPool, type InsertLiquidityPool, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  // Data Tokens
  getDataToken(id: number): Promise<DataToken | undefined>;
  getDataTokenByAddress(address: string): Promise<DataToken | undefined>;
  getDataTokenByIrysId(irysId: string): Promise<DataToken | undefined>;
  getAllDataTokens(limit?: number, offset?: number): Promise<DataToken[]>;
  searchDataTokens(query: string): Promise<DataToken[]>;
  getTokensByCreator(creatorAddress: string): Promise<DataToken[]>;
  createDataToken(token: InsertDataToken): Promise<DataToken>;
  updateDataTokenPrice(address: string, price: number, volume24h?: number, priceChange24h?: number): Promise<void>;

  // Trades
  getTrade(id: number): Promise<Trade | undefined>;
  getTradesByUser(userAddress: string, limit?: number): Promise<Trade[]>;
  getTradesByToken(tokenAddress: string, limit?: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  getRecentTrades(limit?: number): Promise<Trade[]>;

  // Liquidity Pools
  getLiquidityPool(tokenA: string, tokenB: string): Promise<LiquidityPool | undefined>;
  getAllLiquidityPools(): Promise<LiquidityPool[]>;
  createLiquidityPool(pool: InsertLiquidityPool): Promise<LiquidityPool>;
  updateLiquidityPool(tokenA: string, tokenB: string, reserveA: string, reserveB: string): Promise<void>;

  // Users
  getUser(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(walletAddress: string, totalUploads?: number, totalTrades?: number, totalVolume?: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private dataTokens: Map<number, DataToken>;
  private trades: Map<number, Trade>;
  private liquidityPools: Map<string, LiquidityPool>;
  private users: Map<string, User>;
  private currentId: number;

  constructor() {
    this.dataTokens = new Map();
    this.trades = new Map();
    this.liquidityPools = new Map();
    this.users = new Map();
    this.currentId = 1;
  }

  // Data Tokens
  async getDataToken(id: number): Promise<DataToken | undefined> {
    return this.dataTokens.get(id);
  }

  async getDataTokenByAddress(address: string): Promise<DataToken | undefined> {
    return Array.from(this.dataTokens.values()).find(token => token.tokenAddress === address);
  }

  async getDataTokenByIrysId(irysId: string): Promise<DataToken | undefined> {
    return Array.from(this.dataTokens.values()).find(token => token.irysTransactionId === irysId);
  }

  async getAllDataTokens(limit = 100, offset = 0): Promise<DataToken[]> {
    const tokens = Array.from(this.dataTokens.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
    return tokens;
  }

  async searchDataTokens(query: string): Promise<DataToken[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.dataTokens.values()).filter(token =>
      token.name.toLowerCase().includes(lowerQuery) ||
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.description?.toLowerCase().includes(lowerQuery) ||
      token.fileName.toLowerCase().includes(lowerQuery)
    );
  }

  async getTokensByCreator(creatorAddress: string): Promise<DataToken[]> {
    return Array.from(this.dataTokens.values()).filter(token => 
      token.creatorAddress.toLowerCase() === creatorAddress.toLowerCase()
    );
  }

  async createDataToken(insertToken: InsertDataToken): Promise<DataToken> {
    const token: DataToken = {
      id: this.currentId++,
      ...insertToken,
      createdAt: new Date(),
    };
    this.dataTokens.set(token.id, token);
    return token;
  }

  async updateDataTokenPrice(address: string, price: number, volume24h = 0, priceChange24h = 0): Promise<void> {
    const token = await this.getDataTokenByAddress(address);
    if (token) {
      token.currentPrice = price;
      token.volume24h = volume24h;
      token.priceChange24h = priceChange24h;
      this.dataTokens.set(token.id, token);
    }
  }

  // Trades
  async getTrade(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async getTradesByUser(userAddress: string, limit = 50): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.traderAddress === userAddress)
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, limit);
  }

  async getTradesByToken(tokenAddress: string, limit = 50): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.fromTokenAddress === tokenAddress || trade.toTokenAddress === tokenAddress)
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, limit);
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const trade: Trade = {
      id: this.currentId++,
      ...insertTrade,
      executedAt: new Date(),
    };
    this.trades.set(trade.id, trade);
    
    // Update dynamic pricing based on supply and demand
    await this.updateDynamicPricing(insertTrade.fromTokenAddress, insertTrade.toTokenAddress, insertTrade.amountIn, insertTrade.amountOut);
    
    return trade;
  }

  // Dynamic pricing algorithm
  async updateDynamicPricing(fromTokenAddress: string, toTokenAddress: string, amountIn: string, amountOut: string): Promise<void> {
    const fromToken = await this.getDataTokenByAddress(fromTokenAddress);
    const toToken = await this.getDataTokenByAddress(toTokenAddress);
    
    if (!fromToken || !toToken) return;
    
    // Calculate demand multiplier based on recent trading activity
    const recentTrades = await this.getRecentTrades(20);
    const fromTokenTrades = recentTrades.filter(t => t.toTokenAddress === fromTokenAddress).length;
    const toTokenTrades = recentTrades.filter(t => t.toTokenAddress === toTokenAddress).length;
    
    // Base price increase/decrease based on demand
    const fromDemandMultiplier = Math.max(0.5, 1 + (fromTokenTrades * 0.1));
    const toDemandMultiplier = Math.max(0.5, 1 + (toTokenTrades * 0.1));
    
    // Calculate volume for 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentFromTrades = recentTrades.filter(t => 
      (t.fromTokenAddress === fromTokenAddress || t.toTokenAddress === fromTokenAddress) &&
      new Date(t.executedAt) > oneDayAgo
    );
    
    const fromVolume24h = recentFromTrades.reduce((sum, trade) => {
      const amount = trade.fromTokenAddress === fromTokenAddress ? parseFloat(trade.amountIn) : parseFloat(trade.amountOut);
      return sum + amount * trade.pricePerToken;
    }, 0);
    
    // Calculate price change
    const oldFromPrice = fromToken.currentPrice;
    const newFromPrice = Math.max(0.001, oldFromPrice * fromDemandMultiplier);
    const fromPriceChange = ((newFromPrice - oldFromPrice) / oldFromPrice) * 100;
    
    const oldToPrice = toToken.currentPrice;
    const newToPrice = Math.max(0.001, oldToPrice * toDemandMultiplier);
    const toPriceChange = ((newToPrice - oldToPrice) / oldToPrice) * 100;
    
    // Update token prices
    await this.updateDataTokenPrice(fromTokenAddress, newFromPrice, fromVolume24h, fromPriceChange);
    await this.updateDataTokenPrice(toTokenAddress, newToPrice, fromVolume24h, toPriceChange);
  }

  async getRecentTrades(limit = 20): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, limit);
  }

  // Liquidity Pools
  async getLiquidityPool(tokenA: string, tokenB: string): Promise<LiquidityPool | undefined> {
    const key = this.getPoolKey(tokenA, tokenB);
    return this.liquidityPools.get(key);
  }

  async getAllLiquidityPools(): Promise<LiquidityPool[]> {
    return Array.from(this.liquidityPools.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createLiquidityPool(insertPool: InsertLiquidityPool): Promise<LiquidityPool> {
    const pool: LiquidityPool = {
      id: this.currentId++,
      ...insertPool,
      createdAt: new Date(),
    };
    const key = this.getPoolKey(pool.tokenAAddress, pool.tokenBAddress);
    this.liquidityPools.set(key, pool);
    return pool;
  }

  async updateLiquidityPool(tokenA: string, tokenB: string, reserveA: string, reserveB: string): Promise<void> {
    const key = this.getPoolKey(tokenA, tokenB);
    const pool = this.liquidityPools.get(key);
    if (pool) {
      pool.reserveA = reserveA;
      pool.reserveB = reserveB;
      this.liquidityPools.set(key, pool);
    }
  }

  private getPoolKey(tokenA: string, tokenB: string): string {
    return [tokenA, tokenB].sort().join('-');
  }

  // Users
  async getUser(walletAddress: string): Promise<User | undefined> {
    return this.users.get(walletAddress);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentId++,
      ...insertUser,
      joinedAt: new Date(),
    };
    this.users.set(user.walletAddress, user);
    return user;
  }

  async updateUserStats(walletAddress: string, totalUploads?: number, totalTrades?: number, totalVolume?: number): Promise<void> {
    const user = this.users.get(walletAddress);
    if (user) {
      if (totalUploads !== undefined) user.totalUploads = totalUploads;
      if (totalTrades !== undefined) user.totalTrades = totalTrades;
      if (totalVolume !== undefined) user.totalVolume = totalVolume;
      this.users.set(walletAddress, user);
    }
  }
}

// Use only in-memory storage for blockchain integration
export const storage = new MemStorage();