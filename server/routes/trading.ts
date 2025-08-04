import { Request, Response } from 'express';
import { storage } from '../storage';

interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

interface TokenPairData {
  currentPrice: number;
  priceChange24h: number;
  percentChange24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  priceHistory: PricePoint[];
}

// Generate realistic trading data based on actual token prices and market activity
export async function getPairData(req: Request, res: Response) {
  try {
    const { fromToken, toToken, timeframe = '1D' } = req.query;

    if (!fromToken || !toToken || fromToken === toToken) {
      return res.status(400).json({ error: 'Valid token pair required' });
    }

    // Get token data
    const tokens = await storage.getAllTokens();
    const fromTokenData = tokens.find((t: any) => t.tokenAddress === fromToken);
    const toTokenData = tokens.find((t: any) => t.tokenAddress === toToken);

    if (!fromTokenData || !toTokenData) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Get recent trades for this pair to calculate real metrics
    const trades = await storage.getAllTrades();
    const pairTrades = trades.filter((t: any) => 
      (t.fromToken === fromToken && t.toToken === toToken) ||
      (t.fromToken === toToken && t.toToken === fromToken)
    );

    // Calculate current exchange rate
    const currentPrice = fromTokenData.currentPrice / toTokenData.currentPrice;

    // Generate time-based price history
    const priceHistory = generatePriceHistory(currentPrice, timeframe as string, pairTrades);

    // Calculate 24h statistics
    const now = Date.now();
    const yesterday = now - (24 * 60 * 60 * 1000);
    const recent24hPoints = priceHistory.filter(p => p.timestamp >= yesterday);
    
    const prices24h = recent24hPoints.map(p => p.price);
    const volumes24h = recent24hPoints.map(p => p.volume);
    
    const high24h = Math.max(...prices24h);
    const low24h = Math.min(...prices24h);
    const volume24h = volumes24h.reduce((a, b) => a + b, 0);
    
    // Calculate price change (current vs 24h ago)
    const price24hAgo = recent24hPoints.length > 0 ? recent24hPoints[0].price : currentPrice;
    const priceChange24h = currentPrice - price24hAgo;
    const percentChange24h = price24hAgo > 0 ? (priceChange24h / price24hAgo) * 100 : 0;

    const pairData: TokenPairData = {
      currentPrice,
      priceChange24h,
      percentChange24h,
      volume24h,
      high24h,
      low24h,
      priceHistory
    };

    res.json(pairData);
  } catch (error) {
    console.error('Error fetching pair data:', error);
    res.status(500).json({ error: 'Failed to fetch trading data' });
  }
}

function generatePriceHistory(basePrice: number, timeframe: string, trades: any[]): PricePoint[] {
  const now = Date.now();
  const points: PricePoint[] = [];
  
  let intervals: number;
  let intervalMs: number;
  
  switch (timeframe) {
    case '1H':
      intervals = 60;
      intervalMs = 60 * 1000; // 1 minute intervals
      break;
    case '1D':
      intervals = 24;
      intervalMs = 60 * 60 * 1000; // 1 hour intervals
      break;
    case '7D':
      intervals = 28;
      intervalMs = 6 * 60 * 60 * 1000; // 6 hour intervals
      break;
    case '30D':
      intervals = 30;
      intervalMs = 24 * 60 * 60 * 1000; // 1 day intervals
      break;
    default:
      intervals = 24;
      intervalMs = 60 * 60 * 1000;
  }

  let currentPrice = basePrice;
  
  // Use real trade data to influence price movements
  const recentTrades = trades.filter((t: any) => t.timestamp && t.timestamp > (now - (intervals * intervalMs)));
  
  for (let i = intervals; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    const periodStart = timestamp;
    const periodEnd = timestamp + intervalMs;
    
    // Find trades in this time period
    const periodTrades = recentTrades.filter((t: any) => 
      t.timestamp >= periodStart && t.timestamp < periodEnd
    );
    
    // Calculate price movement based on trades and market simulation
    let priceChange = 0;
    
    if (periodTrades.length > 0) {
      // Real trade data influences price
      const totalVolume = periodTrades.reduce((sum: number, t: any) => sum + parseFloat(t.amountIn || '0'), 0);
      const avgTradeSize = totalVolume / periodTrades.length;
      
      // Larger trades have more price impact
      const volumeImpact = Math.log(avgTradeSize + 1) * 0.001;
      priceChange += volumeImpact * (Math.random() > 0.5 ? 1 : -1);
    }
    
    // Add realistic market simulation
    const volatility = 0.02; // 2% volatility
    const trend = Math.sin(i / 10) * 0.005; // Slight trend
    const randomChange = (Math.random() - 0.5) * volatility;
    
    priceChange += trend + randomChange;
    
    // Apply price change
    currentPrice = Math.max(0.000001, currentPrice * (1 + priceChange));
    
    // Calculate OHLC data
    const open = i === intervals ? basePrice : points[points.length - 1]?.close || currentPrice;
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    // Calculate volume (higher during active trading periods)
    let volume = Math.random() * 50000 + 10000;
    if (periodTrades.length > 0) {
      volume += periodTrades.reduce((sum: number, t: any) => sum + parseFloat(t.amountIn || '0'), 0);
    }

    points.push({
      timestamp,
      price: currentPrice,
      volume,
      high,
      low,
      open,
      close
    });
  }
  
  return points;
}

// Get market statistics for multiple pairs
export async function getMarketStats(req: Request, res: Response) {
  try {
    const tokens = await storage.getAllTokens();
    const trades = await storage.getAllTrades();
    
    const stats = {
      totalTokens: tokens.length,
      totalTrades: trades.length,
      totalVolume24h: trades
        .filter((t: any) => t.timestamp && t.timestamp > (Date.now() - 24 * 60 * 60 * 1000))
        .reduce((sum: number, t: any) => sum + parseFloat(t.amountIn || '0'), 0),
      activeTokens: tokens.filter((t: any) => t.currentPrice > 0).length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching market stats:', error);
    res.status(500).json({ error: 'Failed to fetch market statistics' });
  }
}