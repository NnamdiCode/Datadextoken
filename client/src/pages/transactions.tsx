import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock, CheckCircle, ArrowUpRight, ArrowDownLeft, Copy } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { useWallet } from '../hooks/useWallet';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';

interface IrysTransaction {
  id: string;
  timestamp: number;
  type: 'upload' | 'trade' | 'liquidity';
  amount: string;
  status: 'confirmed' | 'pending';
  gasUsed: string;
  blockNumber: number;
  from: string;
  to: string;
  dataSize?: number;
  tokenSymbol?: string;
}

export default function Transactions() {
  const { account, isConnected } = useWallet();
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upload' | 'trade' | 'liquidity'>('all');

  // Fetch user transactions from Irys blockchain
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['/api/irys/transactions', account],
    queryFn: async () => {
      if (!account) return { transactions: [] };
      const response = await fetch(`/api/irys/transactions?address=${account}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!account,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const transactions: IrysTransaction[] = transactionsData?.transactions || [];

  const filteredTransactions = transactions.filter(tx => {
    if (selectedFilter === 'all') return true;
    return tx.type === selectedFilter;
  });

  const handleCopyTxHash = async (txHash: string) => {
    await navigator.clipboard.writeText(txHash);
    toast({ title: 'Transaction hash copied to clipboard' });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <ArrowUpRight className="text-blue-400" size={16} />;
      case 'trade':
        return <ArrowDownLeft className="text-green-400" size={16} />;
      case 'liquidity':
        return <CheckCircle className="text-purple-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400 bg-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Transaction History</h1>
            <p className="text-gray-400 mb-8">Connect your wallet to view your Irys blockchain transactions</p>
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
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-gray-400">Your Irys blockchain transactions and data interactions</p>
        </div>

        {/* Filter tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
            {[
              { key: 'all', label: 'All Transactions' },
              { key: 'upload', label: 'Data Uploads' },
              { key: 'trade', label: 'Token Trades' },
              { key: 'liquidity', label: 'Liquidity' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedFilter === filter.key
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions list */}
        <GlassCard className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Clock className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-gray-400">Loading transactions from Irys blockchain...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No transactions found</p>
              <p className="text-sm text-gray-500">
                Start uploading data or trading tokens to see your transaction history
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white/10 rounded-full">
                      {getTransactionIcon(tx.type)}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium capitalize">{tx.type}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-400 mt-1">
                        <span>Block #{tx.blockNumber}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(tx.timestamp * 1000).toLocaleString()}</span>
                      </div>
                      
                      {tx.dataSize && (
                        <div className="text-xs text-gray-500 mt-1">
                          Data size: {(tx.dataSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      {tx.amount} {tx.tokenSymbol || 'IRYS'}
                    </div>
                    <div className="text-sm text-gray-400">
                      Gas: {tx.gasUsed}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => handleCopyTxHash(tx.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Copy transaction hash"
                      >
                        <Copy size={14} />
                      </button>
                      
                      <a
                        href={`https://testnet-explorer.irys.xyz/tx/${tx.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="View on Irys Explorer"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Irys blockchain info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="p-4">
            <h3 className="font-medium mb-2">Network</h3>
            <p className="text-sm text-gray-400">Irys Devnet</p>
            <p className="text-xs text-gray-500">Chain ID: 1270</p>
          </GlassCard>
          
          <GlassCard className="p-4">
            <h3 className="font-medium mb-2">Explorer</h3>
            <a 
              href="https://testnet-explorer.irys.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
            >
              Irys Testnet Explorer
              <ExternalLink size={12} className="ml-1" />
            </a>
          </GlassCard>
          
          <GlassCard className="p-4">
            <h3 className="font-medium mb-2">Total Transactions</h3>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}