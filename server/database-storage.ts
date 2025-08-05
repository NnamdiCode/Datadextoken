import { db, dataTokens, trades, liquidityPools, users, irysTransactions } from "./db";
import { eq, desc, like, or, and } from "drizzle-orm";
import type { 
  DrizzleDataToken as DataToken, 
  DrizzleInsertDataToken as InsertDataToken, 
  DrizzleTrade as Trade, 
  DrizzleInsertTrade as InsertTrade, 
  DrizzleLiquidityPool as LiquidityPool, 
  DrizzleInsertLiquidityPool as InsertLiquidityPool, 
  DrizzleUser as User, 
  DrizzleInsertUser as InsertUser,
  DrizzleIrysTransaction as IrysTransaction,
  DrizzleInsertIrysTransaction as InsertIrysTransaction 
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Data Tokens
  async getDataToken(id: number): Promise<DataToken | undefined> {
    const [token] = await db.select().from(dataTokens).where(eq(dataTokens.id, id));
    return token;
  }

  async getDataTokenByAddress(address: string): Promise<DataToken | undefined> {
    const [token] = await db.select().from(dataTokens).where(eq(dataTokens.tokenAddress, address));
    return token;
  }

  async getDataTokenByIrysId(irysId: string): Promise<DataToken | undefined> {
    const [token] = await db.select().from(dataTokens).where(eq(dataTokens.irysTransactionId, irysId));
    return token;
  }

  async getAllDataTokens(limit = 100, offset = 0): Promise<DataToken[]> {
    return await db.select().from(dataTokens)
      .orderBy(desc(dataTokens.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async searchDataTokens(query: string): Promise<DataToken[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(dataTokens)
      .where(
        or(
          like(dataTokens.name, searchTerm),
          like(dataTokens.symbol, searchTerm),
          like(dataTokens.description, searchTerm),
          like(dataTokens.category, searchTerm)
        )
      )
      .orderBy(desc(dataTokens.createdAt));
  }

  async getTokensByCreator(creatorAddress: string): Promise<DataToken[]> {
    return await db.select().from(dataTokens)
      .where(eq(dataTokens.creatorAddress, creatorAddress))
      .orderBy(desc(dataTokens.createdAt));
  }

  async createDataToken(token: InsertDataToken): Promise<DataToken> {
    const [newToken] = await db.insert(dataTokens).values(token).returning();
    return newToken;
  }

  async updateDataTokenPrice(address: string, price: number, volume24h?: number, priceChange24h?: number): Promise<void> {
    const updateData: any = { currentPrice: price.toString() };
    if (volume24h !== undefined) updateData.volume24h = volume24h.toString();
    if (priceChange24h !== undefined) updateData.priceChange24h = priceChange24h.toString();

    await db.update(dataTokens)
      .set(updateData)
      .where(eq(dataTokens.tokenAddress, address));
  }

  // Trades
  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  async getTradesByUser(userAddress: string, limit = 50): Promise<Trade[]> {
    return await db.select().from(trades)
      .where(eq(trades.traderAddress, userAddress))
      .orderBy(desc(trades.executedAt))
      .limit(limit);
  }

  async getTradesByToken(tokenAddress: string, limit = 50): Promise<Trade[]> {
    return await db.select().from(trades)
      .where(
        or(
          eq(trades.fromTokenAddress, tokenAddress),
          eq(trades.toTokenAddress, tokenAddress)
        )
      )
      .orderBy(desc(trades.executedAt))
      .limit(limit);
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async getRecentTrades(limit = 20): Promise<Trade[]> {
    return await db.select().from(trades)
      .orderBy(desc(trades.executedAt))
      .limit(limit);
  }

  // Liquidity Pools
  async getLiquidityPool(tokenA: string, tokenB: string): Promise<LiquidityPool | undefined> {
    const [pool] = await db.select().from(liquidityPools)
      .where(
        or(
          and(eq(liquidityPools.tokenAAddress, tokenA), eq(liquidityPools.tokenBAddress, tokenB)),
          and(eq(liquidityPools.tokenAAddress, tokenB), eq(liquidityPools.tokenBAddress, tokenA))
        )
      );
    return pool;
  }

  async getAllLiquidityPools(): Promise<LiquidityPool[]> {
    return await db.select().from(liquidityPools)
      .orderBy(desc(liquidityPools.createdAt));
  }

  async createLiquidityPool(pool: InsertLiquidityPool): Promise<LiquidityPool> {
    const [newPool] = await db.insert(liquidityPools).values(pool).returning();
    return newPool;
  }

  async updateLiquidityPool(tokenA: string, tokenB: string, reserveA: string, reserveB: string): Promise<void> {
    await db.update(liquidityPools)
      .set({ reserveA, reserveB })
      .where(
        or(
          and(eq(liquidityPools.tokenAAddress, tokenA), eq(liquidityPools.tokenBAddress, tokenB)),
          and(eq(liquidityPools.tokenAAddress, tokenB), eq(liquidityPools.tokenBAddress, tokenA))
        )
      );
  }

  // Users
  async getUser(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserStats(walletAddress: string, totalUploads?: number, totalTrades?: number, totalVolume?: number): Promise<void> {
    const updateData: any = {};
    if (totalUploads !== undefined) updateData.totalUploads = totalUploads;
    if (totalTrades !== undefined) updateData.totalTrades = totalTrades;
    if (totalVolume !== undefined) updateData.totalVolume = totalVolume.toString();

    await db.update(users)
      .set(updateData)
      .where(eq(users.walletAddress, walletAddress));
  }

  // Irys Transactions
  async getIrysTransaction(hash: string): Promise<IrysTransaction | undefined> {
    const [transaction] = await db.select().from(irysTransactions).where(eq(irysTransactions.hash, hash));
    return transaction;
  }

  async getIrysTransactionsByUser(userAddress: string, limit = 50): Promise<IrysTransaction[]> {
    return await db.select().from(irysTransactions)
      .where(
        or(
          eq(irysTransactions.fromAddress, userAddress),
          eq(irysTransactions.toAddress, userAddress)
        )
      )
      .orderBy(desc(irysTransactions.timestamp))
      .limit(limit);
  }

  async createIrysTransaction(transaction: InsertIrysTransaction): Promise<IrysTransaction> {
    const [newTransaction] = await db.insert(irysTransactions).values(transaction).returning();
    return newTransaction;
  }

  async updateIrysTransactionStatus(hash: string, status: 'success' | 'failed' | 'pending', blockNumber?: number, blockHash?: string): Promise<void> {
    const updateData: any = { status };
    if (blockNumber !== undefined) updateData.blockNumber = blockNumber;
    if (blockHash !== undefined) updateData.blockHash = blockHash;

    await db.update(irysTransactions)
      .set(updateData)
      .where(eq(irysTransactions.hash, hash));
  }

  async getRecentIrysTransactions(limit = 20): Promise<IrysTransaction[]> {
    return await db.select().from(irysTransactions)
      .orderBy(desc(irysTransactions.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();