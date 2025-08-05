import { z } from "zod";
import { sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Data Token interface for blockchain integration
export interface DataToken {
  id: number;
  tokenAddress: string;
  irysTransactionId: string;
  name: string;
  symbol: string;
  description?: string;
  category: string;
  creatorAddress: string;
  fileSize: number;
  fileType: string;
  fileName: string;
  imageUrl?: string;
  totalSupply: string; // 1,000,000,000 (1 billion)
  currentPrice: number;
  volume24h: number;
  priceChange24h: number;
  createdAt: Date;
}

export interface Trade {
  id: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amountIn: string;
  amountOut: string;
  traderAddress: string;
  transactionHash: string;
  pricePerToken: number;
  feeAmount: string;
  executedAt: Date;
}

export interface LiquidityPool {
  id: number;
  tokenAAddress: string;
  tokenBAddress: string;
  reserveA: string;
  reserveB: string;
  totalLiquidity: string;
  createdAt: Date;
}

export interface User {
  id: number;
  walletAddress: string;
  username?: string;
  totalUploads: number;
  totalTrades: number;
  totalVolume: number;
  joinedAt: Date;
}

// Insert schemas using Zod
export const insertDataTokenSchema = z.object({
  tokenAddress: z.string(),
  irysTransactionId: z.string(),
  name: z.string(),
  symbol: z.string(),
  description: z.string().optional(),
  category: z.string(),
  creatorAddress: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  fileName: z.string(),
  imageUrl: z.string().optional(),
  totalSupply: z.string().default("1000000"),
  currentPrice: z.number().default(0),
  volume24h: z.number().default(0),
  priceChange24h: z.number().default(0),
});

export const insertTradeSchema = z.object({
  fromTokenAddress: z.string(),
  toTokenAddress: z.string(),
  amountIn: z.string(),
  amountOut: z.string(),
  traderAddress: z.string(),
  transactionHash: z.string(),
  pricePerToken: z.number(),
  feeAmount: z.string(),
});

export const insertLiquidityPoolSchema = z.object({
  tokenAAddress: z.string(),
  tokenBAddress: z.string(),
  reserveA: z.string().default("0"),
  reserveB: z.string().default("0"),
  totalLiquidity: z.string().default("0"),
});

export const insertUserSchema = z.object({
  walletAddress: z.string(),
  username: z.string().optional(),
  totalUploads: z.number().default(0),
  totalTrades: z.number().default(0),
  totalVolume: z.number().default(0),
});

// API request schemas
export const uploadRequestSchema = z.object({
  tokenId: z.string().min(1, "Token ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  file: z.any(), // File upload
  image: z.any().optional(), // Optional token image
  initialPrice: z.number().min(0, "Price must be positive").default(0.001),
});

export const tradeRequestSchema = z.object({
  fromToken: z.string(),
  toToken: z.string(),
  amountIn: z.string(),
  minAmountOut: z.string(),
  slippageTolerance: z.number().min(0).max(100).default(1),
});

export const searchRequestSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Type exports
export type InsertDataToken = z.infer<typeof insertDataTokenSchema>;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type InsertLiquidityPool = z.infer<typeof insertLiquidityPoolSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UploadRequest = z.infer<typeof uploadRequestSchema>;
export type TradeRequest = z.infer<typeof tradeRequestSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;

// Blockchain contract interfaces
export interface ContractAddresses {
  dataRegistry: string;
  dataAMM: string;
  network: string;
  explorerUrl: string;
}

export interface TokenContractInfo {
  tokenAddress: string;
  name: string;
  symbol: string;
  dataHash: string;
  irysTransactionId: string;
  imageUrl: string;
  description: string;
  creator: string;
  createdAt: number;
  price: number;
}

export interface IrysUploadResponse {
  id: string;
  timestamp: number;
  version: string;
  public: string;
  signature: string;
  deadlineHeight: number;
  block: number;
  receipt?: {
    deadlineHeight: number;
    block: number;
    validatorSignatures: string[];
  };
}

export interface WalletInfo {
  address: string;
  irysBalance: string;
  dataTokens: TokenContractInfo[];
  isConnected: boolean;
}

// Irys Transaction interface
export interface IrysTransaction {
  id: number;
  hash: string;
  fromAddress: string;
  toAddress: string;
  value: string;
  gasUsed: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
  type: 'token_creation' | 'swap' | 'liquidity_add' | 'liquidity_remove' | 'transfer';
  data?: any; // Additional transaction data
  blockNumber?: number;
  blockHash?: string;
}

export const insertIrysTransactionSchema = z.object({
  hash: z.string(),
  fromAddress: z.string(),
  toAddress: z.string(),
  value: z.string(),
  gasUsed: z.string(),
  status: z.enum(['success', 'failed', 'pending']),
  timestamp: z.date(),
  type: z.enum(['token_creation', 'swap', 'liquidity_add', 'liquidity_remove', 'transfer']),
  data: z.any().optional(),
  blockNumber: z.number().optional(),
  blockHash: z.string().optional(),
});

export type InsertIrysTransaction = z.infer<typeof insertIrysTransactionSchema>;

// Drizzle Database Tables
// Enums
export const transactionStatusEnum = pgEnum('transaction_status', ['success', 'failed', 'pending']);
export const transactionTypeEnum = pgEnum('transaction_type', ['token_creation', 'swap', 'liquidity_add', 'liquidity_remove', 'transfer']);

// Data Tokens Table
export const dataTokens = pgTable("data_tokens", {
  id: serial("id").primaryKey(),
  tokenAddress: varchar("token_address", { length: 42 }).notNull().unique(),
  irysTransactionId: varchar("irys_transaction_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  creatorAddress: varchar("creator_address", { length: 42 }).notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  totalSupply: varchar("total_supply", { length: 50 }).notNull().default("1000000000"),
  currentPrice: decimal("current_price", { precision: 18, scale: 8 }).notNull().default("0"),
  volume24h: decimal("volume_24h", { precision: 18, scale: 8 }).notNull().default("0"),
  priceChange24h: decimal("price_change_24h", { precision: 8, scale: 4 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trades Table
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  fromTokenAddress: varchar("from_token_address", { length: 42 }).notNull(),
  toTokenAddress: varchar("to_token_address", { length: 42 }).notNull(),
  amountIn: varchar("amount_in", { length: 50 }).notNull(),
  amountOut: varchar("amount_out", { length: 50 }).notNull(),
  traderAddress: varchar("trader_address", { length: 42 }).notNull(),
  transactionHash: varchar("transaction_hash", { length: 66 }).notNull().unique(),
  pricePerToken: decimal("price_per_token", { precision: 18, scale: 8 }).notNull(),
  feeAmount: varchar("fee_amount", { length: 50 }).notNull(),
  executedAt: timestamp("executed_at").defaultNow(),
});

// Liquidity Pools Table
export const liquidityPools = pgTable("liquidity_pools", {
  id: serial("id").primaryKey(),
  tokenAAddress: varchar("token_a_address", { length: 42 }).notNull(),
  tokenBAddress: varchar("token_b_address", { length: 42 }).notNull(),
  reserveA: varchar("reserve_a", { length: 50 }).notNull().default("0"),
  reserveB: varchar("reserve_b", { length: 50 }).notNull().default("0"),
  totalLiquidity: varchar("total_liquidity", { length: 50 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull().unique(),
  username: varchar("username", { length: 50 }),
  totalUploads: integer("total_uploads").notNull().default(0),
  totalTrades: integer("total_trades").notNull().default(0),
  totalVolume: decimal("total_volume", { precision: 18, scale: 8 }).notNull().default("0"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Irys Transactions Table
export const irysTransactions = pgTable("irys_transactions", {
  id: serial("id").primaryKey(),
  hash: varchar("hash", { length: 66 }).notNull().unique(),
  fromAddress: varchar("from_address", { length: 42 }).notNull(),
  toAddress: varchar("to_address", { length: 42 }).notNull(),
  value: varchar("value", { length: 50 }).notNull(),
  gasUsed: varchar("gas_used", { length: 50 }).notNull(),
  status: transactionStatusEnum("status").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  type: transactionTypeEnum("type").notNull(),
  data: jsonb("data"),
  blockNumber: integer("block_number"),
  blockHash: varchar("block_hash", { length: 66 }),
});

// Update insert schemas to use Drizzle types
export const drizzleInsertDataTokenSchema = createInsertSchema(dataTokens).omit({
  id: true,
  createdAt: true,
});

export const drizzleInsertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  executedAt: true,
});

export const drizzleInsertLiquidityPoolSchema = createInsertSchema(liquidityPools).omit({
  id: true,
  createdAt: true,
});

export const drizzleInsertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinedAt: true,
});

export const drizzleInsertIrysTransactionSchema = createInsertSchema(irysTransactions).omit({
  id: true,
});

// Drizzle Type exports
export type DrizzleDataToken = typeof dataTokens.$inferSelect;
export type DrizzleInsertDataToken = typeof dataTokens.$inferInsert;
export type DrizzleTrade = typeof trades.$inferSelect;
export type DrizzleInsertTrade = typeof trades.$inferInsert;
export type DrizzleLiquidityPool = typeof liquidityPools.$inferSelect;
export type DrizzleInsertLiquidityPool = typeof liquidityPools.$inferInsert;
export type DrizzleUser = typeof users.$inferSelect;
export type DrizzleInsertUser = typeof users.$inferInsert;
export type DrizzleIrysTransaction = typeof irysTransactions.$inferSelect;
export type DrizzleInsertIrysTransaction = typeof irysTransactions.$inferInsert;