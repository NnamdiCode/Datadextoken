import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, ArrowRight, ChevronDown, Clock, RefreshCw, Search, Settings, TrendingUp, X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
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
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import WalletConnect from '../components/WalletConnect';
import { useWallet } from '../hooks/useWallet';

// Register ChartJS components
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

export default function Trade() {
  const [selectedTab, setSelectedTab] = useState('swap');
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showTokenList, setShowTokenList] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { account, isConnected } = useWallet();

  // Fetch available tokens
  const { data: tokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ['/api/tokens', searchQuery],
    queryFn: async () => {
      const url = searchQuery ? `/api/search?q=${encodeURIComponent(searchQuery)}` : '/api/tokens?limit=50';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tokens');
      return response.json();
    },
  });

  const tokens = tokensData?.tokens || [];

  // Fetch recent trades
  const { data: tradesData } = useQuery({
    queryKey: ['/api/trades'],
    queryFn: async () => {
      const response = await fetch('/api/trades?limit=10');
      if (!response.ok) throw new Error('Failed to fetch trades');
      return response.json();
    },
  });

  // Get swap quote
  const { data: quoteData, refetch: refetchQuote } = useQuery({
    queryKey: ['/api/trade/quote', fromToken, toToken, fromAmount],
    queryFn: async () => {
      if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) === 0) {
        return null;
      }
      const params = new URLSearchParams({
        tokenIn: fromToken,
        tokenOut: toToken,
        amountIn: fromAmount,
      });
      const response = await fetch(`/api/trade/quote?${params}`);
      if (!response.ok) throw new Error('Failed to get quote');
      return response.json();
    },
    enabled: !!(fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0),
  });

  // Execute trade mutation
  const tradeMutation = useMutation({
    mutationFn: async (tradeData: {
      fromTokenAddress: string;
      toTokenAddress: string;
      amountIn: string;
      minAmountOut: string;
      traderAddress: string;
    }) => {
      return apiRequest('POST', '/api/trade', tradeData);
    },
    onSuccess: () => {
      toast({ title: 'Trade executed successfully!' });
      setFromAmount('');
      setToAmount('');
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Trade failed', 
        description: error.message || 'Unknown error occurred',
        variant: 'destructive'
      });
    },
  });

  // Update toAmount when quote changes
  useEffect(() => {
    if (quoteData?.amountOut) {
      setToAmount(parseFloat(quoteData.amountOut).toFixed(6));
    } else {
      setToAmount('');
    }
  }, [quoteData]);

  const filteredTokens = tokens.filter((token: any) => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleTrade = async () => {
    if (!isConnected || !account) {
      toast({ title: 'Please connect your wallet first', variant: 'destructive' });
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) === 0) {
      toast({ title: 'Please enter an amount', variant: 'destructive' });
      return;
    }

    if (!fromToken || !toToken) {
      toast({ title: 'Please select both tokens', variant: 'destructive' });
      return;
    }

    const minAmountOut = quoteData ? 
      (parseFloat(quoteData.amountOut) * (1 - slippage / 100)).toString() : 
      '0';

    tradeMutation.mutate({
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      amountIn: fromAmount,
      minAmountOut,
      traderAddress: account,
    });
  };

  const tabClass = (tab: string) => 
    `px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedTab === tab 
      ? 'bg-white/10 text-white' 
      : 'text-gray-300 hover:bg-white/5 hover:text-white'
    }`;

  // Generate chart data based on token prices
  const chartLabels = ['1D', '2D', '3D', '4D', '5D', '6D', '7D'];
  const generateTokenPriceData = () => {
    if (tokens.length === 0) return [0.001, 0.0012, 0.0008, 0.0015, 0.0018, 0.0016, 0.0022];
    
    const selectedToken = tokens.find((t: any) => t.tokenAddress === fromToken) || tokens[0];
    const basePrice = selectedToken?.currentPrice || 0.001;
    
    return chartLabels.map((_, i) => {
      const volatility = 0.2; // 20% volatility
      const trend = i * 0.0001; // Small upward trend
      const randomChange = (Math.random() - 0.5) * volatility;
      return Math.max(0.0001, basePrice + trend + (basePrice * randomChange));
    });
  };
  
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Price (IRYS)',
        data: generateTokenPriceData(),
        borderColor: 'hsl(217, 91%, 60%)',
        backgroundColor: 'hsla(217, 91%, 60%, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      }
    ]
  };
  
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
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 10,
          },
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 10,
          },
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trade Data Tokens</h1>
          <p className="text-gray-300">Swap your data tokens using our automated market maker</p>
        </div>
        <WalletConnect />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Trade panel */}
        <div className="lg:col-span-1">
          <GlassCard className="sticky top-24">
            <div className="p-4 border-b border-white/10">
              <div className="flex space-x-2">
                <button 
                  className={tabClass('swap')}
                  onClick={() => setSelectedTab('swap')}
                >
                  Swap
                </button>
                <button 
                  className={tabClass('pool')}
                  onClick={() => setSelectedTab('pool')}
                >
                  Liquidity
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                  />
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1 flex items-center transition-colors"
                    onClick={() => setShowTokenList('from')}
                  >
                    <span className="mr-1 text-white truncate max-w-16">
                      {fromToken ? tokens.find((t: any) => t.tokenAddress === fromToken)?.symbol || 'Unknown' : 'Select'}
                    </span>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center my-4">
                <button
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  onClick={handleSwapTokens}
                >
                  <ArrowDownUp size={16} />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  To
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
                    placeholder="0.0"
                    value={toAmount}
                    readOnly
                  />
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1 flex items-center transition-colors"
                    onClick={() => setShowTokenList('to')}
                  >
                    <span className="mr-1 text-white truncate max-w-16">
                      {toToken ? tokens.find((t: any) => t.tokenAddress === toToken)?.symbol || 'Unknown' : 'Select'}
                    </span>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
              
              {quoteData && fromAmount && (
                <div className="mb-6 px-3 py-2 bg-white/5 rounded-md text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Rate</span>
                    <span>1 : {(parseFloat(quoteData.amountOut) / parseFloat(fromAmount)).toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mt-1">
                    <span>Price Impact</span>
                    <span className={quoteData.priceImpact > 5 ? 'text-red-400' : 'text-green-400'}>
                      {quoteData.priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400 mt-1">
                    <span>Fee</span>
                    <span>0.3%</span>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleTrade}
                disabled={!isConnected || !fromAmount || parseFloat(fromAmount) === 0 || tradeMutation.isPending || !fromToken || !toToken}
                fullWidth
              >
                {tradeMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <Clock size={16} className="animate-spin mr-2" />
                    <span>Swapping...</span>
                  </div>
                ) : !isConnected ? (
                  'Connect Wallet'
                ) : (
                  'Swap Tokens'
                )}
              </Button>
              
              <div className="mt-4 text-xs text-gray-400 flex items-center justify-center">
                <Settings size={12} className="mr-1" />
                <span>Slippage Tolerance: {slippage}%</span>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Right column - Chart and tokens */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-medium">Price Chart</h2>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl font-bold mr-2">
                      {quoteData ? (parseFloat(quoteData.amountOut) / parseFloat(fromAmount || '1')).toFixed(6) : '--'}
                    </span>
                    <span className="text-sm bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      +3.2%
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => refetchQuote()}
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button className="p-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors">
                    <Settings size={16} />
                  </button>
                </div>
              </div>
              
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
              
              <div className="flex justify-center mt-4 space-x-2">
                {['1H', '24H', '7D', '30D', 'All'].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      period === '7D' 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>
          
          <h3 className="text-lg font-medium mb-4">Available Tokens</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {tokensLoading ? (
              <div className="col-span-2 text-center py-12 text-gray-400">Loading tokens...</div>
            ) : tokens.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-400">No tokens available</div>
            ) : tokens.slice(0, 4).map((token: any) => (
              <GlassCard 
                key={token.id} 
                animateOnHover 
                className="p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{token.name}</div>
                    <div className="flex items-center mt-1">
                      <span className="text-xs font-medium text-blue-400 mr-2">
                        {token.symbol}
                      </span>
                      <span className="text-xs text-green-400">
                        +{Math.random() * 10}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${(Math.random() * 10).toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {(token.fileSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => {
                    setFromToken(tokens[0]?.tokenAddress || '');
                    setToToken(token.tokenAddress);
                    setSelectedTab('swap');
                  }}
                >
                  Trade
                </Button>
              </GlassCard>
            ))}
          </div>
          
          <GlassCard className="p-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">Ready to add your own data?</h3>
                <p className="text-gray-300 text-sm">
                  Upload your data, mint tokens, and start trading in minutes.
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/upload'}
                icon={<ArrowRight size={16} />}
              >
                Upload Data
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
      
      {/* Token selection modal */}
      {showTokenList && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Select a token</h3>
                  <button 
                    onClick={() => setShowTokenList(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500"
                    placeholder="Search token name or symbol"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {filteredTokens.map((token: any) => (
                  <button
                    key={token.id}
                    className="w-full p-4 hover:bg-white/5 flex items-center justify-between border-b border-white/5 transition-colors"
                    onClick={() => {
                      if (showTokenList === 'from') {
                        if (token.tokenAddress === toToken) {
                          setToToken(fromToken);
                        }
                        setFromToken(token.tokenAddress);
                      } else {
                        if (token.tokenAddress === fromToken) {
                          setFromToken(toToken);
                        }
                        setToToken(token.tokenAddress);
                      }
                      setShowTokenList(null);
                      setSearchQuery('');
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-400">{token.symbol.substring(0, 1)}</span>
                      </div>
                      <div className="ml-3 text-left">
                        <div className="font-medium">{token.name}</div>
                        <div className="text-xs text-blue-400">{token.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div>{(token.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                      <div className="text-xs text-gray-400">{token.fileType.split('/')[1]?.toUpperCase()}</div>
                    </div>
                  </button>
                ))}
                
                {filteredTokens.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    No tokens found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
