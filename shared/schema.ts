import { pgTable, text, serial, integer, boolean, timestamp, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Extension installation table - tracks unique installations with privacy in mind
export const installations = pgTable("installations", {
  id: serial("id").primaryKey(),
  installationId: varchar("installation_id", { length: 100 }).notNull().unique(),
  firstInstalled: timestamp("first_installed").defaultNow().notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  browserInfo: text("browser_info"),
});

export const insertInstallationSchema = createInsertSchema(installations).pick({
  installationId: true,
  version: true,
  browserInfo: true,
});

// Anonymous extension settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  installationId: varchar("installation_id", { length: 100 }).notNull().references(() => installations.installationId, { onDelete: 'cascade' }),
  hideShorts: boolean("hide_shorts").default(true),
  blockShorts: boolean("block_shorts").default(false),
  useStatistics: boolean("use_statistics").default(true),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  installationId: true,
  hideShorts: true,
  blockShorts: true,
  useStatistics: true,
});

// Anonymous usage statistics - completely privacy focused
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  installationId: varchar("installation_id", { length: 100 }).notNull().references(() => installations.installationId, { onDelete: 'cascade' }),
  date: timestamp("date").defaultNow().notNull(),
  shortsBlocked: integer("shorts_blocked").default(0),
  shortsHidden: integer("shorts_hidden").default(0),
  lastReset: timestamp("last_reset").defaultNow().notNull(),
});

export const insertStatisticsSchema = createInsertSchema(statistics).pick({
  installationId: true,
  shortsBlocked: true,
  shortsHidden: true,
});

// Anonymous aggregate statistics for analytics - no personal data
export const aggregateStats = pgTable("aggregate_stats", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  totalInstallations: integer("total_installations").default(0),
  totalActive: integer("total_active").default(0),
  totalShortsBlocked: integer("total_shorts_blocked").default(0),
  totalShortsHidden: integer("total_shorts_hidden").default(0),
});

// Types exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertInstallation = z.infer<typeof insertInstallationSchema>;
export type Installation = typeof installations.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type InsertStatistics = z.infer<typeof insertStatisticsSchema>;
export type Statistics = typeof statistics.$inferSelect;

export type AggregateStats = typeof aggregateStats.$inferSelect;
