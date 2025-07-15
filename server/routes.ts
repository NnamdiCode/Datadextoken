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
      const { name, description, creatorAddress } = req.body;
      
      if (!name || !creatorAddress) {
        return res.status(400).json({ error: "Name and creator address are required" });
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
        symbol: 'DATA',
        description: description || '',
        creatorAddress,
        fileSize: dataFile.size,
        fileType: dataFile.mimetype || 'application/octet-stream',
        fileName: dataFile.originalname,
        imageUrl,
        totalSupply: '1000000',
        currentPrice: 0.005, // 0.005 IRYS base fee
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
      const tokens = await storage.getTokensByCreator(address);
      
      res.json({ tokens });
    } catch (error) {
      console.error("Failed to get tokens by creator:", error);
      res.status(500).json({ error: "Failed to get tokens by creator" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}