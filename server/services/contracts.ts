import { ethers } from "ethers";

// Smart contract ABIs (simplified for demo - in production these would be in separate files)
const DATA_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function dataHash() view returns (string)",
  "function metadata() view returns (string)",
  "function creator() view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const DATA_REGISTRY_ABI = [
  "function createDataToken(string name, string dataHash, string metadata) returns (address)",
  "function getDataToken(string dataHash) view returns (address)",
  "function getAllTokens() view returns (address[])",
  "function tokenCount() view returns (uint256)",
  "event DataTokenCreated(address indexed token, string dataHash, address indexed creator)"
];

const DATA_AMM_ABI = [
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA) external returns (uint256)",
  "function swap(address tokenIn, address tokenOut, uint256 amountIn) external returns (uint256)",
  "function getReserves(address tokenA, address tokenB) view returns (uint256, uint256)",
  "function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256)",
  "function pools(address, address) view returns (uint256, uint256, uint256)",
  "event Swap(address indexed trader, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
  "event LiquidityAdded(address indexed provider, address tokenA, address tokenB, uint256 amountA, uint256 amountB)"
];

export interface ContractAddresses {
  dataRegistry: string;
  dataAMM: string;
  irysToken: string; // Mock IRYS token for testing
}

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private addresses: ContractAddresses;
  private contracts: {
    dataRegistry?: ethers.Contract;
    dataAMM?: ethers.Contract;
  } = {};

  constructor() {
    const rpcUrl = process.env.RPC_URL || "https://sepolia.infura.io/v3/your-key";
    const privateKey = process.env.CONTRACT_PRIVATE_KEY || process.env.PRIVATE_KEY;
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (!privateKey) {
      console.warn("⚠️  No CONTRACT_PRIVATE_KEY found - using read-only mode for development");
      // Use a random wallet for read-only operations in development
      this.signer = ethers.Wallet.createRandom().connect(this.provider);
    } else {
      this.signer = new ethers.Wallet(privateKey, this.provider);
    }
    
    this.addresses = {
      dataRegistry: process.env.DATA_REGISTRY_ADDRESS || "",
      dataAMM: process.env.DATA_AMM_ADDRESS || "",
      irysToken: process.env.IRYS_TOKEN_ADDRESS || "",
    };
  }

  private getDataRegistry(): ethers.Contract {
    if (!this.contracts.dataRegistry) {
      if (!this.addresses.dataRegistry) {
        throw new Error("DATA_REGISTRY_ADDRESS not configured");
      }
      this.contracts.dataRegistry = new ethers.Contract(
        this.addresses.dataRegistry,
        DATA_REGISTRY_ABI,
        this.signer
      );
    }
    return this.contracts.dataRegistry;
  }

  private getDataAMM(): ethers.Contract {
    if (!this.contracts.dataAMM) {
      if (!this.addresses.dataAMM) {
        throw new Error("DATA_AMM_ADDRESS not configured");
      }
      this.contracts.dataAMM = new ethers.Contract(
        this.addresses.dataAMM,
        DATA_AMM_ABI,
        this.signer
      );
    }
    return this.contracts.dataAMM;
  }

  async createDataToken(
    name: string,
    irysTransactionId: string,
    metadata: string
  ): Promise<{ tokenAddress: string; transactionHash: string }> {
    try {
      console.log(`🔨 Creating data token: ${name}`);
      const registry = this.getDataRegistry();
      
      const tx = await registry.createDataToken(name, irysTransactionId, metadata);
      const receipt = await tx.wait();
      
      // Parse the event to get the token address
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = registry.interface.parseLog(log);
          return parsed?.name === "DataTokenCreated";
        } catch {
          return false;
        }
      });
      
      if (!event) {
        throw new Error("DataTokenCreated event not found");
      }
      
      const parsedEvent = registry.interface.parseLog(event);
      const tokenAddress = parsedEvent?.args[0];
      
      console.log(`✅ Data token created: ${tokenAddress}`);
      return {
        tokenAddress,
        transactionHash: tx.hash,
      };
    } catch (error) {
      console.error("❌ Failed to create data token:", error);
      throw error;
    }
  }

  async getDataToken(irysTransactionId: string): Promise<string | null> {
    try {
      const registry = this.getDataRegistry();
      const tokenAddress = await registry.getDataToken(irysTransactionId);
      return tokenAddress === ethers.ZeroAddress ? null : tokenAddress;
    } catch (error) {
      console.error("❌ Failed to get data token:", error);
      return null;
    }
  }

  async getAllTokens(): Promise<string[]> {
    try {
      const registry = this.getDataRegistry();
      return await registry.getAllTokens();
    } catch (error) {
      console.error("❌ Failed to get all tokens:", error);
      return [];
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    totalSupply: string;
    dataHash: string;
    metadata: string;
    creator: string;
  } | null> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, DATA_TOKEN_ABI, this.provider);
      
      const [name, symbol, totalSupply, dataHash, metadata, creator] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.totalSupply(),
        tokenContract.dataHash(),
        tokenContract.metadata(),
        tokenContract.creator(),
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
      console.error("❌ Failed to get token info:", error);
      return null;
    }
  }

  async swapTokens(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string
  ): Promise<{ amountOut: string; transactionHash: string }> {
    try {
      console.log(`🔄 Swapping ${amountIn} ${tokenIn} for ${tokenOut}`);
      const amm = this.getDataAMM();
      
      // First approve the AMM to spend the input token
      const inputTokenContract = new ethers.Contract(tokenIn, DATA_TOKEN_ABI, this.signer);
      const approveTx = await inputTokenContract.transfer(this.addresses.dataAMM, ethers.parseUnits(amountIn, 18));
      await approveTx.wait();
      
      // Execute the swap
      const tx = await amm.swap(tokenIn, tokenOut, ethers.parseUnits(amountIn, 18));
      const receipt = await tx.wait();
      
      // Parse the swap event to get the actual amount out
      const swapEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = amm.interface.parseLog(log);
          return parsed?.name === "Swap";
        } catch {
          return false;
        }
      });
      
      let amountOut = "0";
      if (swapEvent) {
        const parsedEvent = amm.interface.parseLog(swapEvent);
        amountOut = ethers.formatUnits(parsedEvent?.args[4] || 0, 18);
      }
      
      console.log(`✅ Swap completed: ${amountOut} ${tokenOut} received`);
      return {
        amountOut,
        transactionHash: tx.hash,
      };
    } catch (error) {
      console.error("❌ Failed to swap tokens:", error);
      throw error;
    }
  }

  async getSwapQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{ amountOut: string; priceImpact: number }> {
    try {
      const amm = this.getDataAMM();
      const amountOut = await amm.getAmountOut(
        ethers.parseUnits(amountIn, 18),
        tokenIn,
        tokenOut
      );
      
      // Calculate price impact (simplified)
      const rate = parseFloat(ethers.formatUnits(amountOut, 18)) / parseFloat(amountIn);
      const priceImpact = Math.max(0, (1 - rate) * 100);
      
      return {
        amountOut: ethers.formatUnits(amountOut, 18),
        priceImpact,
      };
    } catch (error) {
      console.error("❌ Failed to get swap quote:", error);
      return { amountOut: "0", priceImpact: 0 };
    }
  }

  async getLiquidityPoolReserves(tokenA: string, tokenB: string): Promise<{
    reserveA: string;
    reserveB: string;
    totalLiquidity: string;
  } | null> {
    try {
      const amm = this.getDataAMM();
      const [reserveA, reserveB] = await amm.getReserves(tokenA, tokenB);
      
      return {
        reserveA: ethers.formatUnits(reserveA, 18),
        reserveB: ethers.formatUnits(reserveB, 18),
        totalLiquidity: "0", // Would need to be calculated from pool data
      };
    } catch (error) {
      console.error("❌ Failed to get pool reserves:", error);
      return null;
    }
  }
}

export const contractService = new ContractService();
