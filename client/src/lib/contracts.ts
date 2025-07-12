import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';

// Contract ABIs
const DATA_TOKEN_ABI = [
  "constructor(string memory _name, string memory _symbol, string memory _dataHash, string memory _metadata, address _creator)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function dataHash() view returns (string)",
  "function metadata() view returns (string)",
  "function creator() view returns (address)",
  "function mint(address to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const DATA_REGISTRY_ABI = [
  "constructor()",
  "function createDataToken(string memory name, string memory symbol, string memory dataHash, string memory metadata) returns (address)",
  "function getDataToken(string memory dataHash) view returns (address)",
  "function getAllTokens() view returns (address[])",
  "function getTokensByCreator(address creator) view returns (address[])",
  "function tokenCount() view returns (uint256)",
  "function isValidToken(address token) view returns (bool)",
  "event DataTokenCreated(address indexed token, string dataHash, address indexed creator, uint256 timestamp)"
];

const DATA_AMM_ABI = [
  "constructor()",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external returns (uint256 liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity) external returns (uint256 amountA, uint256 amountB)",
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut)",
  "function getReserves(address tokenA, address tokenB) view returns (uint256 reserveA, uint256 reserveB)",
  "function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256 amountOut)",
  "function getAmountIn(uint256 amountOut, address tokenIn, address tokenOut) view returns (uint256 amountIn)",
  "function getLiquidityValue(address tokenA, address tokenB, uint256 liquidity) view returns (uint256 amountA, uint256 amountB)",
  "function pools(address tokenA, address tokenB) view returns (uint256 reserveA, uint256 reserveB, uint256 totalLiquidity, uint256 lastUpdate)",
  "function feeRate() view returns (uint256)",
  "event Swap(address indexed trader, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee)",
  "event LiquidityAdded(address indexed provider, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity)",
  "event LiquidityRemoved(address indexed provider, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity)"
];

const DATA_MARKETPLACE_ABI = [
  "constructor(address _registry, address _amm)",
  "function registry() view returns (address)",
  "function amm() view returns (address)",
  "function platformFee() view returns (uint256)",
  "function createAndListToken(string memory name, string memory symbol, string memory dataHash, string memory metadata, uint256 initialPrice) returns (address)",
  "function updateTokenPrice(address token, uint256 newPrice)",
  "function getTokenPrice(address token) view returns (uint256)",
  "function getMarketStats() view returns (uint256 totalTokens, uint256 totalVolume, uint256 totalTrades)",
  "function getUserStats(address user) view returns (uint256 tokensCreated, uint256 totalTrades, uint256 totalVolume)",
  "event TokenListed(address indexed token, address indexed creator, uint256 price, uint256 timestamp)",
  "event PriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice, uint256 timestamp)",
  "event TradeExecuted(address indexed trader, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee, uint256 timestamp)"
];

// Contract addresses (these will be set after deployment)
export const CONTRACT_ADDRESSES = {
  DATA_REGISTRY: process.env.REACT_APP_DATA_REGISTRY_ADDRESS || '',
  DATA_AMM: process.env.REACT_APP_DATA_AMM_ADDRESS || '',
  DATA_MARKETPLACE: process.env.REACT_APP_DATA_MARKETPLACE_ADDRESS || '',
  // Testnet addresses for Irys devnet
  IRYS_TOKEN: process.env.REACT_APP_IRYS_TOKEN_ADDRESS || '0x...',
} as const;

export class ContractsService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor(provider?: ethers.BrowserProvider, signer?: ethers.JsonRpcSigner) {
    this.provider = provider || null;
    this.signer = signer || null;
  }

  private getContract(address: string, abi: string[], withSigner = false) {
    if (!this.provider) {
      throw new Error('No provider available');
    }
    
    if (withSigner && !this.signer) {
      throw new Error('No signer available for transaction');
    }

    return new ethers.Contract(
      address,
      abi,
      withSigner ? this.signer : this.provider
    );
  }

  // Data Registry methods
  async createDataToken(
    name: string,
    symbol: string,
    dataHash: string,
    metadata: string
  ): Promise<{ tokenAddress: string; transactionHash: string }> {
    const registry = this.getContract(CONTRACT_ADDRESSES.DATA_REGISTRY, DATA_REGISTRY_ABI, true);
    
    const tx = await registry.createDataToken(name, symbol, dataHash, metadata);
    const receipt = await tx.wait();
    
    // Parse the event to get the token address
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = registry.interface.parseLog(log);
        return parsed?.name === 'DataTokenCreated';
      } catch {
        return false;
      }
    });
    
    if (!event) {
      throw new Error('DataTokenCreated event not found');
    }
    
    const parsedEvent = registry.interface.parseLog(event);
    const tokenAddress = parsedEvent?.args[0];
    
    return {
      tokenAddress,
      transactionHash: tx.hash,
    };
  }

  async getDataToken(dataHash: string): Promise<string | null> {
    const registry = this.getContract(CONTRACT_ADDRESSES.DATA_REGISTRY, DATA_REGISTRY_ABI);
    const tokenAddress = await registry.getDataToken(dataHash);
    return tokenAddress === ethers.ZeroAddress ? null : tokenAddress;
  }

  async getAllTokens(): Promise<string[]> {
    const registry = this.getContract(CONTRACT_ADDRESSES.DATA_REGISTRY, DATA_REGISTRY_ABI);
    return await registry.getAllTokens();
  }

  async getTokensByCreator(creator: string): Promise<string[]> {
    const registry = this.getContract(CONTRACT_ADDRESSES.DATA_REGISTRY, DATA_REGISTRY_ABI);
    return await registry.getTokensByCreator(creator);
  }

  // Token methods
  async getTokenInfo(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    totalSupply: string;
    dataHash: string;
    metadata: string;
    creator: string;
  } | null> {
    try {
      const token = this.getContract(tokenAddress, DATA_TOKEN_ABI);
      
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
      console.error('Failed to get token info:', error);
      return null;
    }
  }

  async getTokenBalance(tokenAddress: string, account: string): Promise<string> {
    const token = this.getContract(tokenAddress, DATA_TOKEN_ABI);
    const balance = await token.balanceOf(account);
    return ethers.formatUnits(balance, 18);
  }

  async approveToken(tokenAddress: string, spender: string, amount: string): Promise<string> {
    const token = this.getContract(tokenAddress, DATA_TOKEN_ABI, true);
    const tx = await token.approve(spender, ethers.parseUnits(amount, 18));
    await tx.wait();
    return tx.hash;
  }

  // AMM methods
  async getSwapQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{ amountOut: string; priceImpact: number; fee: string }> {
    const amm = this.getContract(CONTRACT_ADDRESSES.DATA_AMM, DATA_AMM_ABI);
    
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
    
    // Calculate fee (0.3% default)
    const feeRate = await amm.feeRate();
    const fee = (inputAmount * parseFloat(feeRate.toString())) / 10000;
    
    return {
      amountOut: ethers.formatUnits(amountOut, 18),
      priceImpact,
      fee: fee.toString(),
    };
  }

  async executeSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string
  ): Promise<{ amountOut: string; transactionHash: string }> {
    // First approve the AMM to spend the input token
    await this.approveToken(tokenIn, CONTRACT_ADDRESSES.DATA_AMM, amountIn);
    
    const amm = this.getContract(CONTRACT_ADDRESSES.DATA_AMM, DATA_AMM_ABI, true);
    
    const tx = await amm.swap(
      tokenIn,
      tokenOut,
      ethers.parseUnits(amountIn, 18),
      ethers.parseUnits(minAmountOut, 18)
    );
    
    const receipt = await tx.wait();
    
    // Parse the swap event to get actual amount out
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
    
    return {
      amountOut,
      transactionHash: tx.hash,
    };
  }

  async addLiquidity(
    tokenA: string,
    tokenB: string,
    amountA: string,
    amountB: string
  ): Promise<{ liquidity: string; transactionHash: string }> {
    // Approve both tokens
    await Promise.all([
      this.approveToken(tokenA, CONTRACT_ADDRESSES.DATA_AMM, amountA),
      this.approveToken(tokenB, CONTRACT_ADDRESSES.DATA_AMM, amountB),
    ]);
    
    const amm = this.getContract(CONTRACT_ADDRESSES.DATA_AMM, DATA_AMM_ABI, true);
    
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
    
    return {
      liquidity,
      transactionHash: tx.hash,
    };
  }

  async getPoolReserves(tokenA: string, tokenB: string): Promise<{
    reserveA: string;
    reserveB: string;
    totalLiquidity: string;
  } | null> {
    try {
      const amm = this.getContract(CONTRACT_ADDRESSES.DATA_AMM, DATA_AMM_ABI);
      const [reserveA, reserveB] = await amm.getReserves(tokenA, tokenB);
      const poolData = await amm.pools(tokenA, tokenB);
      
      return {
        reserveA: ethers.formatUnits(reserveA, 18),
        reserveB: ethers.formatUnits(reserveB, 18),
        totalLiquidity: ethers.formatUnits(poolData[2], 18),
      };
    } catch (error) {
      console.error('Failed to get pool reserves:', error);
      return null;
    }
  }

  // Marketplace methods
  async getMarketStats(): Promise<{
    totalTokens: number;
    totalVolume: string;
    totalTrades: number;
  }> {
    const marketplace = this.getContract(CONTRACT_ADDRESSES.DATA_MARKETPLACE, DATA_MARKETPLACE_ABI);
    const [totalTokens, totalVolume, totalTrades] = await marketplace.getMarketStats();
    
    return {
      totalTokens: totalTokens.toNumber(),
      totalVolume: ethers.formatUnits(totalVolume, 18),
      totalTrades: totalTrades.toNumber(),
    };
  }

  async getUserStats(userAddress: string): Promise<{
    tokensCreated: number;
    totalTrades: number;
    totalVolume: string;
  }> {
    const marketplace = this.getContract(CONTRACT_ADDRESSES.DATA_MARKETPLACE, DATA_MARKETPLACE_ABI);
    const [tokensCreated, totalTrades, totalVolume] = await marketplace.getUserStats(userAddress);
    
    return {
      tokensCreated: tokensCreated.toNumber(),
      totalTrades: totalTrades.toNumber(),
      totalVolume: ethers.formatUnits(totalVolume, 18),
    };
  }
}

// Hook to use contracts with wallet integration
export function useContracts() {
  const { provider, signer } = useWallet();
  
  return new ContractsService(provider || undefined, signer || undefined);
}

// Utility functions
export function formatTokenAmount(amount: string, decimals = 18): string {
  return ethers.formatUnits(amount, decimals);
}

export function parseTokenAmount(amount: string, decimals = 18): string {
  return ethers.parseUnits(amount, decimals).toString();
}

export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function shortenAddress(address: string, startLength = 6, endLength = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
