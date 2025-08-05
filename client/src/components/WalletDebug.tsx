import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';

interface WalletDebugInfo {
  hasWindow: boolean;
  hasEthereum: boolean;
  isMetaMask: boolean;
  isCoinbase: boolean;
  provider: string | null;
  accounts: string[];
  chainId: string | null;
  networkId: string | null;
  isConnected: boolean;
  error: string | null;
}

export default function WalletDebug() {
  const [debugInfo, setDebugInfo] = useState<WalletDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const diagnoseWallet = async () => {
    setIsLoading(true);
    
    try {
      const info: WalletDebugInfo = {
        hasWindow: typeof window !== 'undefined',
        hasEthereum: false,
        isMetaMask: false,
        isCoinbase: false,
        provider: null,
        accounts: [],
        chainId: null,
        networkId: null,
        isConnected: false,
        error: null,
      };

      if (typeof window !== 'undefined') {
        info.hasEthereum = !!(window as any).ethereum;
        
        if ((window as any).ethereum) {
          const ethereum = (window as any).ethereum;
          info.isMetaMask = !!ethereum.isMetaMask;
          info.isCoinbase = !!ethereum.isCoinbaseWallet;
          
          // Determine provider type
          if (ethereum.isMetaMask) {
            info.provider = 'MetaMask';
          } else if (ethereum.isCoinbaseWallet) {
            info.provider = 'Coinbase Wallet';
          } else {
            info.provider = 'Unknown Web3 Provider';
          }

          try {
            // Try to get accounts (won't trigger permission request)
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            info.accounts = accounts || [];
            info.isConnected = accounts && accounts.length > 0;

            if (info.isConnected) {
              // Get network info
              const chainId = await ethereum.request({ method: 'eth_chainId' });
              const networkId = await ethereum.request({ method: 'net_version' });
              info.chainId = chainId;
              info.networkId = networkId;
            }
          } catch (error: any) {
            info.error = error.message || 'Failed to query wallet';
          }
        }
      }

      setDebugInfo(info);
    } catch (error: any) {
      setDebugInfo({
        hasWindow: typeof window !== 'undefined',
        hasEthereum: false,
        isMetaMask: false,
        isCoinbase: false,
        provider: null,
        accounts: [],
        chainId: null,
        networkId: null,
        isConnected: false,
        error: error.message || 'Diagnosis failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    diagnoseWallet();
  }, []);

  const StatusIcon = ({ condition }: { condition: boolean }) => (
    condition ? (
      <CheckCircle className="text-green-500" size={16} />
    ) : (
      <XCircle className="text-red-500" size={16} />
    )
  );

  if (!debugInfo) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="animate-spin" size={20} />
            Diagnosing Wallet...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Info size={20} />
            Wallet Debug Information
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={diagnoseWallet}
            disabled={isLoading}
          >
            <RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Browser Environment</span>
            <div className="flex items-center gap-2">
              <StatusIcon condition={debugInfo.hasWindow} />
              <Badge variant={debugInfo.hasWindow ? 'default' : 'destructive'}>
                {debugInfo.hasWindow ? 'Available' : 'Not Available'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-300">Web3 Provider</span>
            <div className="flex items-center gap-2">
              <StatusIcon condition={debugInfo.hasEthereum} />
              <Badge variant={debugInfo.hasEthereum ? 'default' : 'destructive'}>
                {debugInfo.hasEthereum ? 'Detected' : 'Not Found'}
              </Badge>
            </div>
          </div>

          {debugInfo.hasEthereum && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Provider Type</span>
                <Badge variant="outline">
                  {debugInfo.provider || 'Unknown'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">MetaMask</span>
                <div className="flex items-center gap-2">
                  <StatusIcon condition={debugInfo.isMetaMask} />
                  <Badge variant={debugInfo.isMetaMask ? 'default' : 'secondary'}>
                    {debugInfo.isMetaMask ? 'Detected' : 'Not Detected'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Coinbase Wallet</span>
                <div className="flex items-center gap-2">
                  <StatusIcon condition={debugInfo.isCoinbase} />
                  <Badge variant={debugInfo.isCoinbase ? 'default' : 'secondary'}>
                    {debugInfo.isCoinbase ? 'Detected' : 'Not Detected'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Connection Status</span>
                <div className="flex items-center gap-2">
                  <StatusIcon condition={debugInfo.isConnected} />
                  <Badge variant={debugInfo.isConnected ? 'default' : 'secondary'}>
                    {debugInfo.isConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
              </div>

              {debugInfo.isConnected && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Accounts</span>
                    <Badge variant="outline">
                      {debugInfo.accounts.length} account(s)
                    </Badge>
                  </div>

                  {debugInfo.chainId && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Chain ID</span>
                      <Badge variant="outline">
                        {debugInfo.chainId} ({parseInt(debugInfo.chainId, 16)})
                      </Badge>
                    </div>
                  )}

                  {debugInfo.networkId && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Network ID</span>
                      <Badge variant="outline">
                        {debugInfo.networkId}
                      </Badge>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {debugInfo.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">
                <strong>Error:</strong> {debugInfo.error}
              </p>
            </div>
          )}

          {!debugInfo.hasEthereum && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                <strong>No Web3 Wallet Detected:</strong> Please install MetaMask or another Web3 wallet extension to connect.
              </p>
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-300 underline hover:text-yellow-200 text-sm"
              >
                Download MetaMask →
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}