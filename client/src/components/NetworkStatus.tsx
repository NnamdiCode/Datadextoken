import { useState } from 'react';
import { AlertTriangle, X, Network, CheckCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import Button from './Button';

export default function NetworkStatus() {
  const [isVisible, setIsVisible] = useState(true);
  const { isConnected, isIrysNetwork, switchToIrys, chainId, networkError } = useWallet();

  // Don't show if wallet not connected, already on Irys network, or user dismissed
  if (!isConnected || isIrysNetwork || !isVisible || !chainId) {
    return null;
  }

  const getNetworkName = (chainId: string) => {
    switch (chainId) {
      case '0x1':
        return 'Ethereum Mainnet';
      case '0x89':
        return 'Polygon';
      case '0xaa36a7':
        return 'Ethereum Sepolia';
      default:
        return 'Unknown Network';
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToIrys();
      setIsVisible(false); // Hide after successful switch
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 max-w-md mx-auto p-4">
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-yellow-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-400 mb-1">
                Network Compatibility Notice
              </h3>
              <p className="text-xs text-yellow-200 mb-3">
                You're connected to {getNetworkName(chainId)}. For full DataSwap functionality, please switch to Irys Network.
              </p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleSwitchNetwork}
                  icon={<Network size={14} />}
                  className="bg-yellow-500 text-black hover:bg-yellow-400"
                >
                  Switch to Irys
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsVisible(false)}
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-yellow-400 hover:text-yellow-300 ml-2"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}