import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, ArrowRight, ChevronDown, Clock, RefreshCw, Search, Settings, TrendingUp, X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import TradingChart from '../components/TradingChart';

import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import WalletConnect from '../components/WalletConnect';
import { useWallet } from '../hooks/useWallet';



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

  // Fetch available tokens (limit to 100)
  const { data: tokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ['/api/tokens', searchQuery],
    queryFn: async () => {
      const url = searchQuery ? `/api/search?q=${encodeURIComponent(searchQuery)}` : '/api/tokens?limit=100';
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
      const response = await fetch(`/api/trade/quote?fromToken=${fromToken}&toToken=${toToken}&amountIn=${fromAmount}`);
      if (!response.ok) throw new Error('Failed to get quote');
      return response.json();
    },
    enabled: !!(fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0),
  });

  // Execute trade
  const tradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      return apiRequest('/api/irys/swap', tradeData);
    },
    onSuccess: (data) => {
      toast({ title: 'Trade executed successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      setFromAmount('');
      setToAmount('');
    },
    onError: (error: any) => {
      toast({
        title: 'Trade failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update to amount when quote changes or from amount changes
  useEffect(() => {
    if (quoteData?.quote?.amountOut) {
      setToAmount(quoteData.quote.amountOut);
    }
  }, [quoteData]);

  // Calculate output amount automatically when inputs change
  useEffect(() => {
    const calculateOutputAmount = async () => {
      if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) === 0) {
        setToAmount('');
        return;
      }

      try {
        const response = await fetch(`/api/trade/quote?fromToken=${fromToken}&toToken=${toToken}&amountIn=${fromAmount}`);
        if (response.ok) {
          const data = await response.json();
          if (data.quote?.amountOut) {
            setToAmount(data.quote.amountOut);
          }
        }
      } catch (error) {
        console.error('Failed to calculate output amount:', error);
      }
    };

    // Debounce the calculation to avoid too many API calls
    const timeoutId = setTimeout(calculateOutputAmount, 300);
    return () => clearTimeout(timeoutId);
  }, [fromToken, toToken, fromAmount]);

  // Filter tokens for modal
  const filteredTokens = tokens.filter((token: any) =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTokenSelect = (token: any, type: 'from' | 'to') => {
    if (type === 'from') {
      setFromToken(token.tokenAddress);
      if (token.tokenAddress === toToken) {
        setToToken('');
      }
    } else {
      setToToken(token.tokenAddress);
      if (token.tokenAddress === fromToken) {
        setFromToken('');
      }
    }
    setShowTokenList(null);
    setSearchQuery('');
  };

  const getTokenByAddress = (address: string) => {
    return tokens.find((token: any) => token.tokenAddress === address);
  };

  const swapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleTrade = async () => {
    if (!account) {
      toast({ title: 'Please connect your wallet', variant: 'destructive' });
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

    if (!toAmount || parseFloat(toAmount) === 0) {
      toast({ title: 'Invalid quote - please try again', variant: 'destructive' });
      return;
    }

    tradeMutation.mutate({
      fromToken: fromToken,
      toToken: toToken,
      amountIn: fromAmount,
      amountOut: toAmount,
      traderAddress: account,
      slippage: slippage,
    });
  };

  const tabClass = (tab: string) => 
    `px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedTab === tab 
      ? 'bg-white/10 text-white' 
      : 'text-gray-300 hover:bg-white/5 hover:text-white'
    }`;




  


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 shiny-text">Trade Data Tokens</h1>
          <p className="text-white">Swap your data tokens using our automated market maker</p>
        </div>
      </div>

      {/* Trading Chart - Full Width TradingView Style */}
      <div className="mb-8">
        <TradingChart fromToken={fromToken} toToken={toToken} />
      </div>

      <div className="flex justify-center">
        {/* Centered Trade Panel */}
        <div className="w-full max-w-md">
          <GlassCard className="h-fit">
            <div className="p-4 border-b border-white/10">
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-white/10 text-white"
                >
                  Swap
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* From token input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-300">From</label>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <input
                      type="number"
                      className="bg-transparent text-left text-lg font-medium text-white placeholder-gray-500 outline-none flex-1 mr-4"
                      placeholder="0.00"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                    />
                    <button
                      onClick={() => setShowTokenList('from')}
                      className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 rounded-md px-3 py-2 transition-colors"
                    >
                      {fromToken ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-400 text-xs font-bold">
                              {getTokenByAddress(fromToken)?.symbol?.substring(0, 1) || 'T'}
                            </span>
                          </div>
                          <span className="font-medium">{getTokenByAddress(fromToken)?.symbol || 'Select'}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Select token</span>
                      )}
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  {fromToken && (
                    <div className="text-xs text-gray-400">
                      Price: {(getTokenByAddress(fromToken)?.currentPrice || 0).toFixed(6)} IRYS
                    </div>
                  )}
                </div>
              </div>

              {/* Swap button */}
              <div className="flex justify-center my-4">
                <button
                  onClick={swapTokens}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ArrowDownUp size={20} className="text-gray-300" />
                </button>
              </div>

              {/* To token input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-300">To</label>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <input
                      type="number"
                      className="bg-transparent text-left text-lg font-medium text-white placeholder-gray-500 outline-none flex-1 mr-4"
                      placeholder="0.00"
                      value={toAmount}
                      readOnly
                    />
                    <button
                      onClick={() => setShowTokenList('to')}
                      className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 rounded-md px-3 py-2 transition-colors"
                    >
                      {toToken ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-400 text-xs font-bold">
                              {getTokenByAddress(toToken)?.symbol?.substring(0, 1) || 'T'}
                            </span>
                          </div>
                          <span className="font-medium">{getTokenByAddress(toToken)?.symbol || 'Select'}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Select token</span>
                      )}
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  {toToken && (
                    <div className="text-xs text-gray-400">
                      Price: {(getTokenByAddress(toToken)?.currentPrice || 0).toFixed(6)} IRYS
                    </div>
                  )}
                </div>
              </div>

              {/* Trade summary */}
              {quoteData?.quote && fromAmount && toAmount && (
                <div className="mb-6 px-3 py-2 bg-white/5 rounded-md text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Exchange Rate</span>
                    <span>1 : {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mt-1">
                    <span>Trading Fee</span>
                    <span>0.3%</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mt-1">
                    <span>You will receive</span>
                    <span className="text-white font-medium">{toAmount}</span>
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
      </div>
      
      {/* Full width tokens section */}
      <div className="mt-12">
        <h3 className="text-lg font-medium mb-4 text-white">Available Tokens</h3>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {tokensLoading ? (
            <div className="col-span-2 text-center py-12 text-gray-400">Loading tokens...</div>
          ) : tokens.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-gray-400">No tokens available</div>
          ) : (
            tokens.map((token: any) => (
              <GlassCard 
                key={token.id} 
                animateOnHover 
                className="p-4 h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-4 flex-grow">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-white">{token.name}</div>
                    <div className="flex items-center mt-2 space-x-2 flex-wrap">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: 'rgb(64, 224, 208)', backgroundColor: 'rgba(64, 224, 208, 0.2)' }}>
                        {token.symbol}
                      </span>
                      <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
                        {token.category ? token.category.charAt(0).toUpperCase() + token.category.slice(1) : 'Other'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="font-medium text-white">{(token.currentPrice || 0.005).toFixed(3)} IRYS</div>
                    <div className="text-xs" style={{ color: 'rgb(64, 224, 208)' }}>
                      Cap: {(((token.currentPrice || 0.005) * 1000000000) / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-400">
                      {(token.fileSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <div className="mt-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFromToken(tokens[0]?.tokenAddress || '');
                      setToToken(token.tokenAddress);
                      setSelectedTab('swap');
                    }}
                  >
                    Trade
                  </Button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
          
        <GlassCard className="p-6 bg-card border-primary/30">
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
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
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