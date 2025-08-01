import { useState, useEffect } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Coins, Database, AlertTriangle, Network } from 'lucide-react';
import Button from './Button';
import GlassCard from './GlassCard';
import WalletSelector from './WalletSelector';
import { useWallet } from '../hooks/useWallet';
import { useToast } from '../hooks/use-toast';

export default function WalletConnect() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
  const [irysBalance, setIrysBalance] = useState<string>('0');
  const [dataTokens, setDataTokens] = useState<any[]>([]);
  const { 
    account, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    provider, 
    chainId, 
    isIrysNetwork, 
    switchToIrys, 
    addIrysNetwork, 
    networkError 
  } = useWallet();
  const { toast } = useToast();

  // Fetch Irys balance and user data tokens
  useEffect(() => {
    if (isConnected && account) {
      fetchIrysBalance();
      fetchUserDataTokens();
    }
  }, [isConnected, account]);

  const fetchIrysBalance = async () => {
    if (!account) return;
    
    try {
      const response = await fetch(`/api/irys/balance?address=${account}`);
      if (response.ok) {
        const data = await response.json();
        setIrysBalance(parseFloat(data.balance || '0').toFixed(4));
      }
    } catch (error) {
      console.error('Failed to fetch IRYS balance:', error);
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

  const getNetworkName = (chainId: string | null) => {
    switch (chainId) {
      case '0x4F6':
        return 'Irys Devnet';
      case '0x4F7':
        return 'Irys Mainnet';
      case '0x1':
        return 'Ethereum';
      case '0x89':
        return 'Polygon';
      default:
        return 'Unknown Network';
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      const success = await switchToIrys();
      if (success) {
        toast({ title: 'Successfully switched to Irys Network' });
      }
    } catch (error: any) {
      toast({ 
        title: 'Failed to switch network', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end space-y-2">
        <Button
          onClick={() => {
            // Always show wallet selector to let user choose their preferred EVM wallet
            setIsWalletSelectorOpen(true);
          }}
          disabled={isConnecting}
          icon={<Wallet size={16} />}
          className="glossy-button"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
        {networkError && (
          <div className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded max-w-48 text-right border border-red-400/20">
            {networkError}
          </div>
        )}
        {typeof window !== 'undefined' && !window.ethereum && (
          <div className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded max-w-48 text-right border border-yellow-400/20">
            No wallet extension detected. Please install MetaMask or another Web3 wallet.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {!isIrysNetwork && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchNetwork}
            icon={<AlertTriangle size={14} />}
            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
          >
            Switch to Irys
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          icon={<Wallet size={16} />}
          className={!isIrysNetwork ? 'border-yellow-500/30' : ''}
        >
          {irysBalance} IRYS
          <ChevronDown size={16} className="ml-2" />
        </Button>
      </div>

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
                  <p className="font-mono text-sm text-white">{formatAddress(account || '')}</p>
                </div>

                {/* Network Status */}
                <div className="border-b border-white/10 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Network size={16} className={isIrysNetwork ? "text-green-400" : "text-yellow-400"} />
                      <span className="text-sm text-gray-400 ml-2">Network</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm font-mono ${isIrysNetwork ? 'text-green-400' : 'text-yellow-400'}`}>
                        {getNetworkName(chainId)}
                      </span>
                    </div>
                  </div>
                  {!isIrysNetwork && (
                    <div className="mt-2">
                      <button
                        onClick={handleSwitchNetwork}
                        className="w-full text-xs text-yellow-400 hover:text-yellow-300 bg-yellow-400/10 hover:bg-yellow-400/20 px-2 py-1 rounded transition-colors"
                      >
                        Switch to Irys Network
                      </button>
                    </div>
                  )}
                  {networkError && (
                    <div className="mt-2 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
                      {networkError}
                    </div>
                  )}
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
                    const explorerUrl = isIrysNetwork 
                      ? `https://explorer.devnet.irys.network/address/${account}`
                      : `https://etherscan.io/address/${account}`;
                    window.open(explorerUrl, '_blank');
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  <ExternalLink size={16} className="mr-2" />
                  View on {isIrysNetwork ? 'Irys' : 'Block'} Explorer
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

      {/* Wallet Selector Modal */}
      <WalletSelector 
        isOpen={isWalletSelectorOpen} 
        onClose={() => setIsWalletSelectorOpen(false)} 
      />
    </div>
  );
}
