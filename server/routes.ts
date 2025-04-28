import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { v4 as uuidv4 } from "uuid";
import {
  insertInstallationSchema,
  insertSettingsSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // =================================================================
  // EXTENSION INSTALLATION ROUTES
  // =================================================================
  
  // Register a new installation
  app.post("/api/extension/register", async (req: Request, res: Response) => {
    try {
      // Generate an installation ID if none provided
      const installationData = {
        installationId: req.body.installationId || uuidv4(),
        version: req.body.version || "1.0.0",
        browserInfo: req.body.browserInfo || ""
      };
      
      // Validate installation data
      const validatedInstallation = insertInstallationSchema.parse(installationData);
      
      // Check if installation already exists
      const existingInstallation = await storage.getInstallation(validatedInstallation.installationId);
      
      if (existingInstallation) {
        // Update last active timestamp
        await storage.updateInstallationActivity(validatedInstallation.installationId);
        return res.status(200).json({ installationId: existingInstallation.installationId });
      } else {
        // Create new installation
        const installation = await storage.createInstallation(validatedInstallation);
        return res.status(201).json({ installationId: installation.installationId });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // =================================================================
  // EXTENSION SETTINGS ROUTES
  // =================================================================
  
  // Get settings for an installation
  app.get("/api/extension/settings/:installationId", async (req: Request, res: Response) => {
    try {
      const { installationId } = req.params;
      
      // Get settings
      const settings = await storage.getSettings(installationId);
      
      if (!settings) {
        // Return default settings if none found
        return res.status(200).json({
          installationId,
          hideShorts: true,
          blockShorts: false,
          useStatistics: true
        });
      }
      
      return res.status(200).json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Save settings for an installation
  app.post("/api/extension/settings", async (req: Request, res: Response) => {
    try {
      // Validate settings data
      const validatedSettings = insertSettingsSchema.parse(req.body);
      
      // Save settings
      const settings = await storage.saveSettings(validatedSettings);
      
      return res.status(200).json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // =================================================================
  // EXTENSION STATISTICS ROUTES
  // =================================================================
  
  // Get statistics for an installation
  app.get("/api/extension/statistics/:installationId", async (req: Request, res: Response) => {
    try {
      const { installationId } = req.params;
      
      // Get statistics
      const statistics = await storage.getStatistics(installationId);
      
      if (!statistics) {
        // Return default statistics if none found
        return res.status(200).json({
          installationId,
          shortsBlocked: 0,
          shortsHidden: 0,
          lastReset: new Date()
        });
      }
      
      return res.status(200).json(statistics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Update statistics for an installation
  app.post("/api/extension/statistics/update", async (req: Request, res: Response) => {
    try {
      const { installationId, blockedDelta, hiddenDelta } = req.body;
      
      if (!installationId) {
        return res.status(400).json({ error: "Installation ID is required" });
      }
      
      // Update statistics
      const statistics = await storage.updateStatistics(
        installationId,
        blockedDelta || 0,
        hiddenDelta || 0
      );
      
      return res.status(200).json(statistics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Reset statistics for an installation
  app.post("/api/extension/statistics/reset", async (req: Request, res: Response) => {
    try {
      const { installationId } = req.body;
      
      if (!installationId) {
        return res.status(400).json({ error: "Installation ID is required" });
      }
      
      // Reset statistics
      const statistics = await storage.resetStatistics(installationId);
      
      return res.status(200).json(statistics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // =================================================================
  // DEVELOPER TOOLS ROUTES
  // =================================================================

  // Get aggregate statistics (admin only)
  app.get("/api/admin/statistics/aggregate", async (req: Request, res: Response) => {
    try {
      // Update aggregate statistics
      await storage.updateAggregateStats();
      
      // Get latest aggregate statistics
      const statistics = await storage.getLatestAggregateStats();
      
      return res.status(200).json(statistics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}
