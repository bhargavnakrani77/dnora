import { Pool } from "pg";

// Global pool cache for Next.js hot-reloading in dev
const globalForDb = global as unknown as { pgPool?: Pool };

const connectionString = process.env.DATABASE_URL;

function createPool(): Pool {
  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "DATABASE_URL environment variable is missing. Please configure it in production environment variables."
      );
    }
    console.warn("DATABASE_URL is not set. Database operations will fail if invoked.");
    return new Pool();
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5, // Optimized for ~384MB RAM memory constraint
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Prevent queries hanging indefinitely
  });

  // Critical for production stability: prevent idle client errors from crashing Node process
  pool.on("error", (err) => {
    console.error("Unexpected error on idle PostgreSQL client pool:", err.message);
  });

  return pool;
}

export const db: Pool = globalForDb.pgPool || createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = db;
}

