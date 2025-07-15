import { useState, useEffect, createContext, useContext } from "react";
import { ethers } from "ethers";

interface WalletContextType {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    // Return a default implementation for standalone usage
    const [account, setAccount] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(
      null,
    );
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

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

          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            setIsConnected(true);
            setProvider(provider);
            setSigner(await provider.getSigner());
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
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

    const handleChainChanged = () => {
      window.location.reload();
    };

    const connect = async () => {
      if (!window.ethereum) {
        alert("Please install MetaMask or another Ethereum wallet");
        return;
      }

      try {
        setIsConnecting(true);
        const provider = new ethers.BrowserProvider(window.ethereum);

        // Request account access
        await provider.send("eth_requestAccounts", []);

        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        setAccount(address);
        setIsConnected(true);
        setProvider(provider);
        setSigner(signer);
      } catch (error) {
        console.error("Error connecting wallet:", error);
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
    };

    return {
      account,
      isConnected,
      isConnecting,
      connect,
      disconnect,
      provider,
      signer,
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
