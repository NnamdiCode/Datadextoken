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

// Create insert schemas
export const insertDataTokenSchema = createInsertSchema(dataTokens).omit({
  id: true,
  createdAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  executedAt: true,
});

export const insertLiquidityPoolSchema = createInsertSchema(liquidityPools).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinedAt: true,
});

export const insertIrysTransactionSchema = createInsertSchema(irysTransactions).omit({
  id: true,
});

// Type exports
export type DataToken = typeof dataTokens.$inferSelect;
export type InsertDataToken = typeof dataTokens.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;
export type LiquidityPool = typeof liquidityPools.$inferSelect;
export type InsertLiquidityPool = typeof liquidityPools.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type IrysTransaction = typeof irysTransactions.$inferSelect;
export type InsertIrysTransaction = typeof irysTransactions.$inferInsert;