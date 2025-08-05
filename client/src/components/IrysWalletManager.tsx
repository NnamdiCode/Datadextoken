import React, { useState, useEffect } from 'react';
import { Network, Wallet, Coins, ExternalLink, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useWallet, IRYS_TESTNET_CONFIG } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface IrysWalletManagerProps {
  className?: string;
  showNetworkInfo?: boolean;
  compact?: boolean;
}

/**
 * Enhanced Irys Wallet Manager component inspired by the Irys POC
 * Features:
 * - Automatic network detection and switching
 * - Enhanced balance display with formatting 
 * - Better error handling and user feedback
 * - Network configuration management
 * - Faucet and explorer links integration
 */
export function IrysWalletManager({ 
  className = "", 
  showNetworkInfo = false, 
  compact = false 
}: IrysWalletManagerProps) {
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
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [networkAdded, setNetworkAdded] = useState(false);

  // Enhanced balance fetching with proper error handling
  const getBalance = async (address?: string) => {
    const targetAddress = address || account;
    if (!targetAddress || !window.ethereum || !isIrysNetwork) return;

    try {
      setIsLoadingBalance(true);
      const balanceWei = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [targetAddress, 'latest']
      });

      // Convert from Wei to IRYS (divide by 10^18)
      const balanceIrys = parseInt(balanceWei, 16) / Math.pow(10, 18);
      setBalance(balanceIrys);
    } catch (err) {
      console.error('Error fetching balance:', err);
      toast({
        title: 'Balance fetch failed',
        description: 'Unable to fetch IRYS balance. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Enhanced network addition with better UX
  const handleAddIrysNetwork = async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask not detected',
        description: 'Please install MetaMask to continue.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [IRYS_TESTNET_CONFIG]
      });
      setNetworkAdded(true);
      toast({
        title: 'Network added successfully!',
        description: 'Irys Testnet has been added to MetaMask.',
      });
      return true;
    } catch (err: any) {
      console.error('Error adding network:', err);
      if (err.code === 4001) {
        toast({
          title: 'Network addition rejected',
          description: 'User rejected the request to add Irys Testnet.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Failed to add network',
          description: 'Unable to add Irys Testnet to MetaMask.',
          variant: 'destructive'
        });
      }
      return false;
    }
  };

  // Enhanced network switching
  const handleSwitchToIrysNetwork = async () => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: IRYS_TESTNET_CONFIG.chainId }]
      });
      return true;
    } catch (err: any) {
      console.error('Error switching network:', err);
      if (err.code === 4902) {
        // Network not added yet, try to add it
        return await handleAddIrysNetwork();
      } else if (err.code === 4001) {
        toast({
          title: 'Network switch rejected',
          description: 'User rejected the request to switch to Irys Testnet.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Failed to switch network',
          description: 'Unable to switch to Irys Testnet.',
          variant: 'destructive'
        });
      }
      return false;
    }
  };

  // Enhanced wallet connection with automatic network handling
  const handleConnect = async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask not detected',
        description: 'Please install MetaMask browser extension to continue.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await connect();
      
      // After connection, check if we're on the right network
      if (!isIrysNetwork) {
        const switched = await handleSwitchToIrysNetwork();
        if (switched) {
          toast({
            title: 'Connected to Irys Testnet!',
            description: 'Your wallet is now connected and ready to use.',
          });
        }
      } else {
        toast({
          title: 'Wallet connected!',
          description: 'Successfully connected to Irys Testnet.',
        });
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      toast({
        title: 'Connection failed',
        description: err.message || 'Failed to connect wallet.',
        variant: 'destructive'
      });
    }
  };

  // Auto-fetch balance when connected and on Irys network
  useEffect(() => {
    if (isConnected && account && isIrysNetwork) {
      getBalance();
    } else {
      setBalance(null);
    }
  }, [isConnected, account, isIrysNetwork]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: number) => {
    if (bal >= 1) {
      return `${bal.toFixed(6)} IRYS`;
    } else {
      return `${(bal * 1000).toFixed(3)} mIRYS`;
    }
  };

  // Compact version for header
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {!isConnected ? (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isConnecting ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Wallet className="w-4 h-4 mr-2" />
            )}
            Connect
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            {!isIrysNetwork && (
              <Button
                onClick={handleSwitchToIrysNetwork}
                size="sm"
                variant="outline"
                className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
              >
                <Network className="w-4 h-4 mr-1" />
                Switch to Irys
              </Button>
            )}
            
            <div className="flex items-center bg-white/5 rounded-lg px-3 py-1.5">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isIrysNetwork ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-sm font-medium">
                  {account ? formatAddress(account) : '--'}
                </span>
                {balance !== null && isIrysNetwork && (
                  <span className="text-sm text-primary">
                    {formatBalance(balance)}
                  </span>
                )}
              </div>
              <Button
                onClick={disconnect}
                size="sm"
                variant="ghost"
                className="ml-2 h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full version for dedicated pages
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Network Status Alert */}
      {networkError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{networkError}</span>
          </div>
        </div>
      )}

      {/* MetaMask Detection */}
      {typeof window !== 'undefined' && !window.ethereum && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-300 font-medium">MetaMask is not installed</span>
          </div>
          <p className="text-yellow-200 text-sm">
            Please install MetaMask to continue.{' '}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-yellow-100"
            >
              Download here
            </a>
          </p>
        </div>
      )}

      {/* Network Information */}
      {showNetworkInfo && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="flex items-center font-semibold text-white mb-3">
            <Network className="w-5 h-5 mr-2" />
            Network Configuration
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Network Name:</span>
              <span className="text-white ml-2">Irys Testnet</span>
            </div>
            <div>
              <span className="text-gray-400">Chain ID:</span>
              <span className="text-white ml-2">1270</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">RPC URL:</span>
              <span className="text-white ml-2 break-all text-xs">
                https://testnet-rpc.irys.xyz/v1/execution-rpc
              </span>
            </div>
            <div>
              <span className="text-gray-400">Symbol:</span>
              <span className="text-white ml-2">IRYS</span>
            </div>
            <div>
              <span className="text-gray-400">Decimals:</span>
              <span className="text-white ml-2">18</span>
            </div>
          </div>
        </div>
      )}

      {/* Connection Section */}
      {!isConnected ? (
        <div className="text-center space-y-4">
          <div className="space-y-3">
            <Button
              onClick={handleAddIrysNetwork}
              disabled={isConnecting || !window.ethereum}
              variant="outline"
              className="w-full"
            >
              <Network className="w-5 h-5 mr-2" />
              Add Irys Network to MetaMask
            </Button>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting || !window.ethereum}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            {isConnecting ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Wallet className="w-5 h-5 mr-2" />
            )}
            Connect MetaMask Wallet
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Status */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-medium">Connected</span>
              </div>
              <Button
                onClick={disconnect}
                size="sm"
                variant="ghost"
                className="text-green-300 hover:text-green-200"
              >
                Disconnect
              </Button>
            </div>
          </div>

          {/* Wallet Information */}
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Wallet Address:</span>
                <span className="text-white font-mono">
                  {account ? formatAddress(account) : '--'}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-gray-400">
                  <Coins className="w-4 h-4 mr-2" />
                  Balance:
                </span>
                <div className="text-right">
                  {balance !== null && isIrysNetwork ? (
                    <div>
                      <div className="text-white font-semibold text-lg">
                        {formatBalance(balance)}
                      </div>
                      {balance < 1 && (
                        <div className="text-gray-400 text-sm">
                          {balance.toFixed(6)} IRYS
                        </div>
                      )}
                    </div>
                  ) : isLoadingBalance ? (
                    <div className="w-16 h-4 bg-gray-600 rounded animate-pulse" />
                  ) : !isIrysNetwork ? (
                    <span className="text-yellow-400 text-sm">Switch to Irys Testnet</span>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={() => getBalance()}
                disabled={isLoadingBalance || !isIrysNetwork}
                variant="outline"
                className="flex-1"
              >
                {isLoadingBalance ? 'Refreshing...' : 'Refresh Balance'}
              </Button>

              {account && (
                <a
                  href={`https://testnet-explorer.irys.xyz/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Links */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex justify-center space-x-6 text-sm">
          <a
            href="https://irys.xyz/faucet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Coins className="w-4 h-4 mr-1" />
            Get Testnet Tokens
          </a>
          <a
            href="https://testnet-explorer.irys.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Testnet Explorer
          </a>
          <a
            href="https://docs.irys.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
}

export default IrysWalletManager;