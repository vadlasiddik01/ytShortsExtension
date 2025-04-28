import { neon, neonConfig } from '@neondatabase/serverless';  
import { drizzle } from 'drizzle-orm/neon-serverless'; 
import ws from 'ws';
import * as schema from '@shared/schema';  // Ensure the schema path is correct
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Setup WebSocket for Neon connections (only needed if using WebSocket serverless)
neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Create a connection pool to the Neon database
export const pool = neon(process.env.DATABASE_URL);

// Setup Drizzle ORM with the connection pool
export const db = drizzle(pool as any, { schema });

// Successful database connection log
console.log("Database connection established.");

// Export db instance for use in other parts of the application
export default db;
