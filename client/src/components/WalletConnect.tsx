import { useState } from 'react';
import { Wallet, ChevronDown } from 'lucide-react';
import Button from './Button';
import WalletModal from './WalletModal';
import { useWallet } from '../hooks/useWallet';

export default function WalletConnect() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { account, isConnected, isConnecting, isIrysNetwork } = useWallet();

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

  return (
    <>
      {!isConnected ? (
        <Button
          onClick={() => setIsWalletModalOpen(true)}
          icon={<Wallet size={16} />}
          disabled={isConnecting}
          className="glossy-button"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      ) : (
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsWalletModalOpen(true)}
            className="glossy-button flex items-center space-x-2"
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isIrysNetwork ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="font-mono text-sm">
                {formatAddress(account!)}
              </span>

              <ChevronDown size={14} />
            </div>
          </Button>
        </div>
      )}

      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}