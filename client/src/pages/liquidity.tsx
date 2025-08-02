import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Info, ExternalLink, Droplets } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { useWallet } from '../hooks/useWallet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';

export default function Liquidity() {
  const [selectedTab, setSelectedTab] = useState<'add' | 'remove'>('add');
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [showTokenList, setShowTokenList] = useState<'tokenA' | 'tokenB' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { account, isConnected } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available tokens
  const { data: tokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ['/api/tokens'],
    queryFn: async () => {
      const response = await fetch('/api/tokens?limit=100');
      if (!response.ok) throw new Error('Failed to fetch tokens');
      return response.json();
    },
  });

  const tokens = tokensData?.tokens || [];



  // Fetch user's liquidity positions
  const { data: liquidityData } = useQuery({
    queryKey: ['/api/liquidity/positions', account],
    queryFn: async () => {
      if (!account) return { positions: [] };
      const response = await fetch(`/api/liquidity/positions?address=${account}`);
      if (!response.ok) throw new Error('Failed to fetch liquidity positions');
      return response.json();
    },
    enabled: !!account,
  });

  const liquidityPositions = liquidityData?.positions || [];

  // Get pool info for selected tokens
  const { data: poolData } = useQuery({
    queryKey: ['/api/liquidity/pool', tokenA, tokenB],
    queryFn: async () => {
      if (!tokenA || !tokenB) return null;
      const response = await fetch(`/api/liquidity/pool?tokenA=${tokenA}&tokenB=${tokenB}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!(tokenA && tokenB && tokenA !== tokenB),
  });

  // Add liquidity mutation
  const addLiquidityMutation = useMutation({
    mutationFn: async (data: {
      tokenA: string;
      tokenB: string;
      amountA: string;
      amountB: string;
      userAddress: string;
    }) => {
      return apiRequest('POST', '/api/liquidity/add', data);
    },
    onSuccess: () => {
      toast({ title: 'Liquidity added successfully!' });
      setAmountA('');
      setAmountB('');
      queryClient.invalidateQueries({ queryKey: ['/api/liquidity/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/liquidity/pool'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to add liquidity', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Remove liquidity mutation
  const removeLiquidityMutation = useMutation({
    mutationFn: async (data: {
      tokenA: string;
      tokenB: string;
      liquidity: string;
      userAddress: string;
    }) => {
      return apiRequest('POST', '/api/liquidity/remove', data);
    },
    onSuccess: () => {
      toast({ title: 'Liquidity removed successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/liquidity/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/liquidity/pool'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to remove liquidity', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const handleAddLiquidity = () => {
    if (!isConnected || !account) {
      toast({ title: 'Please connect your wallet first', variant: 'destructive' });
      return;
    }

    if (!tokenA || !tokenB || !amountA || !amountB) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    addLiquidityMutation.mutate({
      tokenA,
      tokenB,
      amountA,
      amountB,
      userAddress: account,
    });
  };

  const handleRemoveLiquidity = (position: any, percentage: number) => {
    if (!isConnected || !account) {
      toast({ title: 'Please connect your wallet first', variant: 'destructive' });
      return;
    }

    const liquidityToRemove = (parseFloat(position.liquidity) * percentage / 100).toString();

    removeLiquidityMutation.mutate({
      tokenA: position.tokenA,
      tokenB: position.tokenB,
      liquidity: liquidityToRemove,
      userAddress: account,
    });
  };

  const filteredTokens = tokens.filter((token: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return token.name?.toLowerCase().includes(query) || 
           token.symbol?.toLowerCase().includes(query);
  });

  const getTokenByAddress = (address: string) => {
    return tokens.find((t: any) => t.tokenAddress === address);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Liquidity Pools</h1>
            <p className="text-gray-400 mb-8">Connect your wallet to provide liquidity and earn fees</p>
            <Button>Connect Wallet</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Liquidity Pools</h1>
          <p className="text-gray-400">Provide liquidity to earn trading fees on the Irys AMM</p>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add/Remove Liquidity */}
          <div>
            <div className="mb-6">
              <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setSelectedTab('add')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === 'add'
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Plus size={16} className="inline mr-2" />
                  Add Liquidity
                </button>
                <button
                  onClick={() => setSelectedTab('remove')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === 'remove'
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Minus size={16} className="inline mr-2" />
                  Remove Liquidity
                </button>
              </div>
            </div>

            {selectedTab === 'add' ? (
              <GlassCard className="p-6">
                <h3 className="text-lg font-medium mb-4">Add Liquidity</h3>
                
                {/* Token A Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Token A</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={amountA}
                      onChange={(e) => setAmountA(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => setShowTokenList('tokenA')}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {tokenA ? getTokenByAddress(tokenA)?.symbol || 'Select' : 'Select Token'}
                    </button>
                  </div>
                </div>

                {/* Token B Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Token B</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={amountB}
                      onChange={(e) => setAmountB(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => setShowTokenList('tokenB')}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {tokenB ? getTokenByAddress(tokenB)?.symbol || 'Select' : 'Select Token'}
                    </button>
                  </div>
                </div>

                {poolData && (
                  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Info size={16} className="text-blue-400 mr-2" />
                      <span className="text-sm font-medium">Pool Information</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <div>Total Liquidity: {parseFloat(poolData.pool.totalLiquidity).toLocaleString()}</div>
                      <div>Reserve A: {parseFloat(poolData.pool.reserveA).toLocaleString()}</div>
                      <div>Reserve B: {parseFloat(poolData.pool.reserveB).toLocaleString()}</div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddLiquidity}
                  disabled={!tokenA || !tokenB || !amountA || !amountB || addLiquidityMutation.isPending}
                  fullWidth
                >
                  {addLiquidityMutation.isPending ? 'Adding Liquidity...' : 'Add Liquidity'}
                </Button>
              </GlassCard>
            ) : (
              <GlassCard className="p-6">
                <h3 className="text-lg font-medium mb-4">Your Liquidity Positions</h3>
                
                {liquidityPositions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Droplets size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No liquidity positions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {liquidityPositions.map((position: any, index: number) => (
                      <div key={index} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium">
                            {getTokenByAddress(position.tokenA)?.symbol} / {getTokenByAddress(position.tokenB)?.symbol}
                          </span>
                          <span className="text-sm text-gray-400">
                            {parseFloat(position.liquidity).toFixed(2)} LP tokens
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {[25, 50, 100].map((percentage) => (
                            <Button
                              key={percentage}
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveLiquidity(position, percentage)}
                              disabled={removeLiquidityMutation.isPending}
                            >
                              {percentage}%
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}
          </div>

          {/* Pool Stats */}
          <div>
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium mb-4">Pool Statistics</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Total Value Locked</span>
                    <span className="font-medium">$2.4M</span>
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">24h Volume</span>
                    <span className="font-medium">$156K</span>
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">24h Fees</span>
                    <span className="font-medium text-green-400">$468</span>
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Active Pools</span>
                    <span className="font-medium">{tokens.length * (tokens.length - 1) / 2}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="font-medium mb-3">Popular Pools</h4>
                <div className="space-y-2">
                  {tokens.slice(0, 3).map((token: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                      <span className="text-sm">{token.symbol} / IRYS</span>
                      <span className="text-sm text-green-400">+{(Math.random() * 10 + 5).toFixed(2)}% APY</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Token Selection Modal */}
        {showTokenList && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-md max-h-96 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-medium mb-2">Select Token</h3>
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>
              
              <div className="overflow-y-auto max-h-64">
                {filteredTokens.map((token: any) => (
                  <button
                    key={token.id}
                    onClick={() => {
                      if (showTokenList === 'tokenA') {
                        setTokenA(token.tokenAddress);
                      } else {
                        setTokenB(token.tokenAddress);
                      }
                      setShowTokenList(null);
                      setSearchQuery('');
                    }}
                    className="w-full p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
                  >
                    <div className="font-medium">{token.name}</div>
                    <div className="text-sm text-gray-400">{token.symbol}</div>
                  </button>
                ))}
              </div>
              
              <div className="p-4 border-t border-white/10">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTokenList(null)}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}