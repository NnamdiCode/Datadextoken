import { useState, useEffect } from 'react';
import { AlertTriangle, X, Network, CheckCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import Button from './Button';

const NETWORK_POPUP_DISMISSED_KEY = 'dataswap_network_popup_dismissed';

export default function NetworkStatus() {
  const [isVisible, setIsVisible] = useState(false);
  const { isConnected, isIrysNetwork, switchToIrys, chainId, networkError } = useWallet();

  useEffect(() => {
    // Check if user has previously dismissed the popup
    const isDismissed = localStorage.getItem(NETWORK_POPUP_DISMISSED_KEY) === 'true';
    
    // Only show if user is connected, not on Irys network, and hasn't dismissed before
    setIsVisible(isConnected && !isIrysNetwork && !isDismissed && !!chainId);
  }, [isConnected, isIrysNetwork, chainId]);

  const handleDismiss = () => {
    localStorage.setItem(NETWORK_POPUP_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  // Don't show if not visible based on conditions above
  if (!isVisible) {
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
      handleDismiss(); // Hide and remember dismissal after successful switch
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
                You're connected to {getNetworkName(chainId || '')}. For full DataSwap functionality, please switch to Irys Network.
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
                  onClick={handleDismiss}
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  Don't show again
                </Button>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-yellow-400 hover:text-yellow-300 ml-2"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}