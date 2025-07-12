import { useState } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react';
import Button from './Button';
import GlassCard from './GlassCard';
import { useWallet } from '../hooks/useWallet';
import { useToast } from '../hooks/use-toast';

export default function WalletConnect() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { account, isConnected, isConnecting, connect, disconnect } = useWallet();
  const { toast } = useToast();

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
        {formatAddress(account!)}
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
            <GlassCard className="p-4 min-w-64">
              <div className="space-y-3">
                <div className="border-b border-white/10 pb-3">
                  <p className="text-sm text-gray-400 mb-1">Connected Account</p>
                  <p className="font-mono text-sm text-white">{account}</p>
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
                    window.open(`https://etherscan.io/address/${account}`, '_blank');
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  <ExternalLink size={16} className="mr-2" />
                  View on Explorer
                </button>

                <div className="border-t border-white/10 pt-3">
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
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
