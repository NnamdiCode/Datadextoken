import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create the connection
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from '@shared/schema';