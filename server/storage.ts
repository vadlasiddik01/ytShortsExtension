import { 
  users, type User, type InsertUser,
  installations, type Installation, type InsertInstallation,
  settings, type Settings, type InsertSettings,
  statistics, type Statistics, type InsertStatistics,
  aggregateStats, type AggregateStats
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Installation operations
  getInstallation(installationId: string): Promise<Installation | undefined>;
  createInstallation(installation: InsertInstallation): Promise<Installation>;
  updateInstallationActivity(installationId: string): Promise<void>;
  
  // Settings operations
  getSettings(installationId: string): Promise<Settings | undefined>;
  saveSettings(settings: InsertSettings): Promise<Settings>;
  
  // Statistics operations
  getStatistics(installationId: string): Promise<Statistics | undefined>;
  updateStatistics(installationId: string, blockedDelta: number, hiddenDelta: number): Promise<Statistics>;
  resetStatistics(installationId: string): Promise<Statistics>;
  
  // Aggregate statistics operations
  updateAggregateStats(): Promise<void>;
  getLatestAggregateStats(): Promise<AggregateStats | undefined>;
}

// Memory storage for local development and testing
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private installationsMap: Map<string, Installation>;
  private settingsMap: Map<string, Settings>;
  private statisticsMap: Map<string, Statistics>;
  currentId: number;

  constructor() {
    this.usersMap = new Map();
    this.installationsMap = new Map();
    this.settingsMap = new Map();
    this.statisticsMap = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.usersMap.set(id, user);
    return user;
  }
  
  // Installation methods
  async getInstallation(installationId: string): Promise<Installation | undefined> {
    return this.installationsMap.get(installationId);
  }
  
  async createInstallation(installation: InsertInstallation): Promise<Installation> {
    const now = new Date();
    const newInstallation: Installation = {
      id: this.currentId++,
      installationId: installation.installationId,
      firstInstalled: now,
      lastActive: now,
      version: installation.version,
      browserInfo: installation.browserInfo
    };
    this.installationsMap.set(installation.installationId, newInstallation);
    return newInstallation;
  }
  
  async updateInstallationActivity(installationId: string): Promise<void> {
    const installation = this.installationsMap.get(installationId);
    if (installation) {
      installation.lastActive = new Date();
      this.installationsMap.set(installationId, installation);
    }
  }
  
  // Settings methods
  async getSettings(installationId: string): Promise<Settings | undefined> {
    return this.settingsMap.get(installationId);
  }
  
  async saveSettings(settings: InsertSettings): Promise<Settings> {
    const newSettings: Settings = {
      id: this.currentId++,
      installationId: settings.installationId,
      hideShorts: settings.hideShorts ?? true,
      blockShorts: settings.blockShorts ?? false,
      useStatistics: settings.useStatistics ?? true,
      lastUpdated: new Date()
    };
    this.settingsMap.set(settings.installationId, newSettings);
    return newSettings;
  }
  
  // Statistics methods
  async getStatistics(installationId: string): Promise<Statistics | undefined> {
    return this.statisticsMap.get(installationId);
  }
  
  async updateStatistics(installationId: string, blockedDelta: number, hiddenDelta: number): Promise<Statistics> {
    let stats = this.statisticsMap.get(installationId);
    
    if (!stats) {
      stats = {
        id: this.currentId++,
        installationId,
        date: new Date(),
        shortsBlocked: 0,
        shortsHidden: 0,
        lastReset: new Date()
      };
    }
    
    stats.shortsBlocked = (stats.shortsBlocked || 0) + blockedDelta;
    stats.shortsHidden = (stats.shortsHidden || 0) + hiddenDelta;
    
    this.statisticsMap.set(installationId, stats);
    return stats;
  }
  
  async resetStatistics(installationId: string): Promise<Statistics> {
    const now = new Date();
    const newStats: Statistics = {
      id: this.currentId++,
      installationId,
      date: now,
      shortsBlocked: 0,
      shortsHidden: 0,
      lastReset: now
    };
    
    this.statisticsMap.set(installationId, newStats);
    return newStats;
  }
  
  // Aggregate statistics methods
  async updateAggregateStats(): Promise<void> {
    // No-op in memory storage
  }
  
  async getLatestAggregateStats(): Promise<AggregateStats | undefined> {
    return {
      id: 1,
      date: new Date(),
      totalInstallations: this.installationsMap.size,
      totalActive: this.installationsMap.size,
      totalShortsBlocked: 0,
      totalShortsHidden: 0
    };
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Installation operations
  async getInstallation(installationId: string): Promise<Installation | undefined> {
    const [installation] = await db.select()
      .from(installations)
      .where(eq(installations.installationId, installationId));
    return installation;
  }
  
  async createInstallation(installation: InsertInstallation): Promise<Installation> {
    const [newInstallation] = await db.insert(installations)
      .values({
        ...installation,
        firstInstalled: new Date(),
        lastActive: new Date()
      })
      .returning();
    return newInstallation;
  }
  
  async updateInstallationActivity(installationId: string): Promise<void> {
    await db.update(installations)
      .set({ lastActive: new Date() })
      .where(eq(installations.installationId, installationId));
  }
  
  // Settings operations
  async getSettings(installationId: string): Promise<Settings | undefined> {
    const [setting] = await db.select()
      .from(settings)
      .where(eq(settings.installationId, installationId));
    return setting;
  }
  
  async saveSettings(setting: InsertSettings): Promise<Settings> {
    // Check if settings already exist
    const existingSettings = await this.getSettings(setting.installationId);
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db.update(settings)
        .set({
          hideShorts: setting.hideShorts,
          blockShorts: setting.blockShorts,
          useStatistics: setting.useStatistics,
          lastUpdated: new Date()
        })
        .where(eq(settings.installationId, setting.installationId))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db.insert(settings)
        .values({
          ...setting,
          lastUpdated: new Date()
        })
        .returning();
      return newSettings;
    }
  }
  
  // Statistics operations
  async getStatistics(installationId: string): Promise<Statistics | undefined> {
    const [stats] = await db.select()
      .from(statistics)
      .where(eq(statistics.installationId, installationId));
    return stats;
  }
  
  async updateStatistics(installationId: string, blockedDelta: number, hiddenDelta: number): Promise<Statistics> {
    // Check if statistics exist
    const existingStats = await this.getStatistics(installationId);
    
    if (existingStats) {
      // Update existing statistics
      const [updatedStats] = await db.update(statistics)
        .set({
          shortsBlocked: existingStats.shortsBlocked + blockedDelta,
          shortsHidden: existingStats.shortsHidden + hiddenDelta,
          date: new Date()
        })
        .where(eq(statistics.installationId, installationId))
        .returning();
      return updatedStats;
    } else {
      // Create new statistics
      const [newStats] = await db.insert(statistics)
        .values({
          installationId,
          shortsBlocked: blockedDelta,
          shortsHidden: hiddenDelta,
          date: new Date(),
          lastReset: new Date()
        })
        .returning();
      return newStats;
    }
  }
  
  async resetStatistics(installationId: string): Promise<Statistics> {
    const now = new Date();
    // Check if statistics exist
    const existingStats = await this.getStatistics(installationId);
    
    if (existingStats) {
      // Update existing statistics
      const [updatedStats] = await db.update(statistics)
        .set({
          shortsBlocked: 0,
          shortsHidden: 0,
          date: now,
          lastReset: now
        })
        .where(eq(statistics.installationId, installationId))
        .returning();
      return updatedStats;
    } else {
      // Create new statistics
      const [newStats] = await db.insert(statistics)
        .values({
          installationId,
          shortsBlocked: 0,
          shortsHidden: 0,
          date: now,
          lastReset: now
        })
        .returning();
      return newStats;
    }
  }
  
  // Aggregate statistics methods
  async updateAggregateStats(): Promise<void> {
    // Calculate total installations
    const [{ count: totalInstallations }] = await db
      .select({ count: installations.id })
      .from(installations)
      .limit(1);
    
    // Calculate active installations in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const [{ count: totalActive }] = await db
      .select({ count: installations.id })
      .from(installations)
      .where(installations.lastActive > oneWeekAgo)
      .limit(1);
    
    // Calculate total shorts blocked and hidden
    const allStats = await db.select().from(statistics);
    const totalShortsBlocked = allStats.reduce((sum, stat) => sum + stat.shortsBlocked, 0);
    const totalShortsHidden = allStats.reduce((sum, stat) => sum + stat.shortsHidden, 0);
    
    // Insert aggregate stats
    await db.insert(aggregateStats)
      .values({
        totalInstallations: Number(totalInstallations) || 0, 
        totalActive: Number(totalActive) || 0,
        totalShortsBlocked,
        totalShortsHidden,
        date: new Date()
      });
  }
  
  async getLatestAggregateStats(): Promise<AggregateStats | undefined> {
    const [latestStats] = await db
      .select()
      .from(aggregateStats)
      .orderBy(desc(aggregateStats.date))
      .limit(1);
    
    return latestStats;
  }
}

// Use database storage in production, memory storage in development
export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new MemStorage();
