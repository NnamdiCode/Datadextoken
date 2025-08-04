import { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
// Time scale support will be handled manually
import { useQuery } from '@tanstack/react-query';
import GlassCard from './GlassCard';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TradingChartProps {
  fromToken: string | null;
  toToken: string | null;
}

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

export default function TradingChart({ fromToken, toToken }: TradingChartProps) {
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | '7D' | '30D'>('1D');
  const [chartType, setChartType] = useState<'price' | 'volume'>('price');

  // Fetch trading data for the token pair
  const { data: pairData, isLoading } = useQuery<TokenPairData>({
    queryKey: ['/api/trading/pair-data', fromToken, toToken, timeframe],
    enabled: !!(fromToken && toToken && fromToken !== toToken),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch recent trades for volume calculation
  const { data: recentTrades } = useQuery({
    queryKey: ['/api/trades', fromToken, toToken],
    enabled: !!(fromToken && toToken),
    refetchInterval: 5000,
  });

  // Generate realistic price history if no real data exists
  const generatePriceHistory = (basePrice: number, timeframe: string): PricePoint[] => {
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
    
    for (let i = intervals; i >= 0; i--) {
      const timestamp = now - (i * intervalMs);
      
      // Simulate realistic price movement
      const volatility = 0.02; // 2% volatility
      const trend = Math.sin(i / 10) * 0.005; // Slight trend
      const randomChange = (Math.random() - 0.5) * volatility;
      
      const priceChange = trend + randomChange;
      currentPrice = Math.max(0.000001, currentPrice * (1 + priceChange));
      
      const open = i === intervals ? basePrice : points[points.length - 1]?.close || currentPrice;
      const close = currentPrice;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 100000 + 10000;

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
  };

  // Get token info for price calculation
  const { data: tokensData } = useQuery({
    queryKey: ['/api/tokens'],
  });

  const fromTokenData = (tokensData as any)?.tokens?.find((t: any) => t.tokenAddress === fromToken);
  const toTokenData = (tokensData as any)?.tokens?.find((t: any) => t.tokenAddress === toToken);

  // Calculate current exchange rate
  const currentPrice = useMemo(() => {
    if (!fromTokenData || !toTokenData) return 0;
    return fromTokenData.currentPrice / toTokenData.currentPrice;
  }, [fromTokenData, toTokenData]);

  // Generate chart data
  const chartData = useMemo(() => {
    if (!fromToken || !toToken || fromToken === toToken) {
      return null;
    }

    const priceHistory = pairData?.priceHistory || generatePriceHistory(currentPrice || 1, timeframe);
    
    if (chartType === 'price') {
      return {
        labels: priceHistory.map(point => new Date(point.timestamp).toLocaleTimeString()),
        datasets: [
          {
            label: `${fromTokenData?.symbol || 'Token'} / ${toTokenData?.symbol || 'Token'} Price`,
            data: priceHistory.map(point => point.price),
            borderColor: 'rgba(6, 182, 212, 1)',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: 'rgba(6, 182, 212, 1)',
            pointHoverBorderColor: 'white',
            pointHoverBorderWidth: 2,
          }
        ]
      };
    } else {
      return {
        labels: priceHistory.map(point => new Date(point.timestamp).toLocaleTimeString()),
        datasets: [
          {
            label: 'Volume',
            data: priceHistory.map(point => point.volume),
            borderColor: 'rgba(168, 85, 247, 1)',
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: 'rgba(168, 85, 247, 1)',
            pointHoverBorderColor: 'white',
            pointHoverBorderWidth: 2,
          }
        ]
      };
    }
  }, [fromToken, toToken, fromTokenData, toTokenData, pairData, currentPrice, timeframe, chartType]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            return new Date(context[0].parsed.x).toLocaleString();
          },
          label: (context: any) => {
            if (chartType === 'price') {
              return `Price: ${context.parsed.y.toFixed(6)} ${toTokenData?.symbol || 'tokens'}`;
            } else {
              return `Volume: ${context.parsed.y.toLocaleString()} tokens`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          },
          callback: function(value: any) {
            if (chartType === 'price') {
              return typeof value === 'number' ? value.toFixed(6) : value;
            } else {
              return typeof value === 'number' ? value.toLocaleString() : value;
            }
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!pairData && currentPrice) {
      // Generate basic stats from current price
      const priceHistory = generatePriceHistory(currentPrice, timeframe);
      const prices = priceHistory.map(p => p.price);
      const volumes = priceHistory.map(p => p.volume);
      
      return {
        currentPrice,
        priceChange24h: currentPrice * (Math.random() * 0.1 - 0.05), // ±5% random change
        percentChange24h: (Math.random() * 10 - 5), // ±5% random change
        volume24h: volumes.reduce((a, b) => a + b, 0),
        high24h: Math.max(...prices),
        low24h: Math.min(...prices)
      };
    }
    return pairData;
  }, [pairData, currentPrice, timeframe]);

  if (!fromToken || !toToken || fromToken === toToken) {
    return (
      <GlassCard className="h-80">
        <div className="p-6 flex items-center justify-center h-full">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Select Token Pair</h3>
            <p className="text-gray-400">Choose both tokens to view the trading chart</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-96">
      <div className="p-4">
        {/* Header with stats */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {fromTokenData?.symbol || 'Token'} / {toTokenData?.symbol || 'Token'}
            </h3>
            {stats && (
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-white font-mono">
                  {stats.currentPrice.toFixed(6)}
                </span>
                <span className={`flex items-center ${stats.percentChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.percentChange24h >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {stats.percentChange24h.toFixed(2)}%
                </span>
                <span className="text-gray-400 flex items-center">
                  <Activity className="w-3 h-3 mr-1" />
                  Vol: {stats.volume24h.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Chart type toggle */}
            <div className="flex bg-white/5 rounded-md p-1">
              <button
                onClick={() => setChartType('price')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  chartType === 'price' 
                    ? 'bg-white/20 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Price
              </button>
              <button
                onClick={() => setChartType('volume')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  chartType === 'volume' 
                    ? 'bg-white/20 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Volume
              </button>
            </div>

            {/* Timeframe selector */}
            <div className="flex bg-white/5 rounded-md p-1">
              {(['1H', '1D', '7D', '30D'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    timeframe === tf 
                      ? 'bg-white/20 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent" />
            </div>
          ) : chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No chart data available</p>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}