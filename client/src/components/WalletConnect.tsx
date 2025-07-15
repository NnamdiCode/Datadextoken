import { useState, useEffect } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Coins, Database } from 'lucide-react';
import Button from './Button';
import GlassCard from './GlassCard';
import { useWallet } from '../hooks/useWallet';
import { useToast } from '../hooks/use-toast';

export default function WalletConnect() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [irysBalance, setIrysBalance] = useState<string>('0');
  const [dataTokens, setDataTokens] = useState<any[]>([]);
  const { account, isConnected, isConnecting, connect, disconnect, provider } = useWallet();
  const { toast } = useToast();

  // Fetch Irys balance and user data tokens
  useEffect(() => {
    if (isConnected && account) {
      fetchIrysBalance();
      fetchUserDataTokens();
    }
  }, [isConnected, account]);

  const fetchIrysBalance = async () => {
    try {
      // This will be replaced with actual Irys balance fetching
      setIrysBalance('10.5'); // Mock balance for now
    } catch (error) {
      console.error('Failed to fetch Irys balance:', error);
    }
  };

  const fetchUserDataTokens = async () => {
    try {
      const response = await fetch(`/api/tokens/creator/${account}`);
      if (response.ok) {
        const data = await response.json();
        setDataTokens(data.tokens || []);
      }
    } catch (error) {
      console.error('Failed to fetch user data tokens:', error);
    }
  };

  const handleCopyAddress = async () => {
    if (account) {
      await navigator.clipboard.writeText(account);
      toast({ title: 'Address copied to clipboard' });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Button
        onClick={connect}
        disabled={isConnecting}
        icon={<Wallet size={16} />}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        icon={<Wallet size={16} />}
      >
        {irysBalance} IRYS
        <ChevronDown size={16} className="ml-2" />
      </Button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 z-20">
            <div className="p-4 min-w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
              <div className="space-y-3">
                <div className="border-b border-white/10 pb-3">
                  <p className="text-sm text-gray-400 mb-1">Connected Account</p>
                  <p className="font-mono text-sm text-white">{account}</p>
                </div>

                {/* Irys Balance */}
                <div className="border-b border-white/10 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Coins size={16} className="text-blue-400 mr-2" />
                      <span className="text-sm text-gray-400">Irys Balance</span>
                    </div>
                    <span className="text-sm font-mono text-white">{irysBalance} IRYS</span>
                  </div>
                </div>

                {/* Data Tokens */}
                <div className="border-b border-white/10 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Database size={16} className="text-purple-400 mr-2" />
                      <span className="text-sm text-gray-400">Data Tokens</span>
                    </div>
                    <span className="text-sm font-mono text-white">{dataTokens.length}</span>
                  </div>
                  {dataTokens.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Click to view your created tokens
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCopyAddress}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  <Copy size={16} className="mr-2" />
                  Copy Address
                </button>

                <button
                  onClick={() => {
                    window.open(`https://testnet-explorer.irys.xyz/address/${account}`, '_blank');
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  <ExternalLink size={16} className="mr-2" />
                  View on Explorer
                </button>

                <div className="border-t border-gray-700 pt-3">
                  <button
                    onClick={() => {
                      disconnect();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <LogOut size={16} className="mr-2" />
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
