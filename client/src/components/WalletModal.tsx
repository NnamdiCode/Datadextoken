import { useState, useEffect } from 'react';
import { X, Wallet, Network, Info, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import WalletSelector from './WalletSelector';
import { useWallet } from '../hooks/useWallet';
import { useToast } from '../hooks/use-toast';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const { 
    account, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    chainId, 
    isIrysNetwork, 
    switchToIrys, 
    addIrysNetwork, 
    networkError
  } = useWallet();
  const { toast } = useToast();

  // Fetch balance when wallet is connected and on Irys network
  useEffect(() => {
    if (isConnected && account && isIrysNetwork) {
      fetchBalance();
    }
  }, [isConnected, account, isIrysNetwork]);

  const fetchBalance = async () => {
    if (!account) return;
    
    try {
      const response = await fetch('/api/irys/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || '0');
      }
    } catch (error) {
      console.error('Error fetching IRYS balance:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balanceStr: string | null) => {
    if (!balanceStr) return '0.0000';
    const balance = parseFloat(balanceStr);
    if (balance >= 1) {
      return `${balance.toFixed(4)} IRYS`;
    } else {
      return `${(balance * 1000).toFixed(2)} mIRYS`;
    }
  };

  const getNetworkName = (chainId: string | null) => {
    switch (chainId) {
      case '0x4F6':
        return 'Irys Testnet';
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

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast({ title: 'Address copied to clipboard' });
    }
  };

  const handleRefreshBalance = async () => {
    setIsLoadingBalance(true);
    await fetchBalance();
    setIsLoadingBalance(false);
  };

  const handleConnect = () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      toast({
        title: 'No wallet detected',
        description: 'Please install MetaMask or another Web3 wallet extension',
        variant: 'destructive'
      });
      return;
    }
    setIsWalletSelectorOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-white">
              <Wallet className="w-5 h-5" />
              <span>Wallet Manager</span>
            </DialogTitle>
          </DialogHeader>

          {!isConnected ? (
            // Connection Interface
            <div className="space-y-6 p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Connect Your Wallet</h3>
                  <p className="text-gray-400">Connect to Irys Testnet to start trading data tokens</p>
                </div>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>

              {networkError && (
                <div className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded border border-red-400/20">
                  {networkError}
                </div>
              )}

              {typeof window !== 'undefined' && !(window as any).ethereum && (
                <div className="text-xs text-yellow-400 bg-yellow-400/10 px-3 py-2 rounded border border-yellow-400/20">
                  No Web3 wallet detected. Install{' '}
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300">
                    MetaMask
                  </a>{' '}
                  to continue.
                </div>
              )}
            </div>
          ) : (
            // Connected Wallet Interface
            <div className="space-y-6 p-6">
              {/* Wallet Info */}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Wallet Address:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-mono">
                        {account ? formatAddress(account) : '--'}
                      </span>
                      <Button
                        onClick={handleCopyAddress}
                        variant="ghost"
                        size="sm"
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Network:</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isIrysNetwork ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span className="text-white">{getNetworkName(chainId)}</span>
                    </div>
                  </div>
                </div>

                {isIrysNetwork && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">IRYS Balance:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-mono">
                          {formatBalance(balance)}
                        </span>
                        <Button
                          onClick={handleRefreshBalance}
                          variant="ghost"
                          size="sm"
                          disabled={isLoadingBalance}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Network Management */}
              {!isIrysNetwork && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Network className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-yellow-400 font-medium">Switch to Irys Network</h4>
                      <p className="text-sm text-gray-300 mt-1">
                        Connect to Irys Testnet for full functionality
                      </p>
                      <Button
                        onClick={handleSwitchNetwork}
                        className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-black"
                        size="sm"
                      >
                        Switch Network
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                {account && (
                  <a
                    href={`https://testnet-explorer.irys.xyz/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg p-3 text-blue-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">Explorer</span>
                  </a>
                )}
                
                <a
                  href="https://irys.xyz/faucet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg p-3 text-purple-400 transition-colors"
                >
                  <span className="text-sm">💧</span>
                  <span className="text-sm">Faucet</span>
                </a>
              </div>

              {/* Network Configuration */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Network Configuration
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chain ID:</span>
                    <span className="text-white font-mono">1270 (0x4F6)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">RPC URL:</span>
                    <span className="text-white font-mono text-xs">testnet-rpc.irys.xyz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Currency:</span>
                    <span className="text-white font-mono">IRYS</span>
                  </div>
                </div>
              </div>

              {/* Disconnect Button */}
              <Button
                onClick={disconnect}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Disconnect Wallet
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <WalletSelector 
        isOpen={isWalletSelectorOpen}
        onClose={() => setIsWalletSelectorOpen(false)}
      />
    </>
  );
}