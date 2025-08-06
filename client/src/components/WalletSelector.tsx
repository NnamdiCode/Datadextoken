import { useState } from 'react';
import { Wallet, X, ExternalLink, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Button from './Button';
import { useWallet } from '../hooks/useWallet';
import { useToast } from '../hooks/use-toast';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  isInstalled: () => boolean;
  connect: () => Promise<void>;
  installUrl: string;
}

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletSelector({ isOpen, onClose }: WalletSelectorProps) {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const { connect: connectMetaMask } = useWallet();
  const { toast } = useToast();

  const wallets: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'The most popular Ethereum wallet',
      isInstalled: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask,
      connect: async () => {
        console.log("Attempting MetaMask connection...");
        
        if (!(window as any).ethereum?.isMetaMask) {
          throw new Error('MetaMask not detected. Please install MetaMask extension.');
        }
        
        try {
          await connectMetaMask();
          console.log("MetaMask connection successful");
        } catch (error: any) {
          console.error("MetaMask connection failed:", error);
          throw new Error(`MetaMask connection failed: ${error.message}`);
        }
      },
      installUrl: 'https://metamask.io/download/'
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Connect with Coinbase Wallet',
      isInstalled: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isCoinbaseWallet,
      connect: async () => {
        console.log("Attempting Coinbase Wallet connection...");
        
        if (!(window as any).ethereum?.isCoinbaseWallet) {
          throw new Error('Coinbase Wallet not detected. Please install Coinbase Wallet extension.');
        }
        
        try {
          await connectMetaMask();
          console.log("Coinbase Wallet connection successful");
        } catch (error: any) {
          console.error("Coinbase Wallet connection failed:", error);
          throw new Error(`Coinbase Wallet connection failed: ${error.message}`);
        }
      },
      installUrl: 'https://www.coinbase.com/wallet'
    },
    {
      id: 'browser',
      name: 'Browser Wallet',
      icon: '🌐',
      description: 'Connect with any installed Web3 wallet',
      isInstalled: () => typeof window !== 'undefined' && !!(window as any).ethereum,
      connect: async () => {
        console.log("Attempting Browser Wallet connection...");
        
        if (!(window as any).ethereum) {
          throw new Error('No wallet detected. Please install a Web3 wallet like MetaMask.');
        }
        
        try {
          await connectMetaMask();
          console.log("Browser Wallet connection successful");
        } catch (error: any) {
          console.error("Browser Wallet connection failed:", error);
          throw new Error(`Wallet connection failed: ${error.message}`);
        }
      },
      installUrl: ''
    }
  ];

  const handleWalletConnect = async (wallet: WalletOption) => {
    if (!wallet.isInstalled()) {
      if (wallet.installUrl) {
        window.open(wallet.installUrl, '_blank');
      }
      return;
    }

    try {
      setIsConnecting(wallet.id);
      console.log(`🔗 Attempting to connect ${wallet.name}...`);
      
      await wallet.connect();
      console.log(`✅ Successfully connected to ${wallet.name}`);
      onClose();
    } catch (error: any) {
      console.error(`❌ Failed to connect to ${wallet.name}:`, error);
      
      // Better error messaging for users
      let userMessage = error.message;
      if (error.code === 4001) {
        userMessage = 'Connection was rejected. Please try again and accept the connection request.';
      } else if (error.code === -32002) {
        userMessage = 'A connection request is already pending in your wallet. Please check your wallet.';
      } else if (error.message?.includes('User denied')) {
        userMessage = 'Connection was denied. Please accept the connection request in your wallet.';
      } else if (error.message?.includes('not detected')) {
        userMessage = `${wallet.name} wallet not detected. Please make sure it's installed and enabled.`;
      } else if (error.message?.includes('already processing')) {
        userMessage = 'Connection already in progress. Please check your wallet.';
      }
      
      // Use toast notification instead of alert
      toast({
        title: `Failed to connect to ${wallet.name}`,
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <Wallet className="w-5 h-5 text-primary" />
            <span>Choose Wallet</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-gray-400 text-sm">
            Choose your preferred wallet to connect to DataSwap and start trading data tokens.
          </p>

          <div className="space-y-3">
            {wallets.map((wallet) => {
              const isInstalled = wallet.isInstalled();
              const isCurrentlyConnecting = isConnecting === wallet.id;
              
              return (
                <button
                  key={wallet.id}
                  onClick={() => handleWalletConnect(wallet)}
                  disabled={isCurrentlyConnecting}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                    isInstalled
                      ? 'border-gray-600 hover:border-primary hover:bg-white/5'
                      : 'border-gray-700 bg-gray-800/50'
                  } ${isCurrentlyConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="text-left">
                      <div className="font-medium text-white">{wallet.name}</div>
                      <div className="text-xs text-gray-400">{wallet.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isInstalled ? (
                      <CheckCircle className="text-green-400" size={16} />
                    ) : (
                      <ExternalLink className="text-gray-400" size={16} />
                    )}
                    {isCurrentlyConnecting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">ℹ️</span>
              <div className="text-xs text-blue-200">
                <p className="font-medium mb-1">Irys Network Required</p>
                <p>DataSwap operates on Irys Network. You'll be prompted to switch networks after connecting.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}