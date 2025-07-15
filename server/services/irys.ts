import Irys from "@irys/sdk";

export interface IrysUploadResult {
  id: string;
  timestamp: number;
  version: string;
  public: string;
  signature: string;
  deadlineHeight: number;
  block: number;
  validatorSignatures: string[];
  receipt?: {
    deadlineHeight: number;
    block: number;
    validatorSignatures: string[];
  };
}

export class IrysService {
  private irys: any;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const privateKey = process.env.IRYS_PRIVATE_KEY || process.env.PRIVATE_KEY;
      if (!privateKey) {
        console.warn("⚠️  No IRYS_PRIVATE_KEY found - using mock mode for development");
        this.isInitialized = true;
        return;
      }

      // Initialize Irys with testnet for IrysVM
      this.irys = new Irys({
        url: "https://testnet.irys.xyz",
        token: "ethereum",
        key: privateKey,
        config: {
          providerUrl: "https://testnet-rpc.irys.xyz/v1/execution-rpc",
          timeout: 60000
        }
      });

      this.isInitialized = true;
      console.log("✅ Irys client initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Irys client:", error);
      // Allow initialization to continue in development mode
      this.isInitialized = true;
    }
  }

  async ensureFunded(minBalance = "0.01"): Promise<void> {
    await this.initialize();

    if (!this.irys) {
      console.log("🔧 Running in mock mode - skipping funding check");
      return;
    }

    try {
      const balance = await this.irys.getLoadedBalance();
      const minBalanceAtomic = this.irys.utils.toAtomic(minBalance);

      if (balance.lt(minBalanceAtomic)) {
        console.log(`💰 Funding Irys account with ${minBalance} ETH...`);
        const fundTx = await this.irys.fund(this.irys.utils.toAtomic("0.05"));
        console.log(`✅ Successfully funded: ${fundTx.id}`);
      }
    } catch (error) {
      console.error("❌ Failed to fund Irys account:", error);
      throw error;
    }
  }

  async uploadFile(filePath: string, metadata: {
    name: string;
    description?: string;
    creatorAddress: string;
    fileType: string;
    applicationId?: string;
  }): Promise<IrysUploadResult> {
    await this.ensureFunded();

    // Mock response for development mode
    if (!this.irys) {
      console.log(`🔧 Mock upload for development: ${metadata.name}`);
      const mockId = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return {
        id: mockId,
        timestamp: Date.now(),
        version: "1.0.0",
        public: "mock-public-key",
        signature: "mock-signature",
        deadlineHeight: 1000000,
        block: 12345,
        validatorSignatures: []
      };
    }

    try {
      const tags = [
        { name: "application-id", value: metadata.applicationId || "DataSwap" },
        { name: "data-name", value: metadata.name },
        { name: "data-type", value: metadata.fileType },
        { name: "creator", value: metadata.creatorAddress },
        { name: "Content-Type", value: metadata.fileType },
      ];

      if (metadata.description) {
        tags.push({ name: "description", value: metadata.description });
      }

      console.log(`📤 Uploading file to Irys: ${metadata.name}`);
      const receipt = await this.irys.uploadFile(filePath, { tags });
      
      console.log(`✅ File uploaded successfully: https://gateway.irys.xyz/${receipt.id}`);
      return receipt;
    } catch (error) {
      console.error("❌ Failed to upload file to Irys:", error);
      throw error;
    }
  }

  async uploadData(data: string | Buffer, metadata: {
    name: string;
    description?: string;
    creatorAddress: string;
    dataType: string;
    applicationId?: string;
  }): Promise<IrysUploadResult> {
    await this.ensureFunded();

    // Mock response for development mode
    if (!this.irys) {
      console.log(`🔧 Mock data upload for development: ${metadata.name}`);
      const mockId = `mock-data-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return {
        id: mockId,
        timestamp: Date.now(),
        version: "1.0.0",
        public: "mock-public-key",
        signature: "mock-signature",
        deadlineHeight: 1000000,
        block: 12345,
        validatorSignatures: []
      };
    }

    try {
      const tags = [
        { name: "application-id", value: metadata.applicationId || "DataSwap" },
        { name: "data-name", value: metadata.name },
        { name: "data-type", value: metadata.dataType },
        { name: "creator", value: metadata.creatorAddress },
      ];

      if (metadata.description) {
        tags.push({ name: "description", value: metadata.description });
      }

      console.log(`📤 Uploading data to Irys: ${metadata.name}`);
      const receipt = await this.irys.upload(data, { tags });
      
      console.log(`✅ Data uploaded successfully: https://gateway.irys.xyz/${receipt.id}`);
      return receipt;
    } catch (error) {
      console.error("❌ Failed to upload data to Irys:", error);
      throw error;
    }
  }

  async getUploadCost(dataSize: number): Promise<string> {
    await this.initialize();

    if (!this.irys) {
      return "0.001"; // Mock cost for development
    }

    try {
      const price = await this.irys.getPrice(dataSize);
      return this.irys.utils.fromAtomic(price);
    } catch (error) {
      console.error("❌ Failed to get upload cost:", error);
      return "0.001"; // Fallback cost
    }
  }

  async getBalance(): Promise<string> {
    await this.initialize();

    if (!this.irys) {
      return "1.0"; // Mock balance for development
    }

    try {
      const balance = await this.irys.getLoadedBalance();
      return this.irys.utils.fromAtomic(balance);
    } catch (error) {
      console.error("❌ Failed to get balance:", error);
      return "0.0";
    }
  }

  getGatewayUrl(transactionId: string): string {
    return `https://gateway.irys.xyz/${transactionId}`;
  }

  async downloadData(transactionId: string): Promise<Response> {
    try {
      const response = await fetch(this.getGatewayUrl(transactionId));
      if (!response.ok) {
        throw new Error(`Failed to download data: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      console.error("❌ Failed to download data from Irys:", error);
      throw error;
    }
  }
}

export const irysService = new IrysService();
