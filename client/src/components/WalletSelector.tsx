import { useState } from 'react';
import { Wallet, X, ExternalLink, CheckCircle } from 'lucide-react';
import Button from './Button';
import { useWallet } from '../hooks/useWallet';

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

  const wallets: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'The most popular Ethereum wallet',
      isInstalled: () => !!(window as any).ethereum?.isMetaMask,
      connect: async () => {
        await connectMetaMask();
      },
      installUrl: 'https://metamask.io/download/'
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Connect with Coinbase Wallet',
      isInstalled: () => !!(window as any).ethereum?.isCoinbaseWallet,
      connect: async () => {
        // For Coinbase Wallet, we can still use the same ethereum provider
        if ((window as any).ethereum?.isCoinbaseWallet) {
          await connectMetaMask();
        } else {
          throw new Error('Coinbase Wallet not detected');
        }
      },
      installUrl: 'https://www.coinbase.com/wallet'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect with mobile wallets',
      isInstalled: () => true, // WalletConnect is always available
      connect: async () => {
        // For now, fallback to MetaMask provider
        // In a real implementation, you'd use WalletConnect SDK
        throw new Error('WalletConnect integration coming soon');
      },
      installUrl: 'https://walletconnect.com/'
    },
    {
      id: 'injected',
      name: 'Browser Wallet',
      icon: '🌐',
      description: 'Use any injected wallet provider',
      isInstalled: () => !!(window as any).ethereum,
      connect: async () => {
        await connectMetaMask();
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
      await wallet.connect();
      onClose();
    } catch (error: any) {
      console.error(`Failed to connect to ${wallet.name}:`, error);
      alert(`Failed to connect to ${wallet.name}: ${error.message}`);
    } finally {
      setIsConnecting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-6">
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

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 mt-0.5">ℹ️</span>
            <div className="text-xs text-blue-200">
              <p className="font-medium mb-1">Irys Network Required</p>
              <p>For full functionality, ensure you're connected to Irys Network (Chain ID: 1270). The app will help you switch networks after connecting.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}