import { useState, useEffect, createContext, useContext } from "react";
import { ethers } from "ethers";

// Irys Network Configuration
export const IRYS_NETWORK_CONFIG = {
  chainId: '0x4F6', // 1270 in hex
  chainName: 'Irys Devnet',
  nativeCurrency: {
    name: 'IRYS',
    symbol: 'IRYS',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.devnet.irys.network'],
  blockExplorerUrls: ['https://explorer.devnet.irys.network'],
};

export const IRYS_MAINNET_CONFIG = {
  chainId: '0x4F7', // 1271 in hex  
  chainName: 'Irys Network',
  nativeCurrency: {
    name: 'IRYS',
    symbol: 'IRYS',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.irys.network'],
  blockExplorerUrls: ['https://explorer.irys.network'],
};

interface WalletContextType {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: string | null;
  isIrysNetwork: boolean;
  switchToIrys: () => Promise<boolean>;
  addIrysNetwork: () => Promise<boolean>;
  networkError: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    // Return a default implementation for standalone usage
    const [account, setAccount] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);
    const [isIrysNetwork, setIsIrysNetwork] = useState(false);
    const [networkError, setNetworkError] = useState<string | null>(null);

    useEffect(() => {
      checkConnection();

      if (window.ethereum) {
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
      }

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged,
          );
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }, []);

    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          const network = await provider.getNetwork();
          const currentChainId = '0x' + network.chainId.toString(16);

          setChainId(currentChainId);
          setIsIrysNetwork(currentChainId === IRYS_NETWORK_CONFIG.chainId || currentChainId === IRYS_MAINNET_CONFIG.chainId);

          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            setIsConnected(true);
            setProvider(provider);
            setSigner(await provider.getSigner());
            
            // Check if connected to Irys network
            if (currentChainId !== IRYS_NETWORK_CONFIG.chainId && currentChainId !== IRYS_MAINNET_CONFIG.chainId) {
              setNetworkError('Please switch to Irys Network for full functionality');
            } else {
              setNetworkError(null);
            }
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
          setNetworkError('Failed to connect to wallet');
        }
      }
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = async (chainId: string) => {
      setChainId(chainId);
      setIsIrysNetwork(chainId === IRYS_NETWORK_CONFIG.chainId || chainId === IRYS_MAINNET_CONFIG.chainId);
      
      if (chainId !== IRYS_NETWORK_CONFIG.chainId && chainId !== IRYS_MAINNET_CONFIG.chainId) {
        setNetworkError('Please switch to Irys Network for full functionality');
      } else {
        setNetworkError(null);
      }
      
      // Update provider and signer for new network
      if (window.ethereum && account) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          setSigner(await provider.getSigner());
        } catch (error) {
          console.error("Error updating provider after chain change:", error);
        }
      }
    };

    const addIrysNetwork = async (): Promise<boolean> => {
      if (!window.ethereum) {
        setNetworkError('MetaMask not detected');
        return false;
      }

      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [IRYS_NETWORK_CONFIG],
        });
        return true;
      } catch (error: any) {
        console.error('Failed to add Irys network:', error);
        setNetworkError('Failed to add Irys network: ' + error.message);
        return false;
      }
    };

    const switchToIrys = async (): Promise<boolean> => {
      if (!window.ethereum) {
        setNetworkError('MetaMask not detected');
        return false;
      }

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: IRYS_NETWORK_CONFIG.chainId }],
        });
        return true;
      } catch (error: any) {
        console.error('Failed to switch to Irys network:', error);
        
        // If network doesn't exist, try to add it
        if (error.code === 4902) {
          return await addIrysNetwork();
        }
        
        setNetworkError('Failed to switch to Irys network: ' + error.message);
        return false;
      }
    };

    const connect = async () => {
      if (!window.ethereum) {
        setNetworkError("Please install MetaMask or another Ethereum wallet");
        return;
      }

      try {
        setIsConnecting(true);
        setNetworkError(null);
        
        const provider = new ethers.BrowserProvider(window.ethereum);

        // Request account access
        await provider.send("eth_requestAccounts", []);

        const network = await provider.getNetwork();
        const currentChainId = '0x' + network.chainId.toString(16);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        setAccount(address);
        setIsConnected(true);
        setProvider(provider);
        setSigner(signer);
        setChainId(currentChainId);
        setIsIrysNetwork(currentChainId === IRYS_NETWORK_CONFIG.chainId || currentChainId === IRYS_MAINNET_CONFIG.chainId);

        // Show network warning if not on Irys
        if (currentChainId !== IRYS_NETWORK_CONFIG.chainId && currentChainId !== IRYS_MAINNET_CONFIG.chainId) {
          setNetworkError('Connected to unsupported network. Please switch to Irys Network.');
        }
      } catch (error: any) {
        console.error("Error connecting wallet:", error);
        setNetworkError('Failed to connect wallet: ' + error.message);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    };

    const disconnect = () => {
      setAccount(null);
      setIsConnected(false);
      setProvider(null);
      setSigner(null);
      setChainId(null);
      setIsIrysNetwork(false);
      setNetworkError(null);
    };

    return {
      account,
      isConnected,
      isConnecting,
      connect,
      disconnect,
      provider,
      signer,
      chainId,
      isIrysNetwork,
      switchToIrys,
      addIrysNetwork,
      networkError,
    };
  }
  return context;
}

// Make sure window.ethereum is properly typed
declare global {
  interface Window {
    ethereum?: any;
  }
}
