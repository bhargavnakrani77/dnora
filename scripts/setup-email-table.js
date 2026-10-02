const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.resolve(__dirname, "../.env.local");
let connectionString = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      connectionString = trimmed.replace("DATABASE_URL=", "").trim();
      // Remove any surrounding quotes
      if ((connectionString.startsWith('"') && connectionString.endsWith('"')) ||
          (connectionString.startsWith("'") && connectionString.endsWith("'"))) {
        connectionString = connectionString.slice(1, -1);
      }
      break;
    }
  }
}

if (!connectionString) {
  connectionString = "postgresql://postgres.zzwgudzlpsfxyxqmywtv:KSXaSRYF3-Zq6hY@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";
}

console.log("Connecting using connectionString:", connectionString.replace(/:[^:]*@/, ":****@"));

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Connecting to PostgreSQL pooler...");
    const client = await pool.connect();
    console.log("Connected successfully!");

    console.log("Creating table public.email_verifications...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.email_verifications (
        email TEXT PRIMARY KEY,
        otp_hash TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        password_hash TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `);
    console.log("public.email_verifications table verified / created.");

    // Also check other required tables: orders, order_items, user_addresses
    console.log("Checking and ensuring orders, order_items, user_addresses tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.orders (
        id TEXT PRIMARY KEY,
        user_id UUID,
        customer_name TEXT,
        customer_email TEXT,
        total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
        subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'processing',
        payment_status TEXT NOT NULL DEFAULT 'paid',
        payment_method TEXT NOT NULL DEFAULT 'credit_card',
        tracking_number TEXT,
        carrier TEXT,
        estimated_delivery TIMESTAMPTZ,
        shipping_address JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );

      CREATE TABLE IF NOT EXISTS public.order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        product_id TEXT,
        product_title TEXT NOT NULL,
        product_image TEXT,
        color TEXT,
        size TEXT,
        price NUMERIC(10, 2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );

      CREATE TABLE IF NOT EXISTS public.user_addresses (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL,
        full_name TEXT NOT NULL,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'United Kingdom',
        phone TEXT,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `);
    console.log("All required account and verification tables verified / created!");

    // Grant public permissions if needed
    try {
      await client.query(`
        GRANT ALL ON TABLE public.email_verifications TO postgres, anon, authenticated, service_role;
        GRANT ALL ON TABLE public.orders TO postgres, anon, authenticated, service_role;
        GRANT ALL ON TABLE public.order_items TO postgres, anon, authenticated, service_role;
        GRANT ALL ON TABLE public.user_addresses TO postgres, anon, authenticated, service_role;
      `);
      console.log("Permissions granted!");
    } catch (e) {
      console.log("Permission grant notice:", e.message);
    }

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Current public tables in DB:", tablesRes.rows.map(r => r.table_name));

    client.release();
  } catch (err) {
    console.error("FATAL ERROR IN SCRIPT:", err);
  } finally {
    await pool.end();
  }
}

main();
