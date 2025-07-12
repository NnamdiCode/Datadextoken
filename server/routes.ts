import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { irysService } from "./services/irys";
import { contractService } from "./services/contracts";
import { uploadRequestSchema, tradeRequestSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow most file types but filter out executables
    const allowedExtensions = /\.(txt|json|csv|pdf|png|jpg|jpeg|gif|mp3|mp4|doc|docx|xls|xlsx|zip)$/i;
    if (allowedExtensions.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get Irys balance
  app.get("/api/irys/balance", async (req, res) => {
    try {
      const balance = await irysService.getBalance();
      res.json({ balance });
    } catch (error) {
      console.error("Failed to get Irys balance:", error);
      res.status(500).json({ error: "Failed to get balance" });
    }
  });

  // Upload file and create data token
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Validate request data
      const validation = uploadRequestSchema.safeParse({
        name: req.body.name,
        description: req.body.description,
        fileType: req.file.mimetype,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });

      if (!validation.success) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validation.error.issues 
        });
      }

      const { name, description } = validation.data;
      const creatorAddress = req.body.creatorAddress;

      if (!creatorAddress) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Creator address is required" });
      }

      // Upload to Irys
      const irysResult = await irysService.uploadFile(req.file.path, {
        name,
        description,
        creatorAddress,
        fileType: req.file.mimetype,
      });

      // Create smart contract token
      const contractResult = await contractService.createDataToken(
        name,
        irysResult.id,
        JSON.stringify({
          description,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          uploadedAt: new Date().toISOString(),
        })
      );

      // Store in database
      const dataToken = await storage.createDataToken({
        tokenAddress: contractResult.tokenAddress,
        irysTransactionId: irysResult.id,
        name,
        description: description || "",
        creatorAddress,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        fileName: req.file.originalname,
      });

      // Update user stats
      const user = await storage.getUser(creatorAddress);
      if (user) {
        await storage.updateUserStats(
          creatorAddress,
          (user.totalUploads || 0) + 1
        );
      } else {
        await storage.createUser({
          walletAddress: creatorAddress,
          totalUploads: 1,
        });
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        token: dataToken,
        irysUrl: irysService.getGatewayUrl(irysResult.id),
        contractTransaction: contractResult.transactionHash,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        error: "Upload failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get all data tokens
  app.get("/api/tokens", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;

      let tokens;
      if (search) {
        tokens = await storage.searchDataTokens(search);
      } else {
        tokens = await storage.getAllDataTokens(limit, offset);
      }

      res.json({ tokens });
    } catch (error) {
      console.error("Failed to get tokens:", error);
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });

  // Get specific token details
  app.get("/api/tokens/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const token = await storage.getDataTokenByAddress(address);
      
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }

      // Get additional contract info
      const contractInfo = await contractService.getTokenInfo(address);
      
      res.json({ 
        token,
        contractInfo,
        irysUrl: irysService.getGatewayUrl(token.irysTransactionId),
      });
    } catch (error) {
      console.error("Failed to get token:", error);
      res.status(500).json({ error: "Failed to get token details" });
    }
  });

  // Get swap quote
  app.get("/api/trade/quote", async (req, res) => {
    try {
      const { tokenIn, tokenOut, amountIn } = req.query;
      
      if (!tokenIn || !tokenOut || !amountIn) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const quote = await contractService.getSwapQuote(
        tokenIn as string,
        tokenOut as string,
        amountIn as string
      );

      res.json(quote);
    } catch (error) {
      console.error("Failed to get quote:", error);
      res.status(500).json({ error: "Failed to get swap quote" });
    }
  });

  // Execute trade
  app.post("/api/trade", async (req, res) => {
    try {
      const validation = tradeRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validation.error.issues 
        });
      }

      const { fromTokenAddress, toTokenAddress, amountIn, minAmountOut } = validation.data;
      const traderAddress = req.body.traderAddress;

      if (!traderAddress) {
        return res.status(400).json({ error: "Trader address is required" });
      }

      // Execute the swap
      const swapResult = await contractService.swapTokens(
        fromTokenAddress,
        toTokenAddress,
        amountIn,
        minAmountOut
      );

      // Calculate price and fee (simplified)
      const pricePerToken = parseFloat(swapResult.amountOut) / parseFloat(amountIn);
      const feeAmount = (parseFloat(amountIn) * 0.003).toString(); // 0.3% fee

      // Store trade in database
      const trade = await storage.createTrade({
        fromTokenAddress,
        toTokenAddress,
        amountIn,
        amountOut: swapResult.amountOut,
        traderAddress,
        transactionHash: swapResult.transactionHash,
        pricePerToken,
        feeAmount,
      });

      // Update user stats
      const user = await storage.getUser(traderAddress);
      if (user) {
        await storage.updateUserStats(
          traderAddress,
          undefined,
          (user.totalTrades || 0) + 1,
          (user.totalVolume || 0) + parseFloat(amountIn)
        );
      } else {
        await storage.createUser({
          walletAddress: traderAddress,
          totalTrades: 1,
          totalVolume: parseFloat(amountIn),
        });
      }

      res.json({
        success: true,
        trade,
        transactionHash: swapResult.transactionHash,
      });
    } catch (error) {
      console.error("Trade failed:", error);
      res.status(500).json({ 
        error: "Trade failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get recent trades
  app.get("/api/trades", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const userAddress = req.query.user as string;
      const tokenAddress = req.query.token as string;

      let trades;
      if (userAddress) {
        trades = await storage.getTradesByUser(userAddress, limit);
      } else if (tokenAddress) {
        trades = await storage.getTradesByToken(tokenAddress, limit);
      } else {
        trades = await storage.getRecentTrades(limit);
      }

      res.json({ trades });
    } catch (error) {
      console.error("Failed to get trades:", error);
      res.status(500).json({ error: "Failed to get trades" });
    }
  });

  // Get user profile
  app.get("/api/users/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const user = await storage.getUser(address);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Failed to get user:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Download data from Irys
  app.get("/api/data/:irysId", async (req, res) => {
    try {
      const { irysId } = req.params;
      
      // Verify user owns this data or it's publicly accessible
      const token = await storage.getDataTokenByIrysId(irysId);
      if (!token) {
        return res.status(404).json({ error: "Data not found" });
      }

      // Proxy the download from Irys
      const response = await irysService.downloadData(irysId);
      
      // Set appropriate headers
      res.setHeader("Content-Type", token.fileType);
      res.setHeader("Content-Disposition", `attachment; filename="${token.fileName}"`);
      
      // Stream the response
      const reader = response.body?.getReader();
      if (reader) {
        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) return;
          res.write(value);
          return pump();
        };
        await pump();
      }
      
      res.end();
    } catch (error) {
      console.error("Failed to download data:", error);
      res.status(500).json({ error: "Failed to download data" });
    }
  });

  // Get liquidity pools
  app.get("/api/pools", async (req, res) => {
    try {
      const pools = await storage.getAllLiquidityPools();
      res.json({ pools });
    } catch (error) {
      console.error("Failed to get pools:", error);
      res.status(500).json({ error: "Failed to get liquidity pools" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
