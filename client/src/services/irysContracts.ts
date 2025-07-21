import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';

// Irys VM Contract Addresses - These would be deployed contracts on Irys VM
export const IRYS_CONTRACT_ADDRESSES = {
  DATA_REGISTRY: '0x1234567890123456789012345678901234567890', // Replace with actual deployed address
  DATA_AMM: '0x2345678901234567890123456789012345678901', // Replace with actual deployed address
  DATA_MARKETPLACE: '0x3456789012345678901234567890123456789012', // Replace with actual deployed address
  IRYS_TOKEN: '0x4567890123456789012345678901234567890123', // Native IRYS token on Irys VM
} as const;

// Simplified ABIs for Irys VM contracts
const IRYS_DATA_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address, uint256) returns (bool)",
  "function approve(address, uint256) returns (bool)",
  "function creator() view returns (address)",
  "function dataHash() view returns (string)",
  "function metadata() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const IRYS_REGISTRY_ABI = [
  "function createDataToken(string name, string symbol, string dataHash, string metadata) returns (address)",
  "function getTokensByCreator(address creator) view returns (address[])",
  "function getAllTokens() view returns (address[])",
  "function isValidToken(address token) view returns (bool)",
  "event DataTokenCreated(address indexed token, string dataHash, address indexed creator, uint256 timestamp)"
];

const IRYS_AMM_ABI = [
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) returns (uint256 amountOut)",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) returns (uint256 liquidity)",
  "function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256 amountOut)",
  "function getReserves(address tokenA, address tokenB) view returns (uint256 reserveA, uint256 reserveB)",
  "function pools(address tokenA, address tokenB) view returns (uint256 reserveA, uint256 reserveB, uint256 totalLiquidity)",
  "event Swap(address indexed trader, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 timestamp)",
  "event LiquidityAdded(address indexed provider, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity)"
];

export interface IrysTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  type: 'token_creation' | 'swap' | 'liquidity_add' | 'liquidity_remove' | 'transfer';
  data?: any;
}

export class IrysContractsService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor(provider?: ethers.BrowserProvider, signer?: ethers.JsonRpcSigner) {
    this.provider = provider || null;
    this.signer = signer || null;
  }

  private getContract(address: string, abi: string[], withSigner = false) {
    if (!this.provider) {
      throw new Error('Provider not available - please connect wallet');
    }
    
    if (withSigner && !this.signer) {
      throw new Error('Signer not available - transaction requires signature');
    }

    return new ethers.Contract(
      address,
      abi,
      withSigner ? this.signer : this.provider
    );
  }

  // Data Token Creation on Irys VM
  async createDataToken(
    name: string,
    symbol: string,
    dataHash: string,
    metadata: string
  ): Promise<{ tokenAddress: string; transactionHash: string; irysTransaction: IrysTransaction }> {
    const registry = this.getContract(IRYS_CONTRACT_ADDRESSES.DATA_REGISTRY, IRYS_REGISTRY_ABI, true);
    
    try {
      // Execute transaction on Irys VM
      const tx = await registry.createDataToken(name, symbol, dataHash, metadata);
      const receipt = await tx.wait();
      
      // Parse the event to get token address
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = registry.interface.parseLog(log);
          return parsed?.name === 'DataTokenCreated';
        } catch {
          return false;
        }
      });
      
      if (!event) {
        throw new Error('DataTokenCreated event not found in transaction receipt');
      }
      
      const parsedEvent = registry.interface.parseLog(event);
      const tokenAddress = parsedEvent?.args[0];
      
      // Create Irys transaction record
      const irysTransaction: IrysTransaction = {
        hash: tx.hash,
        from: await this.signer!.getAddress(),
        to: IRYS_CONTRACT_ADDRESSES.DATA_REGISTRY,
        value: '0',
        gasUsed: receipt.gasUsed.toString(),
        status: 'success',
        timestamp: Date.now(),
        type: 'token_creation',
        data: {
          name,
          symbol,
          dataHash,
          tokenAddress,
          metadata: JSON.parse(metadata)
        }
      };
      
      // Store transaction in backend
      await this.recordTransaction(irysTransaction);
      
      return {
        tokenAddress,
        transactionHash: tx.hash,
        irysTransaction
      };
    } catch (error: any) {
      console.error('Failed to create data token on Irys VM:', error);
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }

  // Token Swap on Irys VM
  async executeSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string
  ): Promise<{ amountOut: string; transactionHash: string; irysTransaction: IrysTransaction }> {
    const amm = this.getContract(IRYS_CONTRACT_ADDRESSES.DATA_AMM, IRYS_AMM_ABI, true);
    
    try {
      // First approve token if needed
      if (tokenIn !== IRYS_CONTRACT_ADDRESSES.IRYS_TOKEN) {
        await this.approveToken(tokenIn, IRYS_CONTRACT_ADDRESSES.DATA_AMM, amountIn);
      }
      
      // Execute swap on Irys VM
      const tx = await amm.swap(
        tokenIn,
        tokenOut,
        ethers.parseUnits(amountIn, 18),
        ethers.parseUnits(minAmountOut, 18)
      );
      
      const receipt = await tx.wait();
      
      // Parse swap event
      const swapEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = amm.interface.parseLog(log);
          return parsed?.name === 'Swap';
        } catch {
          return false;
        }
      });
      
      let amountOut = '0';
      if (swapEvent) {
        const parsedEvent = amm.interface.parseLog(swapEvent);
        amountOut = ethers.formatUnits(parsedEvent?.args[4] || 0, 18);
      }
      
      // Create Irys transaction record
      const irysTransaction: IrysTransaction = {
        hash: tx.hash,
        from: await this.signer!.getAddress(),
        to: IRYS_CONTRACT_ADDRESSES.DATA_AMM,
        value: tokenIn === IRYS_CONTRACT_ADDRESSES.IRYS_TOKEN ? amountIn : '0',
        gasUsed: receipt.gasUsed.toString(),
        status: 'success',
        timestamp: Date.now(),
        type: 'swap',
        data: {
          tokenIn,
          tokenOut,
          amountIn,
          amountOut,
          minAmountOut
        }
      };
      
      await this.recordTransaction(irysTransaction);
      
      return {
        amountOut,
        transactionHash: tx.hash,
        irysTransaction
      };
    } catch (error: any) {
      console.error('Failed to execute swap on Irys VM:', error);
      throw new Error(`Swap failed: ${error.message}`);
    }
  }

  // Add Liquidity on Irys VM
  async addLiquidity(
    tokenA: string,
    tokenB: string,
    amountA: string,
    amountB: string
  ): Promise<{ liquidity: string; transactionHash: string; irysTransaction: IrysTransaction }> {
    const amm = this.getContract(IRYS_CONTRACT_ADDRESSES.DATA_AMM, IRYS_AMM_ABI, true);
    
    try {
      // Approve both tokens
      await Promise.all([
        this.approveToken(tokenA, IRYS_CONTRACT_ADDRESSES.DATA_AMM, amountA),
        this.approveToken(tokenB, IRYS_CONTRACT_ADDRESSES.DATA_AMM, amountB),
      ]);
      
      const tx = await amm.addLiquidity(
        tokenA,
        tokenB,
        ethers.parseUnits(amountA, 18),
        ethers.parseUnits(amountB, 18)
      );
      
      const receipt = await tx.wait();
      
      // Parse liquidity event
      const liquidityEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = amm.interface.parseLog(log);
          return parsed?.name === 'LiquidityAdded';
        } catch {
          return false;
        }
      });
      
      let liquidity = '0';
      if (liquidityEvent) {
        const parsedEvent = amm.interface.parseLog(liquidityEvent);
        liquidity = ethers.formatUnits(parsedEvent?.args[5] || 0, 18);
      }
      
      const irysTransaction: IrysTransaction = {
        hash: tx.hash,
        from: await this.signer!.getAddress(),
        to: IRYS_CONTRACT_ADDRESSES.DATA_AMM,
        value: '0',
        gasUsed: receipt.gasUsed.toString(),
        status: 'success',
        timestamp: Date.now(),
        type: 'liquidity_add',
        data: {
          tokenA,
          tokenB,
          amountA,
          amountB,
          liquidity
        }
      };
      
      await this.recordTransaction(irysTransaction);
      
      return {
        liquidity,
        transactionHash: tx.hash,
        irysTransaction
      };
    } catch (error: any) {
      console.error('Failed to add liquidity on Irys VM:', error);
      throw new Error(`Add liquidity failed: ${error.message}`);
    }
  }

  // Get token information from Irys VM
  async getTokenInfo(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    totalSupply: string;
    dataHash: string;
    metadata: string;
    creator: string;
  } | null> {
    try {
      const token = this.getContract(tokenAddress, IRYS_DATA_TOKEN_ABI);
      
      const [name, symbol, totalSupply, dataHash, metadata, creator] = await Promise.all([
        token.name(),
        token.symbol(),
        token.totalSupply(),
        token.dataHash(),
        token.metadata(),
        token.creator(),
      ]);
      
      return {
        name,
        symbol,
        totalSupply: totalSupply.toString(),
        dataHash,
        metadata,
        creator,
      };
    } catch (error) {
      console.error('Failed to get token info from Irys VM:', error);
      return null;
    }
  }

  // Get all user transactions from Irys VM
  async getUserTransactions(userAddress: string): Promise<IrysTransaction[]> {
    try {
      const response = await fetch(`/api/transactions/irys/${userAddress}`);
      if (response.ok) {
        const data = await response.json();
        return data.transactions || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch user transactions from Irys VM:', error);
      return [];
    }
  }

  // Helper methods
  private async approveToken(tokenAddress: string, spender: string, amount: string): Promise<void> {
    if (tokenAddress === IRYS_CONTRACT_ADDRESSES.IRYS_TOKEN) {
      return; // Native IRYS doesn't need approval
    }
    
    const token = this.getContract(tokenAddress, IRYS_DATA_TOKEN_ABI, true);
    const tx = await token.approve(spender, ethers.parseUnits(amount, 18));
    await tx.wait();
  }

  private async recordTransaction(transaction: IrysTransaction): Promise<void> {
    try {
      await fetch('/api/transactions/irys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });
    } catch (error) {
      console.error('Failed to record Irys transaction:', error);
    }
  }

  // Get AMM pool reserves
  async getPoolReserves(tokenA: string, tokenB: string): Promise<{
    reserveA: string;
    reserveB: string;
    totalLiquidity: string;
  } | null> {
    try {
      const amm = this.getContract(IRYS_CONTRACT_ADDRESSES.DATA_AMM, IRYS_AMM_ABI);
      const [reserveA, reserveB] = await amm.getReserves(tokenA, tokenB);
      const poolData = await amm.pools(tokenA, tokenB);
      
      return {
        reserveA: ethers.formatUnits(reserveA, 18),
        reserveB: ethers.formatUnits(reserveB, 18),
        totalLiquidity: ethers.formatUnits(poolData[2], 18),
      };
    } catch (error) {
      console.error('Failed to get pool reserves from Irys VM:', error);
      return null;
    }
  }

  // Get swap quote
  async getSwapQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{ amountOut: string; priceImpact: number }> {
    try {
      const amm = this.getContract(IRYS_CONTRACT_ADDRESSES.DATA_AMM, IRYS_AMM_ABI);
      
      const amountOut = await amm.getAmountOut(
        ethers.parseUnits(amountIn, 18),
        tokenIn,
        tokenOut
      );
      
      const [reserveIn, reserveOut] = await amm.getReserves(tokenIn, tokenOut);
      
      // Calculate price impact
      const inputAmount = parseFloat(amountIn);
      const outputAmount = parseFloat(ethers.formatUnits(amountOut, 18));
      const reserveInFloat = parseFloat(ethers.formatUnits(reserveIn, 18));
      const reserveOutFloat = parseFloat(ethers.formatUnits(reserveOut, 18));
      
      const currentPrice = reserveOutFloat / reserveInFloat;
      const executionPrice = outputAmount / inputAmount;
      const priceImpact = Math.abs((executionPrice - currentPrice) / currentPrice) * 100;
      
      return {
        amountOut: ethers.formatUnits(amountOut, 18),
        priceImpact
      };
    } catch (error) {
      console.error('Failed to get swap quote from Irys VM:', error);
      return {
        amountOut: '0',
        priceImpact: 0
      };
    }
  }
}

// React hook for Irys contracts
export function useIrysContracts() {
  const { provider, signer, isIrysNetwork } = useWallet();
  
  if (!isIrysNetwork) {
    throw new Error('Irys network required for smart contract operations');
  }
  
  return new IrysContractsService(provider || undefined, signer || undefined);
}