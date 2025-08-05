import Irys from '@irys/sdk';

// Irys configuration
const IRYS_NODE_URL = process.env.IRYS_NODE_URL || "https://devnet.irys.xyz";
const IRYS_PRIVATE_KEY = process.env.IRYS_PRIVATE_KEY;

export class IrysService {
  private irys: any;
  private isInitialized = false;

  constructor() {
    this.initializeIrys();
  }

  private async initializeIrys() {
    try {
      if (!IRYS_PRIVATE_KEY) {
        console.warn("⚠️  No IRYS_PRIVATE_KEY found - using mock mode for development");
        this.isInitialized = false;
        return;
      }

      this.irys = new Irys({
        network: "devnet", // or "mainnet"
        token: "ethereum",
        key: IRYS_PRIVATE_KEY,
      });

      this.isInitialized = true;
      console.log("✅ Irys service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Irys service:", error);
      this.isInitialized = false;
    }
  }

  async uploadData(data: Buffer | string, tags?: { name: string; value: string }[]): Promise<{
    transactionId: string;
    url: string;
    explorerUrl: string;
  }> {
    if (!this.isInitialized) {
      // Mock response for development
      const mockTxId = 'mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      return {
        transactionId: mockTxId,
        url: `https://gateway.irys.xyz/${mockTxId}`,
        explorerUrl: `https://explorer.irys.xyz/tx/${mockTxId}`
      };
    }

    try {
      const transaction = this.irys.createTransaction(data, {
        tags: tags || []
      });

      await transaction.sign();
      const response = await transaction.upload();

      return {
        transactionId: response.id,
        url: `https://gateway.irys.xyz/${response.id}`,
        explorerUrl: `https://explorer.irys.xyz/tx/${response.id}`
      };
    } catch (error) {
      console.error("❌ Failed to upload to Irys:", error);
      throw new Error("Failed to upload data to Irys blockchain");
    }
  }

  async uploadTokenData(tokenData: {
    name: string;
    symbol: string;
    description: string;
    creator: string;
    fileData: Buffer;
    fileName: string;
    fileType: string;
    imageData?: Buffer;
    imageName?: string;
    imageType?: string;
  }): Promise<{
    dataTransactionId: string;
    imageTransactionId?: string;
    dataUrl: string;
    imageUrl?: string;
    dataExplorerUrl: string;
    imageExplorerUrl?: string;
  }> {
    const tags = [
      { name: "Content-Type", value: tokenData.fileType },
      { name: "App-Name", value: "DataSwap" },
      { name: "Token-Name", value: tokenData.name },
      { name: "Token-Symbol", value: tokenData.symbol },
      { name: "Creator", value: tokenData.creator },
      { name: "File-Name", value: tokenData.fileName },
      { name: "Description", value: tokenData.description }
    ];

    // Upload main data file
    const dataUpload = await this.uploadData(tokenData.fileData, tags);

    let imageUpload;
    if (tokenData.imageData) {
      const imageTags = [
        { name: "Content-Type", value: tokenData.imageType || "image/png" },
        { name: "App-Name", value: "DataSwap" },
        { name: "Token-Name", value: tokenData.name },
        { name: "Token-Symbol", value: tokenData.symbol },
        { name: "Creator", value: tokenData.creator },
        { name: "File-Name", value: tokenData.imageName || "token-image" },
        { name: "File-Type", value: "token-image" }
      ];

      imageUpload = await this.uploadData(tokenData.imageData, imageTags);
    }

    return {
      dataTransactionId: dataUpload.transactionId,
      imageTransactionId: imageUpload?.transactionId,
      dataUrl: dataUpload.url,
      imageUrl: imageUpload?.url,
      dataExplorerUrl: dataUpload.explorerUrl,
      imageExplorerUrl: imageUpload?.explorerUrl
    };
  }

  async recordTradeTransaction(tradeData: {
    fromToken: string;
    toToken: string;
    amountIn: string;
    amountOut: string;
    trader: string;
    timestamp: number;
  }): Promise<{
    transactionId: string;
    explorerUrl: string;
  }> {
    const tradeRecord = {
      type: "token_swap",
      fromToken: tradeData.fromToken,
      toToken: tradeData.toToken,
      amountIn: tradeData.amountIn,
      amountOut: tradeData.amountOut,
      trader: tradeData.trader,
      timestamp: tradeData.timestamp,
      platform: "DataSwap"
    };

    const tags = [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "DataSwap" },
      { name: "Transaction-Type", value: "token_swap" },
      { name: "From-Token", value: tradeData.fromToken },
      { name: "To-Token", value: tradeData.toToken },
      { name: "Trader", value: tradeData.trader },
      { name: "Amount-In", value: tradeData.amountIn },
      { name: "Amount-Out", value: tradeData.amountOut }
    ];

    const upload = await this.uploadData(JSON.stringify(tradeRecord), tags);

    return {
      transactionId: upload.transactionId,
      explorerUrl: upload.explorerUrl
    };
  }

  async getBalance(): Promise<string> {
    if (!this.isInitialized) {
      // Return mock balance for development
      return (Math.random() * 10 + 1).toFixed(4);
    }

    try {
      const balance = await this.irys.getLoadedBalance();
      return this.irys.utils.fromAtomic(balance).toString();
    } catch (error) {
      console.error("❌ Failed to get Irys balance:", error);
      return "0";
    }
  }

  async fundAccount(amount: string): Promise<{ success: boolean; transactionId?: string }> {
    if (!this.isInitialized) {
      console.log("🔧 Mock funding for development mode");
      return { success: true, transactionId: 'mock-funding-' + Date.now() };
    }

    try {
      const fundTx = await this.irys.fund(this.irys.utils.toAtomic(amount));
      return { success: true, transactionId: fundTx.id };
    } catch (error) {
      console.error("❌ Failed to fund Irys account:", error);
      return { success: false };
    }
  }

  getExplorerUrl(transactionId: string): string {
    return `https://explorer.irys.xyz/tx/${transactionId}`;
  }

  getDataUrl(transactionId: string): string {
    return `https://gateway.irys.xyz/${transactionId}`;
  }

  async getUploadCost(fileSizeBytes: number): Promise<string> {
    if (!this.isInitialized) {
      // Return mock cost for development (0.005 IRYS base fee)
      return "0.005";
    }

    try {
      const price = await this.irys.getPrice(fileSizeBytes);
      return this.irys.utils.fromAtomic(price).toString();
    } catch (error) {
      console.error("❌ Failed to get upload cost:", error);
      return "0.005"; // Default cost
    }
  }

  async uploadFile(filePath: string, metadata: {
    name: string;
    description: string;
    creatorAddress: string;
    fileType: string;
    applicationId: string;
  }): Promise<{ id: string; url: string; explorerUrl: string }> {
    if (!this.isInitialized) {
      // Mock response for development
      const mockTxId = 'mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      return {
        id: mockTxId,
        url: `https://gateway.irys.xyz/${mockTxId}`,
        explorerUrl: `https://explorer.irys.xyz/tx/${mockTxId}`
      };
    }

    try {
      const fileData = require('fs').readFileSync(filePath);
      const tags = [
        { name: "Content-Type", value: metadata.fileType },
        { name: "App-Name", value: metadata.applicationId },
        { name: "File-Name", value: metadata.name },
        { name: "Description", value: metadata.description },
        { name: "Creator", value: metadata.creatorAddress }
      ];

      const transaction = this.irys.createTransaction(fileData, { tags });
      await transaction.sign();
      const response = await transaction.upload();

      return {
        id: response.id,
        url: `https://gateway.irys.xyz/${response.id}`,
        explorerUrl: `https://explorer.irys.xyz/tx/${response.id}`
      };
    } catch (error) {
      console.error("❌ Failed to upload file to Irys:", error);
      throw new Error("Failed to upload file to Irys blockchain");
    }
  }
}

export const irysService = new IrysService();