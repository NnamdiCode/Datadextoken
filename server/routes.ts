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

// Configure multer for multiple file uploads (data + image)
const multiUpload = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get Irys balance for specific address
  app.get("/api/irys/balance", async (req, res) => {
    try {
      const { address } = req.query;
      
      if (!address) {
        return res.status(400).json({ error: "Address parameter is required" });
      }
      
      // For now, simulate balance fetching from Irys network
      // In production, this would query the actual Irys blockchain
      const mockBalance = (Math.random() * 10 + 1).toFixed(4);
      
      res.json({ balance: mockBalance });
    } catch (error) {
      console.error("Failed to get Irys balance:", error);
      res.status(500).json({ error: "Failed to get balance" });
    }
  });

  // Get upload cost estimate
  app.post("/api/upload/estimate", async (req, res) => {
    try {
      const { fileSize } = req.body;
      
      if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
        return res.status(400).json({ error: "Valid file size is required" });
      }

      const estimatedCost = await irysService.getUploadCost(fileSize);
      
      res.json({ 
        fileSize,
        estimatedCost,
        estimatedCostETH: estimatedCost,
        message: `Estimated cost for ${(fileSize / 1024 / 1024).toFixed(2)} MB: ${estimatedCost} IRYS`
      });
    } catch (error) {
      console.error("Failed to estimate upload cost:", error);
      res.status(500).json({ error: "Failed to estimate cost" });
    }
  });

  // Upload file and create data token
  app.post("/api/upload", multiUpload, async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files || !files.file || !files.file[0]) {
        return res.status(400).json({ error: "No data file uploaded" });
      }

      const dataFile = files.file[0];
      const imageFile = files.image ? files.image[0] : null;
      const { tokenId, name, description, category, creatorAddress, calculatedPrice } = req.body;
      
      if (!tokenId || !name || !category || !creatorAddress) {
        return res.status(400).json({ error: "Token ID, name, category, and creator address are required" });
      }

      console.log(`📤 Processing upload: ${name} by ${creatorAddress}`);
      
      let imageUrl = '';
      
      // Upload token image to Irys if provided
      if (imageFile) {
        try {
          const imageResult = await irysService.uploadFile(imageFile.path, {
            name: `${name}-image`,
            description: `Token image for ${name}`,
            creatorAddress,
            fileType: imageFile.mimetype || 'image/png',
            applicationId: 'DataSwap'
          });
          
          imageUrl = `https://gateway.irys.xyz/${imageResult.id}`;
          console.log(`🖼️  Token image uploaded: ${imageResult.id}`);
          
          // Clean up image file
          fs.unlinkSync(imageFile.path);
        } catch (imageError) {
          console.error("Image upload failed:", imageError);
          // Continue with data upload even if image fails
        }
      }
      
      // Upload data file to Irys blockchain
      const irysResult = await irysService.uploadFile(dataFile.path, {
        name,
        description: description || '',
        creatorAddress,
        fileType: dataFile.mimetype || 'application/octet-stream',
        applicationId: 'DataSwap'
      });

      console.log(`✅ Irys upload complete: ${irysResult.id}`);

      // Create data token with Irys transaction ID
      const tokenData = {
        tokenAddress: `0x${irysResult.id.slice(0, 40)}`, // Generate token address from Irys ID
        irysTransactionId: irysResult.id,
        name,
        symbol: tokenId.toUpperCase(), // Use tokenId as symbol
        description: description || '',
        category,
        creatorAddress,
        fileSize: dataFile.size,
        fileType: dataFile.mimetype || 'application/octet-stream',
        fileName: dataFile.originalname,
        imageUrl,
        totalSupply: '1000000000', // 1 billion tokens
        currentPrice: parseFloat(calculatedPrice) || 0.005, // Use calculated price
        volume24h: 0,
        priceChange24h: 0,
      };

      // Save token to storage
      const savedToken = await storage.createDataToken(tokenData);
      
      // Clean up uploaded data file
      fs.unlinkSync(dataFile.path);

      res.json({
        success: true,
        token: savedToken,
        irysTransaction: irysResult,
        imageUrl,
        message: `Data successfully uploaded to Irys blockchain and tokenized`
      });

    } catch (error) {
      console.error("Upload error:", error);
      
      // Clean up files on error
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files) {
        Object.values(files).flat().forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      
      res.status(500).json({ 
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get all data tokens (limit to last 100 for dropdown)
  app.get("/api/tokens", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100; // Only show last 100 tokens
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

      res.json({ token });
    } catch (error) {
      console.error("Failed to get token:", error);
      res.status(500).json({ error: "Failed to get token" });
    }
  });

  // Get recent trades
  app.get("/api/trades", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const trades = await storage.getRecentTrades(limit);
      
      res.json({ trades });
    } catch (error) {
      console.error("Failed to get trades:", error);
      res.status(500).json({ error: "Failed to get trades" });
    }
  });

  // Search tokens (unlimited search across all tokens)
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      const tokens = await storage.searchDataTokens(q);
      res.json({ tokens });
    } catch (error) {
      console.error("Search failed:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Get tokens by creator address
  app.get("/api/tokens/creator/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: "Invalid address parameter" });
      }
      
      const tokens = await storage.getTokensByCreator(address);
      res.json({ tokens });
    } catch (error) {
      console.error("Failed to get tokens by creator:", error);
      res.status(500).json({ error: "Failed to get tokens by creator", details: error.message });
    }
  });

  // Get trading quote using Uniswap-like AMM (x*y=k)
  app.get("/api/trade/quote", async (req, res) => {
    try {
      const { fromToken, toToken, amount } = req.query;
      
      if (!fromToken || !toToken || !amount) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      const fromTokenData = await storage.getDataTokenByAddress(fromToken as string);
      const toTokenData = await storage.getDataTokenByAddress(toToken as string);
      
      if (!fromTokenData || !toTokenData) {
        return res.status(404).json({ error: "Token not found" });
      }
      
      // Get or create liquidity pool for this token pair
      let pool = await storage.getLiquidityPool(fromToken as string, toToken as string);
      
      if (!pool) {
        // Create initial liquidity pool with default reserves
        const initialReserveA = (Math.random() * 1000000 + 100000).toFixed(0); // 100k-1M tokens
        const initialReserveB = (Math.random() * 1000000 + 100000).toFixed(0);
        
        pool = await storage.createLiquidityPool({
          tokenAAddress: fromToken as string,
          tokenBAddress: toToken as string,
          reserveA: initialReserveA,
          reserveB: initialReserveB,
          totalLiquidity: Math.sqrt(parseFloat(initialReserveA) * parseFloat(initialReserveB)).toFixed(0)
        });
      }
      
      // Uniswap AMM formula: x * y = k
      // When trading dx for dy: dy = (y * dx) / (x + dx)
      const reserveIn = parseFloat(pool.reserveA);
      const reserveOut = parseFloat(pool.reserveB);
      const amountIn = parseFloat(amount as string);
      
      // Apply 0.3% fee (like Uniswap)
      const amountInWithFee = amountIn * 0.997;
      
      // Calculate output amount using AMM formula
      const outputAmount = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
      
      // Calculate price impact
      const priceImpact = ((amountIn / reserveIn) * 100);
      
      // Fee calculation
      const fee = (amountIn * 0.003).toFixed(6);
      
      res.json({
        quote: {
          fromToken: fromTokenData.tokenAddress,
          toToken: toTokenData.tokenAddress,
          amountIn: amount,
          amountOut: outputAmount.toFixed(6),
          exchangeRate: (outputAmount / amountIn).toFixed(6),
          priceImpact: priceImpact.toFixed(3),
          fee,
          minAmountOut: (outputAmount * 0.995).toFixed(6), // 0.5% slippage
          poolReserveA: pool.reserveA,
          poolReserveB: pool.reserveB,
          poolAddress: `${pool.tokenAAddress}-${pool.tokenBAddress}`
        }
      });
    } catch (error) {
      console.error("Failed to get quote:", error);
      res.status(500).json({ error: "Failed to get quote" });
    }
  });

  // Execute token trade using AMM
  app.post("/api/trade", async (req, res) => {
    try {
      const { fromToken, toToken, amountIn, amountOut, traderAddress, slippage } = req.body;
      
      if (!fromToken || !toToken || !amountIn || !amountOut || !traderAddress) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      // Validate tokens exist
      const fromTokenData = await storage.getDataTokenByAddress(fromToken);
      const toTokenData = await storage.getDataTokenByAddress(toToken);
      
      if (!fromTokenData || !toTokenData) {
        return res.status(404).json({ error: "Token not found" });
      }
      
      // Get liquidity pool
      const pool = await storage.getLiquidityPool(fromToken, toToken);
      if (!pool) {
        return res.status(404).json({ error: "Liquidity pool not found" });
      }
      
      // Update pool reserves after trade (AMM mechanism)
      const newReserveA = parseFloat(pool.reserveA) + parseFloat(amountIn);
      const newReserveB = parseFloat(pool.reserveB) - parseFloat(amountOut);
      
      await storage.updateLiquidityPool(fromToken, toToken, newReserveA.toString(), newReserveB.toString());
      
      // Generate Irys transaction hash
      const irysTransactionHash = 'irys_' + Math.random().toString(36).substr(2, 32);
      
      // Create trade record
      const trade = await storage.createTrade({
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amountIn: amountIn.toString(),
        amountOut: amountOut.toString(),
        traderAddress,
        transactionHash: irysTransactionHash,
        pricePerToken: parseFloat(amountOut) / parseFloat(amountIn),
        feeAmount: (parseFloat(amountIn) * 0.003).toString()
      });
      
      res.json({
        success: true,
        trade,
        transactionHash: irysTransactionHash,
        poolUpdated: {
          newReserveA: newReserveA.toString(),
          newReserveB: newReserveB.toString()
        },
        message: "Trade executed successfully on Irys VM"
      });
    } catch (error) {
      console.error("Trade execution failed:", error);
      res.status(500).json({ error: "Trade execution failed" });
    }
  });

  // Get Irys transactions for a user
  app.get("/api/irys/transactions", async (req, res) => {
    try {
      const { address } = req.query;
      
      if (!address) {
        return res.status(400).json({ error: "Address parameter is required" });
      }
      
      // Get user's trades and uploads
      const trades = await storage.getTradesByUser(address as string);
      const userTokens = await storage.getTokensByCreator(address as string);
      
      // Convert to Irys transaction format
      const transactions = [
        // Upload transactions
        ...userTokens.map(token => ({
          id: token.irysTransactionId,
          timestamp: Math.floor(token.createdAt.getTime() / 1000),
          type: 'upload',
          amount: '0.005',
          status: 'confirmed',
          gasUsed: '21000',
          blockNumber: Math.floor(Math.random() * 1000000) + 500000,
          from: token.creatorAddress,
          to: 'irys_data_storage',
          dataSize: token.fileSize,
          tokenSymbol: 'IRYS'
        })),
        // Trade transactions
        ...trades.map(trade => ({
          id: trade.transactionHash,
          timestamp: Math.floor(trade.executedAt.getTime() / 1000),
          type: 'trade',
          amount: trade.amountIn,
          status: 'confirmed',
          gasUsed: '45000',
          blockNumber: Math.floor(Math.random() * 1000000) + 500000,
          from: trade.traderAddress,
          to: 'irys_amm_contract',
          tokenSymbol: 'DATA'
        }))
      ].sort((a, b) => b.timestamp - a.timestamp);
      
      res.json({ transactions });
    } catch (error) {
      console.error("Failed to get Irys transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Add liquidity to pool
  app.post("/api/liquidity/add", async (req, res) => {
    try {
      const { tokenA, tokenB, amountA, amountB, userAddress } = req.body;
      
      if (!tokenA || !tokenB || !amountA || !amountB || !userAddress) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      // Get or create liquidity pool
      let pool = await storage.getLiquidityPool(tokenA, tokenB);
      
      if (!pool) {
        // Create new pool
        pool = await storage.createLiquidityPool({
          tokenAAddress: tokenA,
          tokenBAddress: tokenB,
          reserveA: amountA,
          reserveB: amountB,
          totalLiquidity: Math.sqrt(parseFloat(amountA) * parseFloat(amountB)).toFixed(0)
        });
      } else {
        // Add to existing pool
        const newReserveA = parseFloat(pool.reserveA) + parseFloat(amountA);
        const newReserveB = parseFloat(pool.reserveB) + parseFloat(amountB);
        const newTotalLiquidity = parseFloat(pool.totalLiquidity) + Math.sqrt(parseFloat(amountA) * parseFloat(amountB));
        
        await storage.updateLiquidityPool(tokenA, tokenB, newReserveA.toString(), newReserveB.toString());
      }
      
      res.json({
        success: true,
        pool,
        message: "Liquidity added successfully"
      });
    } catch (error) {
      console.error("Failed to add liquidity:", error);
      res.status(500).json({ error: "Failed to add liquidity" });
    }
  });

  // Remove liquidity from pool
  app.post("/api/liquidity/remove", async (req, res) => {
    try {
      const { tokenA, tokenB, liquidity, userAddress } = req.body;
      
      if (!tokenA || !tokenB || !liquidity || !userAddress) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      const pool = await storage.getLiquidityPool(tokenA, tokenB);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      
      // Calculate tokens to return
      const liquidityPercent = parseFloat(liquidity) / parseFloat(pool.totalLiquidity);
      const amountA = parseFloat(pool.reserveA) * liquidityPercent;
      const amountB = parseFloat(pool.reserveB) * liquidityPercent;
      
      // Update pool reserves
      const newReserveA = parseFloat(pool.reserveA) - amountA;
      const newReserveB = parseFloat(pool.reserveB) - amountB;
      
      await storage.updateLiquidityPool(tokenA, tokenB, newReserveA.toString(), newReserveB.toString());
      
      res.json({
        success: true,
        amountA: amountA.toString(),
        amountB: amountB.toString(),
        message: "Liquidity removed successfully"
      });
    } catch (error) {
      console.error("Failed to remove liquidity:", error);
      res.status(500).json({ error: "Failed to remove liquidity" });
    }
  });

  // Get liquidity pool info
  app.get("/api/liquidity/pool", async (req, res) => {
    try {
      const { tokenA, tokenB } = req.query;
      
      if (!tokenA || !tokenB) {
        return res.status(400).json({ error: "Missing token parameters" });
      }
      
      const pool = await storage.getLiquidityPool(tokenA as string, tokenB as string);
      
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      
      res.json({ pool });
    } catch (error) {
      console.error("Failed to get pool info:", error);
      res.status(500).json({ error: "Failed to get pool info" });
    }
  });

  // Get user's liquidity positions
  app.get("/api/liquidity/positions", async (req, res) => {
    try {
      const { address } = req.query;
      
      if (!address) {
        return res.status(400).json({ error: "Address parameter is required" });
      }
      
      // Mock liquidity positions for demonstration
      const positions = [
        {
          tokenA: '0x1234567890123456789012345678901234567890',
          tokenB: '0x2345678901234567890123456789012345678901',
          liquidity: '1500.50',
          share: '0.25'
        }
      ];
      
      res.json({ positions });
    } catch (error) {
      console.error("Failed to get liquidity positions:", error);
      res.status(500).json({ error: "Failed to get liquidity positions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}