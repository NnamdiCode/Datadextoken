import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { irysService } from "./irysService";
import { contractService } from "./services/contracts";
import { uploadRequestSchema, tradeRequestSchema } from "@shared/schema";

// Configure multer for file uploads with 100MB limit
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // For data files, allow most file types but filter out executables
    if (file.fieldname === 'file') {
      const allowedExtensions = /\.(txt|json|csv|pdf|png|jpg|jpeg|gif|mp3|mp4|doc|docx|xls|xlsx|zip|svg|webp|bmp|tiff|psd|ai|eps|raw|mov|avi|wmv|flv|webm|mkv|m4v|3gp|wav|aac|flac|ogg|wma|m4a|sql|db|xml|yaml|yml|md|rtf|odt|ods|odp|ppt|pptx|pages|numbers|key|sketch|fig|xd|blend|obj|fbx|dae|3ds|max|maya|dwg|dxf|step|iges|stl|ply|tar|gz|rar|7z|bz2|xz|tar\.gz|tar\.bz2)$/i;
      if (allowedExtensions.test(file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error("File type not allowed for data files"));
      }
    }
    // For image files, restrict to image formats only
    else if (file.fieldname === 'image') {
      const allowedImageTypes = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i;
      if (allowedImageTypes.test(file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error("Only image files (JPG, PNG, GIF, WebP, SVG, BMP, TIFF) are allowed for token images"));
      }
    } else {
      cb(new Error("Invalid field name"));
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
        currentPrice: (parseFloat(calculatedPrice) || 0.005).toString(), // Use calculated price
        volume24h: "0",
        priceChange24h: "0",
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
      res.status(500).json({ error: "Failed to get tokens by creator", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get trading quote using Uniswap-like AMM (x*y=k)
  app.get("/api/trade/quote", async (req, res) => {
    try {
      const { fromToken, toToken, amountIn } = req.query;
      const amount = amountIn; // Support both parameter names
      
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
      const inputAmount = parseFloat(amount as string);
      
      // Apply 0.3% fee (like Uniswap)
      const amountInWithFee = inputAmount * 0.997;
      
      // Calculate output amount using AMM formula
      const outputAmount = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
      
      // Calculate price impact
      const priceImpact = ((inputAmount / reserveIn) * 100);
      
      // Fee calculation
      const fee = (inputAmount * 0.003).toFixed(6);
      
      res.json({
        quote: {
          fromToken: fromTokenData.tokenAddress,
          toToken: toTokenData.tokenAddress,
          amountIn: amount,
          amountOut: outputAmount.toFixed(6),
          exchangeRate: (outputAmount / inputAmount).toFixed(6),
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

  // Execute token trade using AMM with real Irys blockchain recording
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
      
      // Get or create liquidity pool
      let pool = await storage.getLiquidityPool(fromToken, toToken);
      if (!pool) {
        // Create initial liquidity pool with default reserves if it doesn't exist
        const initialReserveA = (Math.random() * 1000000 + 100000).toFixed(0); // 100k-1M tokens
        const initialReserveB = (Math.random() * 1000000 + 100000).toFixed(0);
        
        pool = await storage.createLiquidityPool({
          tokenAAddress: fromToken,
          tokenBAddress: toToken,
          reserveA: initialReserveA,
          reserveB: initialReserveB,
          totalLiquidity: Math.sqrt(parseFloat(initialReserveA) * parseFloat(initialReserveB)).toFixed(0)
        });
        
        console.log(`🏊 Created new liquidity pool for ${fromToken} <-> ${toToken}`);
      }
      
      // Record trade transaction on Irys blockchain
      const tradeTransaction = await irysService.recordTradeTransaction({
        fromToken,
        toToken,
        amountIn,
        amountOut,
        trader: traderAddress,
        timestamp: Date.now()
      });
      
      // Update pool reserves after trade (AMM mechanism)
      const newReserveA = parseFloat(pool.reserveA) + parseFloat(amountIn);
      const newReserveB = parseFloat(pool.reserveB) - parseFloat(amountOut);
      
      await storage.updateLiquidityPool(fromToken, toToken, newReserveA.toString(), newReserveB.toString());
      
      // Create trade record with real Irys transaction ID
      const trade = await storage.createTrade({
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amountIn: amountIn.toString(),
        amountOut: amountOut.toString(),
        traderAddress,
        transactionHash: tradeTransaction.transactionId,
        pricePerToken: (parseFloat(amountOut) / parseFloat(amountIn)).toString(),
        feeAmount: (parseFloat(amountIn) * 0.003).toString()
      });
      
      res.json({
        success: true,
        trade,
        transactionHash: tradeTransaction.transactionId,
        explorerUrl: tradeTransaction.explorerUrl,
        poolUpdated: {
          newReserveA: newReserveA.toString(),
          newReserveB: newReserveB.toString()
        },
        message: "Trade executed successfully and recorded on Irys blockchain"
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
          timestamp: Math.floor((token.createdAt || new Date()).getTime() / 1000),
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
          timestamp: Math.floor((trade.executedAt || new Date()).getTime() / 1000),
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

  // Irys VM Smart Contract Endpoints
  
  // Record Irys transaction
  app.post("/api/transactions/irys", async (req, res) => {
    try {
      const transactionData = req.body;
      
      // Transform the data to match storage schema
      const irysTransaction = await storage.createIrysTransaction({
        hash: transactionData.hash,
        fromAddress: transactionData.from,
        toAddress: transactionData.to,
        value: transactionData.value,
        gasUsed: transactionData.gasUsed,
        status: transactionData.status,
        timestamp: new Date(transactionData.timestamp),
        type: transactionData.type,
        data: transactionData.data,
        blockNumber: transactionData.blockNumber,
        blockHash: transactionData.blockHash,
      });
      
      res.json({ success: true, transaction: irysTransaction });
    } catch (error) {
      console.error("Failed to record Irys transaction:", error);
      res.status(500).json({ error: "Failed to record transaction" });
    }
  });

  // Get Irys transactions for user
  app.get("/api/transactions/irys/:userAddress", async (req, res) => {
    try {
      const { userAddress } = req.params;
      const { limit } = req.query;
      
      const transactions = await storage.getIrysTransactionsByUser(
        userAddress,
        limit ? parseInt(limit as string) : 50
      );
      
      res.json({ transactions });
    } catch (error) {
      console.error("Failed to get user Irys transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Create token on Irys VM
  app.post("/api/irys/create-token", async (req, res) => {
    try {
      const { name, symbol, dataHash, metadata, creatorAddress } = req.body;
      
      if (!name || !symbol || !dataHash || !metadata || !creatorAddress) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      // Generate mock token address and transaction hash
      const tokenAddress = '0x' + Math.random().toString(16).substr(2, 40);
      const transactionHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      // Create Irys transaction record
      const irysTransaction = await storage.createIrysTransaction({
        hash: transactionHash,
        fromAddress: creatorAddress,
        toAddress: '0x1234567890123456789012345678901234567890', // Registry contract
        value: '0.005', // 0.005 IRYS fee
        gasUsed: '65000',
        status: 'success',
        timestamp: new Date(),
        type: 'token_creation',
        data: {
          name,
          symbol,
          dataHash,
          tokenAddress,
          metadata: JSON.parse(metadata)
        }
      });
      
      res.json({
        success: true,
        tokenAddress,
        transactionHash,
        irysTransaction
      });
    } catch (error) {
      console.error("Failed to create token on Irys VM:", error);
      res.status(500).json({ error: "Token creation failed" });
    }
  });

  // Trading chart endpoints
  app.get("/api/trading/pair-data", async (req, res) => {
    try {
      const { fromToken, toToken, timeframe = '1D' } = req.query;

      if (!fromToken || !toToken || fromToken === toToken) {
        return res.status(400).json({ error: 'Valid token pair required' });
      }

      // Get token data
      const tokens = await storage.getAllDataTokens();
      const fromTokenData = tokens.find((t: any) => t.tokenAddress === fromToken);
      const toTokenData = tokens.find((t: any) => t.tokenAddress === toToken);

      if (!fromTokenData || !toTokenData) {
        return res.status(404).json({ error: 'Token not found' });
      }

      // Get recent trades for this pair to calculate real metrics
      const trades = await storage.getTradesByUser("all");
      const pairTrades = trades.filter((t: any) => 
        (t.fromToken === fromToken && t.toToken === toToken) ||
        (t.fromToken === toToken && t.toToken === fromToken)
      );

      // Calculate current exchange rate
      const currentPrice = (fromTokenData as any).currentPrice / (toTokenData as any).currentPrice;

      // Generate realistic price history based on timeframe
      const priceHistory = generateChartData(currentPrice, timeframe as string, pairTrades);

      // Calculate 24h statistics
      const now = Date.now();
      const yesterday = now - (24 * 60 * 60 * 1000);
      const recent24hPoints = priceHistory.filter((p: any) => p.timestamp >= yesterday);
      
      const prices24h = recent24hPoints.map((p: any) => p.price);
      const volumes24h = recent24hPoints.map((p: any) => p.volume);
      
      const high24h = Math.max(...prices24h);
      const low24h = Math.min(...prices24h);
      const volume24h = volumes24h.reduce((a: number, b: number) => a + b, 0);
      
      // Calculate price change (current vs 24h ago)
      const price24hAgo = recent24hPoints.length > 0 ? recent24hPoints[0].price : currentPrice;
      const priceChange24h = currentPrice - price24hAgo;
      const percentChange24h = price24hAgo > 0 ? (priceChange24h / price24hAgo) * 100 : 0;

      const pairData = {
        currentPrice,
        priceChange24h,
        percentChange24h,
        volume24h,
        high24h,
        low24h,
        priceHistory
      };

      res.json(pairData);
    } catch (error) {
      console.error('Error fetching pair data:', error);
      res.status(500).json({ error: 'Failed to fetch trading data' });
    }
  });

  app.get("/api/trading/market-stats", async (req, res) => {
    try {
      const tokens = await storage.getAllDataTokens();
      const trades = await storage.getTradesByUser("all");
      
      const stats = {
        totalTokens: tokens.length,
        totalTrades: trades.length,
        totalVolume24h: trades
          .filter((t: any) => t.timestamp && t.timestamp > (Date.now() - 24 * 60 * 60 * 1000))
          .reduce((sum: number, t: any) => sum + parseFloat(t.amountIn || '0'), 0),
        activeTokens: tokens.filter((t: any) => (t as any).currentPrice > 0).length
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching market stats:', error);
      res.status(500).json({ error: 'Failed to fetch market statistics' });
    }
  });

  // Execute swap on Irys VM
  app.post("/api/irys/swap", async (req, res) => {
    try {
      const { tokenIn, tokenOut, amountIn, minAmountOut, userAddress } = req.body;
      
      if (!tokenIn || !tokenOut || !amountIn || !minAmountOut || !userAddress) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      // Calculate swap amount using AMM formula
      const pool = await storage.getLiquidityPool(tokenIn, tokenOut);
      if (!pool) {
        return res.status(400).json({ error: "Liquidity pool not found" });
      }
      
      const reserveIn = parseFloat(pool.reserveA);
      const reserveOut = parseFloat(pool.reserveB);
      const amountInFloat = parseFloat(amountIn);
      
      // AMM formula: x * y = k, with 0.3% fee
      const amountInWithFee = amountInFloat * 0.997; // 0.3% fee
      const amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
      
      if (amountOut < parseFloat(minAmountOut)) {
        return res.status(400).json({ error: "Slippage tolerance exceeded" });
      }
      
      // Update pool reserves
      await storage.updateLiquidityPool(
        tokenIn,
        tokenOut,
        (reserveIn + amountInFloat).toString(),
        (reserveOut - amountOut).toString()
      );
      
      // Generate transaction hash
      const transactionHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      // Create Irys transaction record
      const irysTransaction = await storage.createIrysTransaction({
        hash: transactionHash,
        fromAddress: userAddress,
        toAddress: '0x2345678901234567890123456789012345678901', // AMM contract
        value: tokenIn === '0x4567890123456789012345678901234567890123' ? amountIn : '0',
        gasUsed: '80000',
        status: 'success',
        timestamp: new Date(),
        type: 'swap',
        data: {
          tokenIn,
          tokenOut,
          amountIn,
          amountOut: amountOut.toString(),
          minAmountOut
        }
      });
      
      res.json({
        success: true,
        amountOut: amountOut.toString(),
        transactionHash,
        irysTransaction
      });
    } catch (error) {
      console.error("Failed to execute swap on Irys VM:", error);
      res.status(500).json({ error: "Swap execution failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate realistic chart data
function generateChartData(basePrice: number, timeframe: string, trades: any[]) {
  const now = Date.now();
  const points: any[] = [];
  
  let intervals: number;
  let intervalMs: number;
  
  switch (timeframe) {
    case '1H':
      intervals = 60;
      intervalMs = 60 * 1000; // 1 minute intervals
      break;
    case '1D':
      intervals = 24;
      intervalMs = 60 * 60 * 1000; // 1 hour intervals
      break;
    case '7D':
      intervals = 28;
      intervalMs = 6 * 60 * 60 * 1000; // 6 hour intervals
      break;
    case '30D':
      intervals = 30;
      intervalMs = 24 * 60 * 60 * 1000; // 1 day intervals
      break;
    default:
      intervals = 24;
      intervalMs = 60 * 60 * 1000;
  }

  let currentPrice = basePrice;
  
  // Use real trade data to influence price movements
  const recentTrades = trades.filter((t: any) => t.timestamp && t.timestamp > (now - (intervals * intervalMs)));
  
  for (let i = intervals; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    const periodStart = timestamp;
    const periodEnd = timestamp + intervalMs;
    
    // Find trades in this time period
    const periodTrades = recentTrades.filter((t: any) => 
      t.timestamp >= periodStart && t.timestamp < periodEnd
    );
    
    // Calculate price movement based on trades and market simulation
    let priceChange = 0;
    
    if (periodTrades.length > 0) {
      // Real trade data influences price
      const totalVolume = periodTrades.reduce((sum: number, t: any) => sum + parseFloat(t.amountIn || '0'), 0);
      const avgTradeSize = totalVolume / periodTrades.length;
      
      // Larger trades have more price impact
      const volumeImpact = Math.log(avgTradeSize + 1) * 0.001;
      priceChange += volumeImpact * (Math.random() > 0.5 ? 1 : -1);
    }
    
    // Add realistic market simulation
    const volatility = 0.02; // 2% volatility
    const trend = Math.sin(i / 10) * 0.005; // Slight trend
    const randomChange = (Math.random() - 0.5) * volatility;
    
    priceChange += trend + randomChange;
    
    // Apply price change
    currentPrice = Math.max(0.000001, currentPrice * (1 + priceChange));
    
    // Calculate OHLC data
    const open = i === intervals ? basePrice : points[points.length - 1]?.close || currentPrice;
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    // Calculate volume (higher during active trading periods)
    let volume = Math.random() * 50000 + 10000;
    if (periodTrades.length > 0) {
      volume += periodTrades.reduce((sum: number, t: any) => sum + parseFloat(t.amountIn || '0'), 0);
    }

    points.push({
      timestamp,
      price: currentPrice,
      volume,
      high,
      low,
      open,
      close
    });
  }
  
  return points;
}