import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Add your Supabase connection string to .env.");
}

// Reuse one client across hot reloads in development.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

// `prepare: false` is required by Supabase's transaction pooler (port 6543).
const client = globalForDb.pgClient ?? postgres(databaseUrl, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle({ client });
