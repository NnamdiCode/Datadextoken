import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowDownUp, ArrowRight, ChevronDown, ChevronRight, Clock, RefreshCw, Search, Settings, TrendingUp } from 'lucide-react';
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
import { toast } from 'react-toastify';

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

export default function TradePage() {
  const [selectedTab, setSelectedTab] = useState('swap');
  const [fromToken, setFromToken] = useState('IRYS');
  const [toToken, setToToken] = useState('DATA328491');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapLoading, setSwapLoading] = useState(false);
  const [showTokenList, setShowTokenList] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generate some random chart data
  const chartLabels = ['1D', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', '11D', '12D', '13D', '14D'];
  const generateRandomData = () => {
    const baseValue = Math.random() * 10 + 20;
    return chartLabels.map((_, i) => baseValue + Math.random() * 5 - 2.5 + i * 0.5);
  };
  
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Price',
        data: generateRandomData(),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
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
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
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
      mode: 'index',
      intersect: false,
    },
  };
  
  // Mock token data
  const tokens = [
    { symbol: 'IRYS', name: 'Irys Token', balance: '12.83', price: '$0.87', change: '+5.2%', color: 'text-blue-400' },
    { symbol: 'DATA328491', name: 'Weather Data Q2', balance: '3.5', price: '$2.34', change: '+12.1%', color: 'text-purple-400' },
    { symbol: 'DATA109283', name: 'Financial Research', balance: '1.2', price: '$9.12', change: '-2.3%', color: 'text-red-400' },
    { symbol: 'DATA567432', name: 'Machine Learning Dataset', balance: '0.8', price: '$4.56', change: '+1.5%', color: 'text-green-400' },
    { symbol: 'DATA901826', name: 'Genomic Sequences', balance: '2.1', price: '$7.21', change: '+8.7%', color: 'text-yellow-400' },
    { symbol: 'DATA432156', name: 'Traffic Patterns', balance: '5.3', price: '$1.15', change: '-0.8%', color: 'text-orange-400' },
  ];
  
  const filteredTokens = tokens.filter(token => 
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };
  
  useEffect(() => {
    if (fromAmount && fromAmount !== '0') {
      // Mock conversion rate based on the token pair
      const rate = fromToken === 'IRYS' ? 0.42 : 2.38;
      const result = (parseFloat(fromAmount) * rate).toFixed(6);
      setToAmount(result);
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);
  
  const handleSwap = () => {
    if (!fromAmount || parseFloat(fromAmount) === 0) return;
    
    setSwapLoading(true);
    
    // Simulate transaction process
    setTimeout(() => {
      setSwapLoading(false);
      toast.success('Swap completed successfully!');
      setFromAmount('');
      setToAmount('');
    }, 2000);
  };
  
  const tabClass = (tab: string) => 
    `px-4 py-2 text-sm font-medium rounded-md ${selectedTab === tab 
      ? 'bg-white/10 text-white' 
      : 'text-gray-300 hover:bg-white/5 hover:text-white'
    }`;
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                    className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                  />
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1 flex items-center"
                    onClick={() => setShowTokenList('from')}
                  >
                    <span className={`mr-1 ${tokens.find(t => t.symbol === fromToken)?.color || 'text-white'}`}>
                      {fromToken}
                    </span>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center my-4">
                <button
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full"
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
                    className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                    placeholder="0.0"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    readOnly
                  />
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1 flex items-center"
                    onClick={() => setShowTokenList('to')}
                  >
                    <span className={`mr-1 ${tokens.find(t => t.symbol === toToken)?.color || 'text-white'}`}>
                      {toToken}
                    </span>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
              
              {fromAmount && (
                <div className="mb-6 px-3 py-2 bg-white/5 rounded-md text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Rate</span>
                    <span>1 {fromToken} = {fromToken === 'IRYS' ? '0.42' : '2.38'} {toToken}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mt-1">
                    <span>Fee</span>
                    <span>0.3%</span>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleSwap}
                disabled={!fromAmount || parseFloat(fromAmount) === 0 || swapLoading}
                fullWidth
              >
                {swapLoading ? (
                  <div className="flex items-center justify-center">
                    <Clock size={16} className="animate-spin mr-2" />
                    <span>Swapping...</span>
                  </div>
                ) : (
                  'Swap Tokens'
                )}
              </Button>
              
              <div className="mt-4 text-xs text-gray-400 flex items-center justify-center">
                <Settings size={12} className="mr-1" />
                <span>Slippage Tolerance: 0.5%</span>
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
                  <h2 className="text-xl font-medium">{fromToken}/{toToken} Exchange</h2>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl font-bold mr-2">
                      {fromToken === 'IRYS' ? '0.42' : '2.38'}
                    </span>
                    <span className="text-sm bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      +3.2%
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 bg-white/5 hover:bg-white/10 rounded-md">
                    <RefreshCw size={16} />
                  </button>
                  <button className="p-2 bg-white/5 hover:bg-white/10 rounded-md">
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
                    className={`px-3 py-1 text-xs rounded-md ${
                      period === '7D' 
                        ? 'bg-blue-500/20 text-blue-400' 
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
            {tokens.slice(0, 4).map((token) => (
              <GlassCard 
                key={token.symbol} 
                animateOnHover 
                className="p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{token.name}</div>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs font-medium ${token.color} mr-2`}>
                        {token.symbol}
                      </span>
                      <span className={`text-xs ${token.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {token.change}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{token.price}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Balance: {token.balance}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => {
                    setFromToken('IRYS');
                    setToToken(token.symbol);
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
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-500"
                    placeholder="Search token name or symbol"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {filteredTokens.map((token) => (
                  <button
                    key={token.symbol}
                    className="w-full p-4 hover:bg-white/5 flex items-center justify-between border-b border-white/5 transition-colors"
                    onClick={() => {
                      if (showTokenList === 'from') {
                        if (token.symbol === toToken) {
                          setToToken(fromToken);
                        }
                        setFromToken(token.symbol);
                      } else {
                        if (token.symbol === fromToken) {
                          setFromToken(toToken);
                        }
                        setToToken(token.symbol);
                      }
                      setShowTokenList(null);
                      setSearchQuery('');
                    }}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${token.color.replace('text-', 'bg-').replace('400', '500/20')}`}>
                        <span className={token.color}>{token.symbol.substring(0, 1)}</span>
                      </div>
                      <div className="ml-3 text-left">
                        <div className="font-medium">{token.name}</div>
                        <div className={`text-xs ${token.color}`}>{token.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div>{token.balance}</div>
                      <div className="text-xs text-gray-400">{token.price}</div>
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
