import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless'; // <-- corrected
import ws from "ws";
import * as schema from "@shared/schema";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Setup WebSocket for serverless Neon connections
neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create database pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Setup Drizzle ORM
export const db = drizzle(pool, { schema });

// Successful connection log
console.log("Database connection established.");

export default db;
