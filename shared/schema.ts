import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dataTokens = pgTable("data_tokens", {
  id: serial("id").primaryKey(),
  tokenAddress: text("token_address").notNull(),
  irysTransactionId: text("irys_transaction_id").notNull().unique(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull().default("DATA"),
  description: text("description"),
  creatorAddress: text("creator_address").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  fileName: text("file_name").notNull(),
  totalSupply: text("total_supply").notNull().default("1000000"),
  currentPrice: real("current_price").default(0.0),
  volume24h: real("volume_24h").default(0.0),
  priceChange24h: real("price_change_24h").default(0.0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  fromTokenAddress: text("from_token_address").notNull(),
  toTokenAddress: text("to_token_address").notNull(),
  amountIn: text("amount_in").notNull(),
  amountOut: text("amount_out").notNull(),
  traderAddress: text("trader_address").notNull(),
  transactionHash: text("transaction_hash").notNull().unique(),
  pricePerToken: real("price_per_token").notNull(),
  feeAmount: text("fee_amount").notNull(),
  executedAt: timestamp("executed_at").defaultNow(),
});

export const liquidityPools = pgTable("liquidity_pools", {
  id: serial("id").primaryKey(),
  tokenAAddress: text("token_a_address").notNull(),
  tokenBAddress: text("token_b_address").notNull(),
  reserveA: text("reserve_a").notNull().default("0"),
  reserveB: text("reserve_b").notNull().default("0"),
  totalLiquidity: text("total_liquidity").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username"),
  totalUploads: integer("total_uploads").default(0),
  totalTrades: integer("total_trades").default(0),
  totalVolume: real("total_volume").default(0.0),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Insert schemas
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

// Upload request schema
export const uploadRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  fileType: z.string().min(1, "File type is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().min(1, "File size must be positive").max(50 * 1024 * 1024, "File too large (max 50MB)"),
  uploadFee: z.string().optional(),
  paymentTxHash: z.string().optional(),
  creatorAddress: z.string().min(1, "Creator address is required"),
});

// Trade request schema
export const tradeRequestSchema = z.object({
  fromTokenAddress: z.string().min(1, "From token address required"),
  toTokenAddress: z.string().min(1, "To token address required"),
  amountIn: z.string().min(1, "Amount required"),
  minAmountOut: z.string().min(1, "Minimum amount out required"),
  slippageTolerance: z.number().min(0).max(50).default(0.5),
});

// Type exports
export type InsertDataToken = z.infer<typeof insertDataTokenSchema>;
export type DataToken = typeof dataTokens.$inferSelect;

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

export type InsertLiquidityPool = z.infer<typeof insertLiquidityPoolSchema>;
export type LiquidityPool = typeof liquidityPools.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type UploadRequest = z.infer<typeof uploadRequestSchema>;
export type TradeRequest = z.infer<typeof tradeRequestSchema>;
