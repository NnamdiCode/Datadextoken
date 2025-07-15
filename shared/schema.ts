import { z } from "zod";

// Data Token interface for blockchain integration
export interface DataToken {
  id: number;
  tokenAddress: string;
  irysTransactionId: string;
  name: string;
  symbol: string;
  description?: string;
  creatorAddress: string;
  fileSize: number;
  fileType: string;
  fileName: string;
  imageUrl?: string;
  totalSupply: string;
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
  symbol: z.string().default("DATA"),
  description: z.string().optional(),
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
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
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